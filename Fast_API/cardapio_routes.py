from fastapi import APIRouter, Depends, Request, HTTPException
from database import pegar_conexao, fetch_one, fetch_all, ConnCommitRoute
from calculos import qtd_sabores_efetiva
from schemas import AdicionaisSchema, SaboresResponseSchema, SaboresVisualizacaoSchema, TamanhosSchema, TamanhoPublicoSchema, PrecoPizzaResponseSchema, PrecoAdicionalResponseSchema

cardapio_routes = APIRouter(prefix='/cardapio', tags=['/cardapio'], route_class=ConnCommitRoute)


def _shape_preco_pizza(r: dict) -> dict:
    """Monta o formato aninhado de PrecoPizzaResponseSchema (sabor_rel/tamanho_rel)
    a partir de uma linha já vinda com JOIN em sabores e tamanhos."""
    return {
        "id": r["id"],
        "preco": r["preco"],
        "sabor_rel": {
            "id": r["sabor_id"], "nome": r["sabor_nome"],
            "descricao": r["sabor_descricao"], "imagem_url": r["sabor_imagem_url"],
        },
        "tamanho_rel": {
            "id": r["tamanho_id"], "nome": r["tamanho_nome"],
            "qtd_sabores": r["qtd_sabores"], "qtd_bordas": r["qtd_bordas"],
        },
    }


@cardapio_routes.get('/itens-simples')
async def itens_simples_publico(tipo: str, request: Request, conn = Depends(pegar_conexao)):
    itens = fetch_all(conn, "SELECT * FROM itens_simples WHERE tipo = %s AND ativo = true", (tipo,))
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    resultado = []
    for item in itens:
        imagem = f"{base_url}{item['imagem_url']}" if item["imagem_url"] and not item["imagem_url"].startswith("http") else item["imagem_url"]
        resultado.append({
            "id": item["id"],
            "nome": item["nome"],
            "descricao": item["descricao"],
            "preco": item["preco"],
            "imagem_url": imagem,
            "categoria_id": item["categoria_id"],
        })
    return resultado


def _montar_monte_pizza_publico(produto: dict, conn, request: Request):
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    imagem = f"{base_url}{produto['imagem_url']}" if produto["imagem_url"] and not produto["imagem_url"].startswith("http") else produto["imagem_url"]

    vinculos = fetch_all(
        conn,
        """
        SELECT s.* FROM sabores s
        JOIN monte_pizza_sabor mps ON mps.sabor_id = s.id
        WHERE mps.produto_monte_pizza_id = %s
        """,
        (produto["id"],),
    )
    sabores = []
    for sabor in vinculos:
        if not sabor["ativo"]:
            continue
        preco = fetch_one(
            conn,
            "SELECT preco FROM preco_pizza WHERE sabor_id = %s AND tamanho_id = %s",
            (sabor["id"], produto["tamanho_id"]),
        )
        if not preco:
            continue
        sabor_imagem = f"{base_url}{sabor['imagem_url']}" if sabor["imagem_url"] and not sabor["imagem_url"].startswith("http") else sabor["imagem_url"]
        sabores.append({
            "id": sabor["id"],
            "nome": sabor["nome"],
            "imagem_url": sabor_imagem,
            "preco": preco["preco"],
            "permite_borda": sabor["permite_borda"],
            "permite_ingrediente": sabor["permite_ingrediente"],
        })
    return {
        "id": produto["id"],
        "nome": produto["nome"],
        "descricao": produto["descricao"],
        "imagem_url": imagem,
        "tamanho_id": produto["tamanho_id"],
        "tamanho_nome": produto["tamanho_nome"],
        "qtd_sabores": qtd_sabores_efetiva(conn, produto["id"]),
        "permite_borda": produto["permite_borda"],
        "permite_ingrediente": produto["permite_ingrediente"],
        "categoria_id": produto["categoria_id"],
        "grade_id": produto["grade_id"],
        "sabores": sabores,
    }


@cardapio_routes.get('/monte-pizza/{id}')
async def monte_pizza_publico_detalhe(id: int, request: Request, conn = Depends(pegar_conexao)):
    produto = fetch_one(
        conn,
        """
        SELECT p.*, t.nome AS tamanho_nome
        FROM produto_monte_pizza p
        JOIN tamanhos t ON t.id = p.tamanho_id
        WHERE p.id = %s AND p.ativo = true
        """,
        (id,),
    )
    if not produto:
        raise HTTPException(status_code=404, detail='Monte Sua Pizza não encontrado')
    return _montar_monte_pizza_publico(produto, conn, request)


@cardapio_routes.get('/monte-pizza')
async def monte_pizza_publico(request: Request, conn = Depends(pegar_conexao)):
    produtos = fetch_all(
        conn,
        """
        SELECT p.*, t.nome AS tamanho_nome
        FROM produto_monte_pizza p
        JOIN tamanhos t ON t.id = p.tamanho_id
        WHERE p.ativo = true
        """,
    )
    return [_montar_monte_pizza_publico(p, conn, request) for p in produtos]

@cardapio_routes.get('/sabores', response_model=list[SaboresResponseSchema])
async def sabores_inicial(request: Request, conn = Depends(pegar_conexao)):
    todos_sabores = fetch_all(
        conn,
        "SELECT * FROM sabores WHERE ativo = true AND disponivel_cardapio_normal = true",
    )
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    return [
        {
            'id': sabor["id"],
            'nome': sabor["nome"],
            'descricao': sabor["descricao"],
            'imagem_url': f'{base_url}{sabor["imagem_url"]}' if sabor["imagem_url"] and not sabor["imagem_url"].startswith('http') else sabor["imagem_url"],
        }
        for sabor in todos_sabores
    ]


