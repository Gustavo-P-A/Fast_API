from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from database import pegar_conexao, fetch_one, fetch_all, execute, ConnCommitRoute
from calculos import preco_item, recalcular_preco_pedido
from schemas import ResponsePedidoSchema, ItemPedidoCriacaoSchema
from core.security import verificar_token

order_router = APIRouter(prefix="/order", tags=["order"], route_class=ConnCommitRoute)


def _shape_item_simples(r: dict, prefixo: str = "isi_") -> dict:
    return {
        "id": r[f"{prefixo}id"], "tipo": r[f"{prefixo}tipo"], "nome": r[f"{prefixo}nome"],
        "categoria_id": r[f"{prefixo}categoria_id"], "grade_id": r[f"{prefixo}grade_id"],
        "preco": r[f"{prefixo}preco"], "descricao": r[f"{prefixo}descricao"],
        "ativo": r[f"{prefixo}ativo"], "imagem_url": r[f"{prefixo}imagem_url"],
    }


def _expirar_pix_se_necessario(conn, pedido: dict) -> dict:
    # Se o pedido está aguardando Pix e o prazo de 1h já passou, cancela
    # automaticamente. Chamado sempre que um pedido é lido (montagem da
    # resposta), então não depende de nenhum job/cron rodando em paralelo.
    if pedido["status"] == 'AGUARDANDO_PAGAMENTO_PIX' and pedido["pix_expira_em"]:
        if datetime.now(timezone.utc) > pedido["pix_expira_em"]:
            execute(conn, "UPDATE pedidos SET status = 'CANCELADO' WHERE id = %s", (pedido["id"],))
            pedido["status"] = 'CANCELADO'
    return pedido


