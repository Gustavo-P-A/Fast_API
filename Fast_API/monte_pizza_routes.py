from fastapi import APIRouter, Depends, HTTPException, Request
from database import pegar_conexao, fetch_one, fetch_all, execute, ConnCommitRoute
from dependsadm import verificar_adm
from calculos import qtd_sabores_efetiva
from schemas import ProdutoMonteSuaPizzaSchema, MonteSuaPizzaSaborSchema

monte_pizza_routes = APIRouter(prefix='/admin/monte-pizza', tags=['monte-sua-pizza'], route_class=ConnCommitRoute)


def _resolver_imagem(url, request: Request):
    if url and not url.startswith('http'):
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        return f'{base_url}{url}'
    return url


def _buscar_produto_com_tamanho(conn, id: int):
    return fetch_one(
        conn,
        """
        SELECT p.*, t.nome AS tamanho_nome
        FROM produto_monte_pizza p
        JOIN tamanhos t ON t.id = p.tamanho_id
        WHERE p.id = %s
        """,
        (id,),
    )


def _montar_resposta(produto: dict, conn, request: Request):
    vinculos = fetch_all(
        conn,
        """
        SELECT s.* FROM sabores s
        JOIN monte_pizza_sabor mps ON mps.sabor_id = s.id
        WHERE mps.produto_monte_pizza_id = %s
        """,
        (produto["id"],),
    )
    sabores_resp = []
    for sabor in vinculos:
        if not sabor["ativo"] or not sabor["disponivel_monte_sua_pizza"]:
            continue
        preco_db = fetch_one(
            conn,
            "SELECT preco FROM preco_pizza WHERE sabor_id = %s AND tamanho_id = %s",
            (sabor["id"], produto["tamanho_id"]),
        )
        sabores_resp.append({
            'id': sabor["id"],
            'nome': sabor["nome"],
            'preco': preco_db["preco"] if preco_db else None,
        })

    return {
        'id': produto["id"],
        'nome': produto["nome"],
        'tamanho_id': produto["tamanho_id"],
        'tamanho_nome': produto["tamanho_nome"],
        'categoria_id': produto["categoria_id"],
        'grade_id': produto["grade_id"],
        'imagem_url': _resolver_imagem(produto["imagem_url"], request),
        'descricao': produto["descricao"],
        'ativo': produto["ativo"],
        'qtd_sabores_override': produto["qtd_sabores_override"],
        'qtd_sabores_efetiva': qtd_sabores_efetiva(conn, produto["id"]),
        'permite_borda': produto["permite_borda"],
        'permite_ingrediente': produto["permite_ingrediente"],
        'sabores': sabores_resp,
    }


