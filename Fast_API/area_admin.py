from fastapi import APIRouter, Depends, HTTPException, Request
from database import pegar_conexao, fetch_one, fetch_all, execute, ConnCommitRoute
from dependsadm import verificar_adm
from schemas import GradeCriarSchema, TamanhosSchema, AdicionaisSchema, PrecoAdicionalSchema, GradeSchema, GradeSaboresSchema, CategoriaSchema
from psycopg import errors
from enum import Enum
import os

area_admin = APIRouter(prefix='/admin', tags=['admin'], route_class=ConnCommitRoute)


@area_admin.post('/tamanhos')
async def tamanho_pizza(tamanho_schema: TamanhosSchema, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    execute(
        conn,
        "INSERT INTO tamanhos (nome, qtd_sabores, qtd_bordas) VALUES (%s, %s, %s)",
        (tamanho_schema.nome, tamanho_schema.qtd_sabores, tamanho_schema.qtd_bordas),
    )
    return {'mensagem': 'Tamanho adicionado com sucesso'}

@area_admin.post('/adicionais')
async def criar_adicional(adicionais_schema: AdicionaisSchema, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    novo = fetch_one(conn, "INSERT INTO adicionais (nome) VALUES (%s) RETURNING id", (adicionais_schema.nome,))
    return {'mensagem': 'Adicional criado com sucesso', 'id': novo["id"]}


@area_admin.get('/listar/adicionais')
async def listar_adicionais(conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    adicionais = fetch_all(conn, "SELECT * FROM adicionais")
    resultado = []
    for a in adicionais:
        precos = fetch_all(
            conn,
            """
            SELECT pa.id, pa.tamanho_id, t.nome AS tamanho_nome, pa.preco
            FROM preco_adicional pa
            JOIN tamanhos t ON t.id = pa.tamanho_id
            WHERE pa.adicional_id = %s
            """,
            (a["id"],),
        )
        resultado.append({
            'id': a["id"],
            'nome': a["nome"],
            'ativo': a["ativo"],
            'precos': [dict(p) for p in precos],
        })
    return resultado


@area_admin.put('/adicionais/{id_adicional}/preco/{id_tamanho}')
async def upsert_preco_adicional(
    id_adicional: int, id_tamanho: int, preco_adicional_schema: PrecoAdicionalSchema,
    conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)
):
    preco = fetch_one(
        conn,
        "SELECT id FROM preco_adicional WHERE adicional_id = %s AND tamanho_id = %s",
        (id_adicional, id_tamanho),
    )
    if preco:
        execute(conn, "UPDATE preco_adicional SET preco = %s WHERE id = %s", (preco_adicional_schema.preco, preco["id"]))
    else:
        execute(
            conn,
            "INSERT INTO preco_adicional (adicional_id, tamanho_id, preco) VALUES (%s, %s, %s)",
            (id_adicional, id_tamanho, preco_adicional_schema.preco),
        )
    return {'mensagem': 'Preço salvo com sucesso'}


@area_admin.patch('/adicionais/{id}/status')
async def toggle_status_adicional(id: int, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    resultado = fetch_one(conn, "UPDATE adicionais SET ativo = NOT ativo WHERE id = %s RETURNING id, ativo", (id,))
    if not resultado:
        raise HTTPException(status_code=404, detail='Adicional não encontrado')
    return {'id': resultado["id"], 'ativo': resultado["ativo"]}


@area_admin.delete('/adicionais/{id}')
async def deletar_adicional(id: int, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    adicional = fetch_one(conn, "SELECT id FROM adicionais WHERE id = %s", (id,))
    if not adicional:
        raise HTTPException(status_code=404, detail='Adicional não encontrado')
    execute(conn, "DELETE FROM preco_adicional WHERE adicional_id = %s", (id,))
    execute(conn, "DELETE FROM adicionais WHERE id = %s", (id,))
    return {'mensagem': 'Adicional deletado com sucesso'}


class TipoStatus(str, Enum):
    CONFIRMADO = 'CONFIRMADO'
    EM_PREPARO = 'EM PREPARO'
    SAIU_PARA_ENTREGA = 'SAIU PARA ENTREGA'
    ENTREGUE = 'ENTREGUE'
    CANCELADO = 'CANCELADO'


@area_admin.put('/mudar_status/{id_pedido}')
async def muda_status(id_pedido: int, tipo_status: TipoStatus, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    pedido = fetch_one(conn, "SELECT status FROM pedidos WHERE id = %s", (id_pedido,))
    if not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')

    # Bloqueia cancelamento após saiu para entrega
    nao_cancelaveis = {'SAIU PARA ENTREGA', 'ENTREGUE'}
    if tipo_status == TipoStatus.CANCELADO and pedido["status"] in nao_cancelaveis:
        raise HTTPException(status_code=400, detail='Pedido não pode ser cancelado neste estágio')

    execute(conn, "UPDATE pedidos SET status = %s WHERE id = %s", (tipo_status.value, id_pedido))
    return {'mensagem': 'Status editado com sucesso'}


@area_admin.get('/listar/pedidos-cliente')
async def listar_pedidos_cliente(
    status: str = None,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_adm)
):
    query = """
        SELECT p.id, p.status, p.preco, p.formato_de_pagamento, p.created_at,
               u.nome AS cliente_nome, u.email AS cliente_email,
               COUNT(ip.id) AS total_itens
        FROM pedidos p
        LEFT JOIN usuarios u ON u.id = p.usuario_id
        LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id
    """
    params = ()
    if status:
        query += " WHERE p.status = %s"
        params = (status.upper(),)
    query += " GROUP BY p.id, u.nome, u.email ORDER BY p.id DESC"

    pedidos = fetch_all(conn, query, params)
    return [
        {
            'id': p["id"],
            'status': p["status"],
            'preco': p["preco"],
            'formato_de_pagamento': p["formato_de_pagamento"],
            'created_at': p["created_at"].isoformat() if p["created_at"] else None,
            'cliente_nome': p["cliente_nome"],
            'cliente_email': p["cliente_email"],
            'total_itens': p["total_itens"],
        }
        for p in pedidos
    ]


@area_admin.put('/editar/tamanho/{id_tamanho}')
async def editar_tamanho(id_tamanho: int, tamanho_schema: TamanhosSchema, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    resultado = fetch_one(
        conn,
        "UPDATE tamanhos SET nome = %s, qtd_sabores = %s WHERE id = %s RETURNING id",
        (tamanho_schema.nome, tamanho_schema.qtd_sabores, id_tamanho),
    )
    if not resultado:
        raise HTTPException(status_code=404, detail='Tamanho não encontrado')
    return {'mensagem': 'Tamanho editado com sucesso'}


@area_admin.delete('/deletar/tamanho/{id_tamanho}')
async def deletar_tamanho(id_tamanho: int, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    tamanho = fetch_one(conn, "SELECT id FROM tamanhos WHERE id = %s", (id_tamanho,))
    if not tamanho:
        raise HTTPException(status_code=404, detail='Tamanho não encontrado')
    try:
        execute(conn, "DELETE FROM tamanhos WHERE id = %s", (id_tamanho,))
    except errors.ForeignKeyViolation:
        conn.rollback()
        raise HTTPException(status_code=409, detail='Este tamanho está em uso (preços, pedidos ou produtos) e não pode ser excluído')
    return {'msg': 'Tamanho deletado com sucesso'}


@area_admin.delete('/deletar/preco/{id_preco}')
async def deletar_preco(id_preco: int, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    preco = fetch_one(conn, "SELECT id FROM preco_pizza WHERE id = %s", (id_preco,))
    if not preco:
        raise HTTPException(status_code=404, detail='Preco não encontrado')
    execute(conn, "DELETE FROM preco_pizza WHERE id = %s", (id_preco,))
    return {'msg': 'Preco deletado com sucesso'}


@area_admin.post('/grade')
async def criar_grade(grade_schema: GradeCriarSchema, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    execute(conn, "INSERT INTO grade (nome, posicao) VALUES (%s, %s)", (grade_schema.nome, grade_schema.posicao))
    return {'mensagem': 'Grade criada'}


@area_admin.get('/listar/grade', response_model=list[GradeSchema])
async def listar_grade(conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    return fetch_all(conn, "SELECT * FROM grade")


@area_admin.put('/grade/{id_grade}')
async def editar_grade(id_grade: int, grade_schema: GradeCriarSchema, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    resultado = fetch_one(
        conn,
        "UPDATE grade SET nome = %s, posicao = %s WHERE id = %s RETURNING id",
        (grade_schema.nome, grade_schema.posicao, id_grade),
    )
    if not resultado:
        raise HTTPException(status_code=404, detail='Grade não encontrada')
    return {'mensagem': 'Grade atualizada'}


@area_admin.delete('/deletar/grade/{id_grade}')
async def deletar_grade(id_grade: int, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    grade = fetch_one(conn, "SELECT id FROM grade WHERE id = %s", (id_grade,))
    if not grade:
        raise HTTPException(status_code=404, detail='Grade não encontrada')
    em_uso_sabor = fetch_one(conn, "SELECT id FROM grade_sabores WHERE grade_id = %s", (id_grade,))
    em_uso_monte_pizza = fetch_one(conn, "SELECT id FROM produto_monte_pizza WHERE grade_id = %s", (id_grade,))
    if em_uso_sabor or em_uso_monte_pizza:
        raise HTTPException(status_code=400, detail='Esta grade está em uso por um ou mais produtos. Troque a grade deles antes de excluir.')
    try:
        execute(conn, "DELETE FROM grade WHERE id = %s", (id_grade,))
    except errors.ForeignKeyViolation:
        # cobre item_simples.grade_id, que o código original não checava explicitamente
        conn.rollback()
        raise HTTPException(status_code=400, detail='Esta grade está em uso por um ou mais produtos. Troque a grade deles antes de excluir.')
    return {'mensagem': 'Grade excluida'}


@area_admin.post('/grade_sabores')
async def grade_sabores(grade_sabores_schema: GradeSaboresSchema, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    execute(
        conn,
        "INSERT INTO grade_sabores (grade_id, sabores_id) VALUES (%s, %s)",
        (grade_sabores_schema.id_grade, grade_sabores_schema.id_sabores),
    )
    return {'mensagem': 'Grade de sabores criada'}


@area_admin.post('/categoria')
async def criar_categoria(categoria_schema: CategoriaSchema, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    execute(conn, "INSERT INTO categoria (nome) VALUES (%s)", (categoria_schema.nome,))
    return {'mensagem': 'Categoria criada'}


@area_admin.get('/listar/categoria')
async def listar_categoria(conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    return fetch_all(conn, "SELECT * FROM categoria")


@area_admin.put('/categoria/{id_categoria}')
async def editar_categoria(id_categoria: int, categoria_schema: CategoriaSchema, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    resultado = fetch_one(conn, "UPDATE categoria SET nome = %s WHERE id = %s RETURNING id", (categoria_schema.nome, id_categoria))
    if not resultado:
        raise HTTPException(status_code=404, detail='Categoria não encontrada')
    return {'mensagem': 'Categoria atualizada'}


@area_admin.delete('/categoria/{id_categoria}')
async def deletar_categoria(id_categoria: int, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    categoria = fetch_one(conn, "SELECT id FROM categoria WHERE id = %s", (id_categoria,))
    if not categoria:
        raise HTTPException(status_code=404, detail='Categoria não encontrada')
    em_uso_sabor = fetch_one(conn, "SELECT id FROM sabores WHERE categoria_id = %s", (id_categoria,))
    em_uso_monte_pizza = fetch_one(conn, "SELECT id FROM produto_monte_pizza WHERE categoria_id = %s", (id_categoria,))
    if em_uso_sabor or em_uso_monte_pizza:
        raise HTTPException(status_code=400, detail='Esta categoria está em uso por um ou mais produtos. Troque a categoria deles antes de excluir.')
    try:
        execute(conn, "DELETE FROM categoria WHERE id = %s", (id_categoria,))
    except errors.ForeignKeyViolation:
        # cobre item_simples.categoria_id, que o código original não checava explicitamente
        conn.rollback()
        raise HTTPException(status_code=400, detail='Esta categoria está em uso por um ou mais produtos. Troque a categoria deles antes de excluir.')
    return {'mensagem': 'Categoria excluida'}


@area_admin.get('/listar/tamanho')
async def listar_tamanho(conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    return fetch_all(conn, "SELECT * FROM tamanhos")

@area_admin.get('/clientes')
async def listar_clientes(conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    clientes = fetch_all(
        conn,
        """
        SELECT u.id, u.nome, u.email, u.ativo,
               COUNT(p.id) AS total_pedidos,
               COALESCE(SUM(p.preco), 0) AS gasto_total
        FROM usuarios u
        JOIN pedidos p ON p.usuario_id = u.id
        WHERE u.adm = false
        GROUP BY u.id
        """,
    )
    return [
        {
            'id': c["id"],
            'nome': c["nome"],
            'email': c["email"],
            'ativo': c["ativo"],
            'total_pedidos': c["total_pedidos"],
            'gasto_total': round(c["gasto_total"], 2),
        }
        for c in clientes
    ]

@area_admin.get('/clientes/{id}/pedidos')
async def pedidos_do_cliente(id: int, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    cliente = fetch_one(conn, "SELECT id FROM usuarios WHERE id = %s AND adm = false", (id,))
    if not cliente:
        raise HTTPException(status_code=404, detail='Cliente não encontrado')
    pedidos = fetch_all(
        conn,
        "SELECT id, status, preco, formato_de_pagamento FROM pedidos WHERE usuario_id = %s",
        (id,),
    )
    return [
        {
            'id': p["id"],
            'status': p["status"],
            'preco': p["preco"],
            'formato_de_pagamento': p["formato_de_pagamento"],
        }
        for p in pedidos
    ]


@area_admin.patch('/produtos/mover-grade')
async def mover_produtos_grade(
    body: dict,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_adm)
):
    sabor_ids = body.get("sabor_ids", [])
    monte_pizza_ids = body.get("monte_pizza_ids", [])
    item_simples_ids = body.get("item_simples_ids", [])
    grade_id = body.get("grade_id")
    if not (sabor_ids or monte_pizza_ids or item_simples_ids) or not grade_id:
        raise HTTPException(status_code=400, detail="sabor_ids/monte_pizza_ids/item_simples_ids e grade_id são obrigatórios")
    grade = fetch_one(conn, "SELECT id, nome FROM grade WHERE id = %s", (grade_id,))
    if not grade:
        raise HTTPException(status_code=404, detail="Grade não encontrada")

    if sabor_ids:
        atualizados = fetch_all(conn, "SELECT sabores_id FROM grade_sabores WHERE sabores_id = ANY(%s)", (sabor_ids,))
        ids_atualizados = {r["sabores_id"] for r in atualizados}
        if ids_atualizados:
            execute(conn, "UPDATE grade_sabores SET grade_id = %s WHERE sabores_id = ANY(%s)", (grade_id, list(ids_atualizados)))
        novos = [sid for sid in sabor_ids if sid not in ids_atualizados]
        for sid in novos:
            execute(conn, "INSERT INTO grade_sabores (grade_id, sabores_id) VALUES (%s, %s)", (grade_id, sid))

    if monte_pizza_ids:
        execute(conn, "UPDATE produto_monte_pizza SET grade_id = %s WHERE id = ANY(%s)", (grade_id, monte_pizza_ids))

    if item_simples_ids:
        execute(conn, "UPDATE itens_simples SET grade_id = %s WHERE id = ANY(%s)", (grade_id, item_simples_ids))

    total = len(sabor_ids) + len(monte_pizza_ids) + len(item_simples_ids)
    return {"mensagem": f"{total} produto(s) movido(s) para a grade {grade['nome']}"}


@area_admin.get('/listar/produtos-por-grade')
async def produtos_por_grade(
    request: Request,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_adm)
):
    grades = fetch_all(conn, "SELECT * FROM grade ORDER BY posicao")
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    resultado = []
    for grade in grades:
        sabores = fetch_all(
            conn,
            """
            SELECT s.* FROM sabores s
            JOIN grade_sabores gs ON gs.sabores_id = s.id
            WHERE gs.grade_id = %s AND s.ativo = true
            """,
            (grade["id"],),
        )
        monte_pizzas = fetch_all(
            conn,
            """
            SELECT p.*, t.nome AS tamanho_nome, t.qtd_sabores AS tamanho_qtd_sabores
            FROM produto_monte_pizza p
            JOIN tamanhos t ON t.id = p.tamanho_id
            WHERE p.grade_id = %s AND p.ativo = true
            """,
            (grade["id"],),
        )
        bebidas = fetch_all(
            conn,
            "SELECT * FROM itens_simples WHERE grade_id = %s AND tipo = 'BEBIDA' AND ativo = true",
            (grade["id"],),
        )
        produtos = []
        for s in sabores:
            menor_preco = fetch_one(
                conn, "SELECT preco FROM preco_pizza WHERE sabor_id = %s ORDER BY preco ASC LIMIT 1", (s["id"],)
            )
            imagem = f"{base_url}{s['imagem_url']}" if s["imagem_url"] and not s["imagem_url"].startswith("http") else s["imagem_url"]
            produtos.append({
                "tipo": "sabor",
                "id": s["id"],
                "nome": s["nome"],
                "descricao": s["descricao"],
                "imagem_url": imagem,
                "menor_preco": menor_preco["preco"] if menor_preco else None,
            })
        for mp in monte_pizzas:
            imagem_mp = f"{base_url}{mp['imagem_url']}" if mp["imagem_url"] and not mp["imagem_url"].startswith("http") else mp["imagem_url"]
            qtd_sabores = mp["qtd_sabores_override"] if mp["qtd_sabores_override"] else mp["tamanho_qtd_sabores"]
            produtos.append({
                "tipo": "monte_pizza",
                "id": mp["id"],
                "nome": mp["nome"],
                "descricao": mp["descricao"] or f"{mp['tamanho_nome']} — até {qtd_sabores} sabor(es)",
                "imagem_url": imagem_mp,
                "menor_preco": None,
            })
        for b in bebidas:
            imagem_b = f"{base_url}{b['imagem_url']}" if b["imagem_url"] and not b["imagem_url"].startswith("http") else b["imagem_url"]
            produtos.append({
                "tipo": "bebida",
                "id": b["id"],
                "nome": b["nome"],
                "descricao": b["descricao"],
                "imagem_url": imagem_b,
                "menor_preco": b["preco"],
            })
        resultado.append({
            "grade_id": grade["id"],
            "grade_nome": grade["nome"],
            "posicao": grade["posicao"],
            "produtos": produtos,
        })
    return resultado


@area_admin.delete('/deletar/sabor/{id_sabor}')
async def deletar_sabor(id_sabor: int, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    sabor = fetch_one(conn, "SELECT id, imagem_url FROM sabores WHERE id = %s", (id_sabor,))
    if not sabor:
        raise HTTPException(status_code=404, detail='Sabor não encontrado')

    # Já foi vendido em algum pedido? Aí não dá pra apagar de verdade,
    # apagar quebraria o histórico. Só inativa.
    ja_vendido = fetch_one(conn, "SELECT id FROM item_pedido_sabor WHERE sabor_id = %s LIMIT 1", (id_sabor,))
    if ja_vendido:
        execute(conn, "UPDATE sabores SET ativo = false WHERE id = %s", (id_sabor,))
        return {'mensagem': 'Este sabor já foi vendido em pedidos anteriores, então não pode ser excluído. Ele foi inativado e não aparece mais no cardápio.'}

    # Nunca foi vendido: pode excluir de verdade, cascateando configuração atual
    if sabor["imagem_url"] and not sabor["imagem_url"].startswith('http'):
        caminho = sabor["imagem_url"].lstrip('/')
        if os.path.exists(caminho):
            os.remove(caminho)
    execute(conn, "DELETE FROM grade_sabores WHERE sabores_id = %s", (id_sabor,))
    execute(conn, "DELETE FROM preco_pizza WHERE sabor_id = %s", (id_sabor,))
    execute(conn, "DELETE FROM monte_pizza_sabor WHERE sabor_id = %s", (id_sabor,))
    execute(conn, "DELETE FROM sabores WHERE id = %s", (id_sabor,))
    return {'mensagem': 'Sabor excluído'}


@area_admin.patch('/pedidos/{id_pedido}/confirmar-pix')
async def confirmar_pagamento_pix(id_pedido: int, conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_adm)):
    pedido = fetch_one(conn, "SELECT id, status FROM pedidos WHERE id = %s", (id_pedido,))
    if not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')
    if pedido["status"] != 'AGUARDANDO_PAGAMENTO_PIX':
        raise HTTPException(status_code=400, detail='Este pedido não está aguardando pagamento via Pix')

    execute(conn, "UPDATE pedidos SET status = 'CONFIRMADO' WHERE id = %s", (id_pedido,))
    return {'mensagem': 'Pagamento confirmado'}