def _montar_resposta_pedido(conn, pedido_id: int):

    pedido = fetch_one(conn, "SELECT * FROM pedidos WHERE id = %s", (pedido_id,))
    if not pedido:
        return None

    pedido = _expirar_pix_se_necessario(conn, pedido)

    itens = []
    for item in fetch_all(conn, "SELECT * FROM itens_pedido WHERE pedido_id = %s", (pedido_id,)):
        tamanho = fetch_one(conn, "SELECT * FROM tamanhos WHERE id = %s", (item["tamanho_id"],))

        sabores_rel = [
            {
                "id": r["id"], "sabor_id": r["sabor_id"],
                "sabor_rel": {"id": r["sabor_id"], "nome": r["nome"], "descricao": r["descricao"], "imagem_url": r["imagem_url"]},
            }
            for r in fetch_all(
                conn,
                """
                SELECT ips.id, ips.sabor_id, s.nome, s.descricao, s.imagem_url
                FROM item_pedido_sabor ips JOIN sabores s ON s.id = ips.sabor_id
                WHERE ips.item_pedido_id = %s
                """,
                (item["id"],),
            )
        ]

        adicionais_rel = [
            {
                "id": r["id"], "preco_adicional_id": r["preco_adicional_id"], "partes": r["partes"],
                "preco_adicional_rel": {
                    "id": r["pa_id"], "preco": r["pa_preco"],
                    "adicional_rel": {"id": r["a_id"], "nome": r["a_nome"], "ativo": r["a_ativo"]},
                },
            }
            for r in fetch_all(
                conn,
                """
                SELECT iad.id, iad.preco_adicional_id, iad.partes,
                       pa.id AS pa_id, pa.preco AS pa_preco,
                       a.id AS a_id, a.nome AS a_nome, a.ativo AS a_ativo
                FROM item_adicionais iad
                JOIN preco_adicional pa ON pa.id = iad.preco_adicional_id
                JOIN adicionais a ON a.id = pa.adicional_id
                WHERE iad.item_pedido_id = %s
                """,
                (item["id"],),
            )
        ]

        ingredientes_rel = [
            {"id": r["id"], "item_simples_id": r["item_simples_id"], "quantidade": r["quantidade"], "item_simples_rel": _shape_item_simples(r)}
            for r in fetch_all(
                conn,
                """
                SELECT ipi.id, ipi.item_simples_id, ipi.quantidade,
                       isi.id AS isi_id, isi.tipo AS isi_tipo, isi.nome AS isi_nome, isi.categoria_id AS isi_categoria_id,
                       isi.grade_id AS isi_grade_id, isi.preco AS isi_preco, isi.descricao AS isi_descricao,
                       isi.ativo AS isi_ativo, isi.imagem_url AS isi_imagem_url
                FROM item_pedido_ingrediente ipi JOIN itens_simples isi ON isi.id = ipi.item_simples_id
                WHERE ipi.item_pedido_id = %s
                """,
                (item["id"],),
            )
        ]

        itens.append({
            "id": item["id"], "quantidade": item["quantidade"], "tamanho_id": item["tamanho_id"],
            "observacoes": item["observacoes"], "tamanho_rel": tamanho,
            "sabores_rel": sabores_rel, "adicionais_rel": adicionais_rel, "ingredientes_rel": ingredientes_rel,
            "preco_total": preco_item(conn, item["id"]),
        })

    bebidas_rel = [
        {
            "id": r["id"], "item_simples_id": r["item_simples_id"], "quantidade": r["quantidade"],
            "item_simples_rel": _shape_item_simples(r), "preco_total": r["isi_preco"] * r["quantidade"],
        }
        for r in fetch_all(
            conn,
            """
            SELECT ipb.id, ipb.item_simples_id, ipb.quantidade,
                   isi.id AS isi_id, isi.tipo AS isi_tipo, isi.nome AS isi_nome, isi.categoria_id AS isi_categoria_id,
                   isi.grade_id AS isi_grade_id, isi.preco AS isi_preco, isi.descricao AS isi_descricao,
                   isi.ativo AS isi_ativo, isi.imagem_url AS isi_imagem_url
            FROM item_pedido_bebida ipb JOIN itens_simples isi ON isi.id = ipb.item_simples_id
            WHERE ipb.pedido_id = %s
            """,
            (pedido_id,),
        )
    ]

    return {
        "id": pedido["id"], "status": pedido["status"], "preco": pedido["preco"],
        "endereco_id": pedido["endereco_id"], "formato_de_pagamento": pedido["formato_de_pagamento"],
        "created_at": pedido["created_at"], "troco_para": pedido["troco_para"],
        "forma_pagamento_id": pedido["forma_pagamento_id"], "parcelas": pedido["parcelas"],
        "pix_codigo": pedido["pix_codigo"], "pix_expira_em": pedido["pix_expira_em"],
        "itens": itens, "bebidas_rel": bebidas_rel,
    }


def _validar_permite_borda(conn, item_pedido_id: int):
    # regra do meio a meio: se qualquer sabor do item bloquear borda, bloqueia pra todos
    sabores = fetch_all(
        conn,
        "SELECT s.nome, s.permite_borda FROM item_pedido_sabor ips JOIN sabores s ON s.id = ips.sabor_id WHERE ips.item_pedido_id = %s",
        (item_pedido_id,),
    )
    for s in sabores:
        if not s["permite_borda"]:
            raise HTTPException(status_code=400, detail=f'O sabor {s["nome"]} não permite borda')


def _validar_permite_ingrediente(conn, item_pedido_id: int):
    sabores = fetch_all(
        conn,
        "SELECT s.nome, s.permite_ingrediente FROM item_pedido_sabor ips JOIN sabores s ON s.id = ips.sabor_id WHERE ips.item_pedido_id = %s",
        (item_pedido_id,),
    )
    for s in sabores:
        if not s["permite_ingrediente"]:
            raise HTTPException(status_code=400, detail=f'O sabor {s["nome"]} não permite ingrediente adicional')


@order_router.post('/pedido')
async def criar_pedido(conn = Depends(pegar_conexao), usuario_token: dict = Depends(verificar_token)):
    novo_pedido = fetch_one(conn, "INSERT INTO pedidos (usuario_id) VALUES (%s) RETURNING id", (usuario_token["id"],))
    return {'mensagem': 'pedido criado com sucesso', 'id': novo_pedido["id"]}