@cardapio_routes.get('/sabores/{id_sabor}', response_model=SaboresVisualizacaoSchema)
async def sabor_visualizacao(id_sabor: int, request: Request, conn = Depends(pegar_conexao)):
    sabor = fetch_one(conn, "SELECT * FROM sabores WHERE id = %s", (id_sabor,))
    if not sabor:
        return None

    imagem_url = sabor["imagem_url"]
    if imagem_url and not imagem_url.startswith('http'):
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        imagem_url = f'{base_url}{imagem_url}'

    precos = fetch_all(
        conn,
        """
        SELECT pp.id, pp.preco,
               s.id AS sabor_id, s.nome AS sabor_nome, s.descricao AS sabor_descricao, s.imagem_url AS sabor_imagem_url,
               t.id AS tamanho_id, t.nome AS tamanho_nome, t.qtd_sabores, t.qtd_bordas
        FROM preco_pizza pp
        JOIN sabores s ON s.id = pp.sabor_id
        JOIN tamanhos t ON t.id = pp.tamanho_id
        WHERE pp.sabor_id = %s
        """,
        (id_sabor,),
    )

    return {
        "id": sabor["id"],
        "nome": sabor["nome"],
        "descricao": sabor["descricao"],
        "ativo": sabor["ativo"],
        "imagem_url": imagem_url,
        "preco_float": [_shape_preco_pizza(r) for r in precos],
        "disponivel_cardapio_normal": sabor["disponivel_cardapio_normal"],
        "disponivel_monte_sua_pizza": sabor["disponivel_monte_sua_pizza"],
        "permite_borda": sabor["permite_borda"],
        "permite_ingrediente": sabor["permite_ingrediente"],
    }


@cardapio_routes.get('/adicionais', response_model=list[AdicionaisSchema])
async def adicionais_inicial(conn = Depends(pegar_conexao)):
    return fetch_all(conn, "SELECT * FROM adicionais")


@cardapio_routes.get('/tamanhos', response_model=list[TamanhoPublicoSchema])
async def tamanhos_inicial(conn = Depends(pegar_conexao)):
    return fetch_all(conn, "SELECT * FROM tamanhos")


@cardapio_routes.get('/precos', response_model=list[PrecoPizzaResponseSchema])
async def preco_inicial(conn = Depends(pegar_conexao)):
    rows = fetch_all(
        conn,
        """
        SELECT pp.id, pp.preco,
               s.id AS sabor_id, s.nome AS sabor_nome, s.descricao AS sabor_descricao, s.imagem_url AS sabor_imagem_url,
               t.id AS tamanho_id, t.nome AS tamanho_nome, t.qtd_sabores, t.qtd_bordas
        FROM preco_pizza pp
        JOIN sabores s ON s.id = pp.sabor_id
        JOIN tamanhos t ON t.id = pp.tamanho_id
        """,
    )
    return [_shape_preco_pizza(r) for r in rows]


@cardapio_routes.get('/preco_adicional', response_model=list[PrecoAdicionalResponseSchema])
async def precos_adicional(tamanho_id: int, conn = Depends(pegar_conexao)):
    rows = fetch_all(
        conn,
        """
        SELECT pa.id, pa.preco, a.id AS adicional_id, a.nome AS adicional_nome, a.ativo AS adicional_ativo
        FROM preco_adicional pa
        JOIN adicionais a ON a.id = pa.adicional_id
        WHERE pa.tamanho_id = %s
        """,
        (tamanho_id,),
    )
    return [
        {
            "id": r["id"],
            "preco": r["preco"],
            "adicional_rel": {"id": r["adicional_id"], "nome": r["adicional_nome"], "ativo": r["adicional_ativo"]},
        }
        for r in rows
    ]

@cardapio_routes.get('/grades')
async def grades_publicas(
    request: Request,
    conn = Depends(pegar_conexao)
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
            WHERE gs.grade_id = %s AND s.ativo = true AND s.disponivel_cardapio_normal = true
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
        if not sabores and not monte_pizzas and not bebidas:
            continue
        produtos = []
        for s in sabores:
            menor_preco = fetch_one(
                conn,
                "SELECT preco FROM preco_pizza WHERE sabor_id = %s ORDER BY preco ASC LIMIT 1",
                (s["id"],),
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
            imagem = f"{base_url}{mp['imagem_url']}" if mp["imagem_url"] and not mp["imagem_url"].startswith("http") else mp["imagem_url"]
            qtd_sabores = mp["qtd_sabores_override"] if mp["qtd_sabores_override"] else mp["tamanho_qtd_sabores"]
            produtos.append({
                "tipo": "monte_pizza",
                "id": mp["id"],
                "nome": mp["nome"],
                "descricao": mp["descricao"] or f"{mp['tamanho_nome']} — até {qtd_sabores} sabor(es)",
                "imagem_url": imagem,
                "menor_preco": None,
            })
        for b in bebidas:
            imagem = f"{base_url}{b['imagem_url']}" if b["imagem_url"] and not b["imagem_url"].startswith("http") else b["imagem_url"]
            produtos.append({
                "tipo": "bebida",
                "id": b["id"],
                "nome": b["nome"],
                "descricao": b["descricao"],
                "imagem_url": imagem,
                "menor_preco": b["preco"],
            })
        resultado.append({
            "grade_id": grade["id"],
            "grade_nome": grade["nome"],
            "posicao": grade["posicao"],
            "produtos": produtos,
        })
    return resultado