@monte_pizza_routes.post('/')
async def criar_monte_pizza(
    schema: ProdutoMonteSuaPizzaSchema,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    tamanho = fetch_one(conn, "SELECT id FROM tamanhos WHERE id = %s", (schema.tamanho_id,))
    if not tamanho:
        raise HTTPException(status_code=404, detail='Tamanho não encontrado')

    produto = fetch_one(
        conn,
        """
        INSERT INTO produto_monte_pizza
            (nome, tamanho_id, categoria_id, grade_id, imagem_url, descricao, ativo,
             qtd_sabores_override, permite_borda, permite_ingrediente)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            schema.nome, schema.tamanho_id, schema.categoria_id, schema.grade_id, schema.imagem_url,
            schema.descricao, schema.ativo, schema.qtd_sabores_override, schema.permite_borda,
            schema.permite_ingrediente,
        ),
    )
    return {'mensagem': 'Monte Sua Pizza criado com sucesso', 'id': produto["id"]}


@monte_pizza_routes.get('/{id}')
async def buscar_monte_pizza(
    id: int,
    request: Request,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    produto = _buscar_produto_com_tamanho(conn, id)
    if not produto:
        raise HTTPException(status_code=404, detail='Monte Sua Pizza não encontrado')
    return _montar_resposta(produto, conn, request)


@monte_pizza_routes.put('/{id}')
async def editar_monte_pizza(
    id: int,
    schema: ProdutoMonteSuaPizzaSchema,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    produto = fetch_one(conn, "SELECT imagem_url FROM produto_monte_pizza WHERE id = %s", (id,))
    if not produto:
        raise HTTPException(status_code=404, detail='Monte Sua Pizza não encontrado')

    tamanho = fetch_one(conn, "SELECT id FROM tamanhos WHERE id = %s", (schema.tamanho_id,))
    if not tamanho:
        raise HTTPException(status_code=404, detail='Tamanho não encontrado')

    imagem_url = schema.imagem_url if schema.imagem_url else produto["imagem_url"]

    execute(
        conn,
        """
        UPDATE produto_monte_pizza
        SET nome = %s, tamanho_id = %s, categoria_id = %s, grade_id = %s, descricao = %s, ativo = %s,
            qtd_sabores_override = %s, permite_borda = %s, permite_ingrediente = %s, imagem_url = %s
        WHERE id = %s
        """,
        (
            schema.nome, schema.tamanho_id, schema.categoria_id, schema.grade_id, schema.descricao,
            schema.ativo, schema.qtd_sabores_override, schema.permite_borda, schema.permite_ingrediente,
            imagem_url, id,
        ),
    )
    return {'mensagem': 'Monte Sua Pizza editado com sucesso'}


@monte_pizza_routes.patch('/{id}/status')
async def toggle_status_monte_pizza(
    id: int,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    resultado = fetch_one(
        conn,
        "UPDATE produto_monte_pizza SET ativo = NOT ativo WHERE id = %s RETURNING id, ativo",
        (id,),
    )
    if not resultado:
        raise HTTPException(status_code=404, detail='Monte Sua Pizza não encontrado')

    return {'id': resultado["id"], 'ativo': resultado["ativo"]}


@monte_pizza_routes.delete('/{id}')
async def deletar_monte_pizza(
    id: int,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    produto = fetch_one(conn, "SELECT id FROM produto_monte_pizza WHERE id = %s", (id,))
    if not produto:
        raise HTTPException(status_code=404, detail='Monte Sua Pizza não encontrado')

    # monte_pizza_sabor tem ON DELETE CASCADE (ver sql/schema.sql), então os
    # vínculos de sabor somem sozinhos — não precisa limpar antes.
    execute(conn, "DELETE FROM produto_monte_pizza WHERE id = %s", (id,))
    return {'mensagem': 'Monte Sua Pizza deletado com sucesso'}


@monte_pizza_routes.get('/')
async def listar_monte_pizza(
    request: Request,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    produtos = fetch_all(
        conn,
        """
        SELECT p.*, t.nome AS tamanho_nome
        FROM produto_monte_pizza p
        JOIN tamanhos t ON t.id = p.tamanho_id
        """,
    )
    return [_montar_resposta(p, conn, request) for p in produtos]


@monte_pizza_routes.post('/{id}/sabores/importar-automatico')
async def importar_sabores_automatico(
    id: int,
    request: Request,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    """
    Busca todos os Sabores com disponivel_monte_sua_pizza=True que também têm
    preço cadastrado (PrecoPizza) para o tamanho deste Monte Sua Pizza, e cria
    os vínculos em lote (ignorando os que já existem).
    """
    produto = fetch_one(conn, "SELECT id, tamanho_id FROM produto_monte_pizza WHERE id = %s", (id,))
    if not produto:
        raise HTTPException(status_code=404, detail='Monte Sua Pizza não encontrado')

    ja_vinculados = {
        r["sabor_id"] for r in fetch_all(
            conn, "SELECT sabor_id FROM monte_pizza_sabor WHERE produto_monte_pizza_id = %s", (produto["id"],)
        )
    }

    candidatos = fetch_all(
        conn,
        """
        SELECT DISTINCT s.id, s.nome
        FROM sabores s
        JOIN preco_pizza pp ON pp.sabor_id = s.id
        WHERE s.ativo = true AND s.disponivel_monte_sua_pizza = true AND pp.tamanho_id = %s
        """,
        (produto["tamanho_id"],),
    )

    novos = 0
    for sabor in candidatos:
        if sabor["id"] in ja_vinculados:
            continue
        execute(
            conn,
            "INSERT INTO monte_pizza_sabor (produto_monte_pizza_id, sabor_id) VALUES (%s, %s)",
            (produto["id"], sabor["id"]),
        )
        novos += 1

    return {'mensagem': f'{novos} sabor(es) importado(s) com sucesso', 'total_candidatos': len(candidatos)}


@monte_pizza_routes.post('/{id}/sabores/sincronizar')
async def sincronizar_sabores(
    id: int,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    """
    Atualiza a lista de sabores vinculados: remove qualquer vínculo cujo sabor
    tenha deixado de ser 'disponivel_monte_sua_pizza' ou tenha ficado inativo
    desde que foi importado. Usado pelo botão "Atualizar sabores" na tela de edição.
    """
    produto = fetch_one(conn, "SELECT id FROM produto_monte_pizza WHERE id = %s", (id,))
    if not produto:
        raise HTTPException(status_code=404, detail='Monte Sua Pizza não encontrado')

    vinculos = fetch_all(
        conn,
        """
        SELECT mps.id AS vinculo_id, s.ativo, s.disponivel_monte_sua_pizza
        FROM monte_pizza_sabor mps
        JOIN sabores s ON s.id = mps.sabor_id
        WHERE mps.produto_monte_pizza_id = %s
        """,
        (produto["id"],),
    )

    removidos = 0
    for v in vinculos:
        if not v["ativo"] or not v["disponivel_monte_sua_pizza"]:
            execute(conn, "DELETE FROM monte_pizza_sabor WHERE id = %s", (v["vinculo_id"],))
            removidos += 1

    return {'mensagem': f'{removidos} sabor(es) removido(s) por não estarem mais disponíveis'}


@monte_pizza_routes.post('/{id}/sabores/adicionar')
async def adicionar_sabores_manual(
    id: int,
    schema: MonteSuaPizzaSaborSchema,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    produto = fetch_one(conn, "SELECT id FROM produto_monte_pizza WHERE id = %s", (id,))
    if not produto:
        raise HTTPException(status_code=404, detail='Monte Sua Pizza não encontrado')

    ja_vinculados = {
        r["sabor_id"] for r in fetch_all(
            conn, "SELECT sabor_id FROM monte_pizza_sabor WHERE produto_monte_pizza_id = %s", (produto["id"],)
        )
    }
    adicionados = 0
    ignorados = 0
    for sabor_id in schema.sabor_ids:
        if sabor_id in ja_vinculados:
            continue
        sabor = fetch_one(conn, "SELECT ativo, disponivel_monte_sua_pizza FROM sabores WHERE id = %s", (sabor_id,))
        if not sabor or not sabor["ativo"] or not sabor["disponivel_monte_sua_pizza"]:
            ignorados += 1
            continue
        execute(
            conn,
            "INSERT INTO monte_pizza_sabor (produto_monte_pizza_id, sabor_id) VALUES (%s, %s)",
            (produto["id"], sabor_id),
        )
        adicionados += 1

    mensagem = f'{adicionados} sabor(es) adicionado(s) com sucesso'
    if ignorados:
        mensagem += f' ({ignorados} ignorado(s) por não estar disponível no Monte Sua Pizza)'
    return {'mensagem': mensagem}


@monte_pizza_routes.delete('/{id}/sabores/{sabor_id}')
async def remover_sabor(
    id: int,
    sabor_id: int,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    vinculo = fetch_one(
        conn,
        "SELECT id FROM monte_pizza_sabor WHERE produto_monte_pizza_id = %s AND sabor_id = %s",
        (id, sabor_id),
    )
    if not vinculo:
        raise HTTPException(status_code=404, detail='Vínculo não encontrado')

    execute(conn, "DELETE FROM monte_pizza_sabor WHERE id = %s", (vinculo["id"],))
    return {'mensagem': 'Sabor removido com sucesso'}