@order_router.put('/pedido/cancelar/{id_pedido}')
async def cancelar_pedido(id_pedido: int, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_token)):
    pedido = fetch_one(conn, "SELECT id, usuario_id FROM pedidos WHERE id = %s", (id_pedido,))
    if not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')
    if not usuario["adm"] and usuario["id"] != pedido["usuario_id"]:
        raise HTTPException(status_code=401, detail='vc nao autorizacao para fazer esta modificação')
    execute(conn, "UPDATE pedidos SET status = 'CANCELADO' WHERE id = %s", (id_pedido,))
    return {'mensagem': f'Pedido numero: {id_pedido} cancelado com sucesso', 'pedido': _montar_resposta_pedido(conn, id_pedido)}


@order_router.post('/pedidos/adicionar-item/{id_pedido}')
async def adicionar_item_pedido(
    id_pedido: int,
    item_pedido_schema: ItemPedidoCriacaoSchema,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    pedido = fetch_one(conn, "SELECT id, usuario_id FROM pedidos WHERE id = %s", (id_pedido,))
    if not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')
    if not usuario["adm"] and usuario["id"] != pedido["usuario_id"]:
        raise HTTPException(status_code=401, detail='Você não tem autorização para fazer está modificação')

    tamanho = fetch_one(conn, "SELECT * FROM tamanhos WHERE id = %s", (item_pedido_schema.tamanho_id,))
    if not tamanho:
        raise HTTPException(status_code=404, detail='Tamanho não encontrado')

    sabor_ids = item_pedido_schema.sabor_ids
    if not (1 <= len(sabor_ids) <= tamanho["qtd_sabores"]):
        raise HTTPException(status_code=400, detail=f'Este tamanho aceita de 1 a {tamanho["qtd_sabores"]} sabor(es)')

    sabores = fetch_all(conn, "SELECT id, nome FROM sabores WHERE id = ANY(%s)", (list(set(sabor_ids)),))
    if len(sabores) != len(set(sabor_ids)):
        raise HTTPException(status_code=404, detail='Um ou mais sabores não encontrados')

    com_preco = {
        r["sabor_id"] for r in fetch_all(
            conn, "SELECT sabor_id FROM preco_pizza WHERE sabor_id = ANY(%s) AND tamanho_id = %s",
            (sabor_ids, tamanho["id"]),
        )
    }
    for sabor in sabores:
        if sabor["id"] not in com_preco:
            raise HTTPException(status_code=400, detail=f'Sabor {sabor["nome"]} não disponível no tamanho {tamanho["nome"]}')

    item_pedido = fetch_one(
        conn,
        "INSERT INTO itens_pedido (quantidade, pedido_id, tamanho_id, observacoes) VALUES (%s, %s, %s, %s) RETURNING id",
        (item_pedido_schema.quantidade, id_pedido, tamanho["id"], item_pedido_schema.observacoes),
    )

    for sabor_id in sabor_ids:
        execute(conn, "INSERT INTO item_pedido_sabor (item_pedido_id, sabor_id) VALUES (%s, %s)", (item_pedido["id"], sabor_id))

    preco_pedido = recalcular_preco_pedido(conn, id_pedido)
    return {'mensagem': f'Item adicionado ao pedido {id_pedido}', 'item_id': item_pedido["id"], 'preco_pedido': preco_pedido}


@order_router.delete('/pedidos/remover-item/{id_item_pedido}')
async def remover_item_pedido(id_item_pedido: int, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_token)):
    item_pedido = fetch_one(conn, "SELECT id, pedido_id FROM itens_pedido WHERE id = %s", (id_item_pedido,))
    if not item_pedido:
        raise HTTPException(status_code=404, detail='Item do pedido não encontrado')

    pedido = fetch_one(conn, "SELECT id, usuario_id FROM pedidos WHERE id = %s", (item_pedido["pedido_id"],))
    if not usuario["adm"] and usuario["id"] != pedido["usuario_id"]:
        raise HTTPException(status_code=401, detail='Você não tem autorização para fazer está modificação')

    # item_pedido_sabor/item_adicionais/item_pedido_ingrediente têm ON DELETE
    # CASCADE (sql/schema.sql), então somem sozinhos junto com o item.
    execute(conn, "DELETE FROM itens_pedido WHERE id = %s", (id_item_pedido,))
    recalcular_preco_pedido(conn, pedido["id"])

    total_itens = fetch_one(conn, "SELECT COUNT(*) AS total FROM itens_pedido WHERE pedido_id = %s", (pedido["id"],))
    return {
        'mensagem': 'Item removido do pedido com sucesso',
        'itens_pedido': total_itens["total"],
        'pedido': _montar_resposta_pedido(conn, pedido["id"]),
    }


@order_router.post('/ingredientes')
async def adicionar_ingrediente(
    id_pedido: int, id_item_pedido: int, id_item_simples: int,
    quantidade: int = 1,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    pedido = fetch_one(conn, "SELECT id, usuario_id FROM pedidos WHERE id = %s", (id_pedido,))
    item = fetch_one(conn, "SELECT id FROM itens_pedido WHERE id = %s", (id_item_pedido,))
    item_simples = fetch_one(
        conn, "SELECT id FROM itens_simples WHERE id = %s AND tipo = 'INGREDIENTE' AND ativo = true", (id_item_simples,)
    )
    if not item or not pedido or not item_simples:
        raise HTTPException(status_code=404, detail='Pedido, item ou ingrediente não encontrado')
    if not usuario["adm"] and usuario["id"] != pedido["usuario_id"]:
        raise HTTPException(status_code=403, detail='Você não tem autorização para fazer está modificação')
    if quantidade < 1:
        raise HTTPException(status_code=400, detail='quantidade deve ser pelo menos 1')

    _validar_permite_ingrediente(conn, item["id"])

    vinculo = fetch_one(
        conn, "SELECT id FROM item_pedido_ingrediente WHERE item_pedido_id = %s AND item_simples_id = %s",
        (item["id"], item_simples["id"]),
    )
    if vinculo:
        execute(conn, "UPDATE item_pedido_ingrediente SET quantidade = quantidade + %s WHERE id = %s", (quantidade, vinculo["id"]))
    else:
        execute(
            conn, "INSERT INTO item_pedido_ingrediente (item_pedido_id, item_simples_id, quantidade) VALUES (%s, %s, %s)",
            (item["id"], item_simples["id"], quantidade),
        )

    preco_pedido = recalcular_preco_pedido(conn, id_pedido)
    return {'mensagem': f'Ingrediente adicionado ao pedido {id_pedido}', 'preco_pedido': preco_pedido}


@order_router.delete('/ingredientes/{id_item_pedido}/{id_item_simples}')
async def remover_ingrediente(
    id_item_pedido: int, id_item_simples: int,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    item = fetch_one(conn, "SELECT id, pedido_id FROM itens_pedido WHERE id = %s", (id_item_pedido,))
    if not item:
        raise HTTPException(status_code=404, detail='Item do pedido não encontrado')

    pedido = fetch_one(conn, "SELECT id, usuario_id FROM pedidos WHERE id = %s", (item["pedido_id"],))
    if not usuario["adm"] and usuario["id"] != pedido["usuario_id"]:
        raise HTTPException(status_code=403, detail='Você não tem autorização para fazer está modificação')

    vinculo = fetch_one(
        conn, "SELECT id FROM item_pedido_ingrediente WHERE item_pedido_id = %s AND item_simples_id = %s",
        (id_item_pedido, id_item_simples),
    )
    if not vinculo:
        raise HTTPException(status_code=404, detail='Ingrediente não encontrado neste item')

    execute(conn, "DELETE FROM item_pedido_ingrediente WHERE id = %s", (vinculo["id"],))
    preco_pedido = recalcular_preco_pedido(conn, pedido["id"])
    return {'mensagem': 'Ingrediente removido do pedido com sucesso', 'preco_pedido': preco_pedido}


@order_router.post('/bebidas')
async def adicionar_bebida(
    id_pedido: int, id_item_simples: int,
    quantidade: int = 1,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    pedido = fetch_one(conn, "SELECT id, usuario_id FROM pedidos WHERE id = %s", (id_pedido,))
    if not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')
    if not usuario["adm"] and usuario["id"] != pedido["usuario_id"]:
        raise HTTPException(status_code=403, detail='Você não tem autorização para fazer está modificação')

    item_simples = fetch_one(
        conn, "SELECT id FROM itens_simples WHERE id = %s AND tipo = 'BEBIDA' AND ativo = true", (id_item_simples,)
    )
    if not item_simples:
        raise HTTPException(status_code=404, detail='Bebida não encontrada')
    if quantidade < 1:
        raise HTTPException(status_code=400, detail='quantidade deve ser pelo menos 1')

    vinculo = fetch_one(
        conn, "SELECT id FROM item_pedido_bebida WHERE pedido_id = %s AND item_simples_id = %s",
        (id_pedido, item_simples["id"]),
    )
    if vinculo:
        execute(conn, "UPDATE item_pedido_bebida SET quantidade = quantidade + %s WHERE id = %s", (quantidade, vinculo["id"]))
    else:
        execute(
            conn, "INSERT INTO item_pedido_bebida (pedido_id, item_simples_id, quantidade) VALUES (%s, %s, %s)",
            (id_pedido, item_simples["id"], quantidade),
        )

    preco_pedido = recalcular_preco_pedido(conn, id_pedido)
    return {'mensagem': f'Bebida adicionada ao pedido {id_pedido}', 'preco_pedido': preco_pedido}


@order_router.delete('/bebidas/{id_pedido}/{id_item_simples}')
async def remover_bebida(
    id_pedido: int, id_item_simples: int,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    pedido = fetch_one(conn, "SELECT id, usuario_id FROM pedidos WHERE id = %s", (id_pedido,))
    if not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')
    if not usuario["adm"] and usuario["id"] != pedido["usuario_id"]:
        raise HTTPException(status_code=403, detail='Você não tem autorização para fazer está modificação')

    vinculo = fetch_one(
        conn, "SELECT id FROM item_pedido_bebida WHERE pedido_id = %s AND item_simples_id = %s",
        (id_pedido, id_item_simples),
    )
    if not vinculo:
        raise HTTPException(status_code=404, detail='Bebida não encontrada neste pedido')

    execute(conn, "DELETE FROM item_pedido_bebida WHERE id = %s", (vinculo["id"],))
    preco_pedido = recalcular_preco_pedido(conn, id_pedido)
    return {'mensagem': 'Bebida removida do pedido com sucesso', 'preco_pedido': preco_pedido}


@order_router.post('/adicionais')
async def adicionar_adicionais(
    id_pedido: int, id_item_pedido: int, id_adicional: int, id_tamanho: int,
    partes: int = 1,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    pedido = fetch_one(conn, "SELECT id, usuario_id FROM pedidos WHERE id = %s", (id_pedido,))
    item = fetch_one(conn, "SELECT id, tamanho_id FROM itens_pedido WHERE id = %s", (id_item_pedido,))
    preco_adicional = fetch_one(
        conn, "SELECT id FROM preco_adicional WHERE adicional_id = %s AND tamanho_id = %s", (id_adicional, id_tamanho)
    )
    if not item or not preco_adicional or not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')
    if not usuario["adm"] and usuario["id"] != pedido["usuario_id"]:
        raise HTTPException(status_code=403, detail='Você não tem autorização para fazer está modificação')

    _validar_permite_borda(conn, item["id"])

    if partes < 1:
        raise HTTPException(status_code=400, detail='partes deve ser pelo menos 1')

    tamanho = fetch_one(conn, "SELECT qtd_bordas FROM tamanhos WHERE id = %s", (item["tamanho_id"],))
    total_tamanho = tamanho["qtd_bordas"]
    partes_usadas = fetch_one(conn, "SELECT COALESCE(SUM(partes), 0) AS total FROM item_adicionais WHERE item_pedido_id = %s", (item["id"],))
    if partes_usadas["total"] + partes > total_tamanho:
        raise HTTPException(status_code=400, detail=f'Esse tamanho só permite {total_tamanho} parte(s) de borda no total')

    execute(
        conn, "INSERT INTO item_adicionais (item_pedido_id, preco_adicional_id, partes) VALUES (%s, %s, %s)",
        (item["id"], preco_adicional["id"], partes),
    )
    preco_pedido = recalcular_preco_pedido(conn, id_pedido)
    return {'mensagem': f'Item adicionado ao pedido {id_pedido}', 'preco_pedido': preco_pedido}


@order_router.delete('/pedidos/remover-item/{id_item_pedido}/{id_adicional}/{id_tamanho}')
async def remover_adicional(
    id_item_pedido: int, id_adicional: int, id_tamanho: int,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    item = fetch_one(conn, "SELECT id, pedido_id FROM itens_pedido WHERE id = %s", (id_item_pedido,))
    if not item:
        raise HTTPException(status_code=404, detail='Item do pedido não encontrado')

    pedido = fetch_one(conn, "SELECT id, usuario_id FROM pedidos WHERE id = %s", (item["pedido_id"],))
    if not usuario["adm"] and usuario["id"] != pedido["usuario_id"]:
        raise HTTPException(status_code=403, detail='Você não tem autorização para fazer está modificação')

    preco_adicional = fetch_one(
        conn, "SELECT id FROM preco_adicional WHERE adicional_id = %s AND tamanho_id = %s", (id_adicional, id_tamanho)
    )
    if not preco_adicional:
        raise HTTPException(status_code=404, detail='Adicional não encontrado')

    vinculo = fetch_one(
        conn, "SELECT id FROM item_adicionais WHERE item_pedido_id = %s AND preco_adicional_id = %s",
        (id_item_pedido, preco_adicional["id"]),
    )
    if not vinculo:
        raise HTTPException(status_code=404, detail='Borda não encontrada neste item')

    execute(conn, "DELETE FROM item_adicionais WHERE id = %s", (vinculo["id"],))
    recalcular_preco_pedido(conn, pedido["id"])

    total_itens = fetch_one(conn, "SELECT COUNT(*) AS total FROM itens_pedido WHERE pedido_id = %s", (pedido["id"],))
    return {
        'mensagem': 'Adicional removido do pedido com sucesso',
        'itens_pedido': total_itens["total"],
        'pedido': _montar_resposta_pedido(conn, pedido["id"]),
    }


@order_router.get('/pedido/{id_pedido}', response_model=ResponsePedidoSchema)
async def visualizar_pedido(id_pedido: int, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_token)):
    pedido = fetch_one(conn, "SELECT usuario_id FROM pedidos WHERE id = %s", (id_pedido,))
    if not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')
    if not usuario["adm"] and usuario["id"] != pedido["usuario_id"]:
        raise HTTPException(status_code=401, detail='Você não tem autorização para fazer está modificação')
    return _montar_resposta_pedido(conn, id_pedido)


@order_router.get('/listar/meus-pedidos', response_model=list[ResponsePedidoSchema])
async def listar_pedidos(conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_token)):
    ids = fetch_all(conn, "SELECT id FROM pedidos WHERE usuario_id = %s", (usuario["id"],))
    return [_montar_resposta_pedido(conn, p["id"]) for p in ids]


@order_router.put('/pedido/entregue/{id_pedido}')
async def pedido_entregue(id_pedido: int, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_token)):
    pedido = fetch_one(conn, "SELECT id, usuario_id FROM pedidos WHERE id = %s", (id_pedido,))
    if not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')
    if usuario["id"] != pedido["usuario_id"]:
        raise HTTPException(status_code=403, detail='Você não tem autorização para fazer está modificação')

    execute(conn, "UPDATE pedidos SET status = 'ENTREGUE' WHERE id = %s", (id_pedido,))
    return {'mensagem': 'Pedido entregue com sucesso', 'pedido': _montar_resposta_pedido(conn, id_pedido)}