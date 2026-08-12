from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from database import pegar_conexao, fetch_one, fetch_all, execute, ConnCommitRoute
from dependsadm import verificar_adm
from schemas import NovoProdutoSchema
import os
import uuid

TIPOS_PERMITIDOS = {"image/jpeg", "image/png", "image/webp"}
TAMANHO_MAXIMO = 2 * 1024 * 1024  # 2MB

produto_routes = APIRouter(prefix='/admin', tags=['produtos'], route_class=ConnCommitRoute)


@produto_routes.post('/upload-imagem')
async def upload_imagem(
    request: Request,
    file: UploadFile = File(...),
    usuario=Depends(verificar_adm)
):
    if file.content_type not in TIPOS_PERMITIDOS:
        raise HTTPException(status_code=400, detail="Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.")

    conteudo = await file.read()
    if len(conteudo) > TAMANHO_MAXIMO:
        raise HTTPException(status_code=400, detail="Imagem muito grande. Máximo 2MB.")

    os.makedirs('uploads', exist_ok=True)

    extensao = file.content_type.split("/")[-1].replace("jpeg", "jpg")
    novo_nome = f"{uuid.uuid4()}.{extensao}"
    file_location = f"uploads/{novo_nome}"

    with open(file_location, "wb") as buffer:
        buffer.write(conteudo)

    base_url = f"{request.url.scheme}://{request.url.netloc}"
    return {"url": f"{base_url}/uploads/{novo_nome}"}


@produto_routes.post('/novo-produto')
async def criar_novo_produto(
    novo_produto_schema: NovoProdutoSchema,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    sabor = fetch_one(
        conn,
        """
        INSERT INTO sabores (nome, descricao, ativo, categoria_id, imagem_url,
                              disponivel_cardapio_normal, disponivel_monte_sua_pizza,
                              permite_borda, permite_ingrediente)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            novo_produto_schema.nome, novo_produto_schema.descricao, novo_produto_schema.ativo,
            novo_produto_schema.categoria_id, novo_produto_schema.imagem_url,
            novo_produto_schema.disponivel_cardapio_normal, novo_produto_schema.disponivel_monte_sua_pizza,
            novo_produto_schema.permite_borda, novo_produto_schema.permite_ingrediente,
        ),
    )

    for i in novo_produto_schema.precos:
        execute(
            conn,
            "INSERT INTO preco_pizza (sabor_id, tamanho_id, preco) VALUES (%s, %s, %s)",
            (sabor["id"], i.tamanho_id, i.preco),
        )

    execute(
        conn,
        "INSERT INTO grade_sabores (grade_id, sabores_id) VALUES (%s, %s)",
        (novo_produto_schema.grade_id, sabor["id"]),
    )
    return {'mensagem': 'Produto criado com sucesso'}


@produto_routes.put('/editar/novo-produto/{id}')
async def editar_novo_produto(
    id: int,
    produto_schema: NovoProdutoSchema,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    produto = fetch_one(conn, "SELECT id FROM sabores WHERE id = %s", (id,))
    if not produto:
        raise HTTPException(status_code=404, detail='Produto não encontrado')

    grade = fetch_one(conn, "SELECT grade_id FROM grade_sabores WHERE sabores_id = %s", (id,))
    if not grade:
        raise HTTPException(status_code=404, detail='Grade do produto não encontrada')

    campos = {
        "nome": produto_schema.nome,
        "descricao": produto_schema.descricao,
        "ativo": produto_schema.ativo,
        "categoria_id": produto_schema.categoria_id,
        "disponivel_cardapio_normal": produto_schema.disponivel_cardapio_normal,
        "disponivel_monte_sua_pizza": produto_schema.disponivel_monte_sua_pizza,
        "permite_borda": produto_schema.permite_borda,
        "permite_ingrediente": produto_schema.permite_ingrediente,
    }
    if produto_schema.imagem_url:
        campos["imagem_url"] = produto_schema.imagem_url

    set_sql = ", ".join(f"{campo} = %s" for campo in campos)
    produto_atualizado = fetch_one(
        conn,
        f"UPDATE sabores SET {set_sql} WHERE id = %s RETURNING *",
        (*campos.values(), id),
    )

    for i in produto_schema.precos:
        preco_db = fetch_one(
            conn,
            "SELECT id FROM preco_pizza WHERE sabor_id = %s AND tamanho_id = %s",
            (id, i.tamanho_id),
        )
        if preco_db:
            execute(conn, "UPDATE preco_pizza SET preco = %s WHERE id = %s", (i.preco, preco_db["id"]))
        else:
            execute(
                conn,
                "INSERT INTO preco_pizza (sabor_id, tamanho_id, preco) VALUES (%s, %s, %s)",
                (id, i.tamanho_id, i.preco),
            )

    return {'mensagem': 'Produto editado com sucesso', 'produto': produto_atualizado}


@produto_routes.patch('/produto/{id}/status')
async def toggle_status(
    id: int,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    resultado = fetch_one(
        conn,
        "UPDATE sabores SET ativo = NOT ativo WHERE id = %s RETURNING id, ativo",
        (id,),
    )
    if not resultado:
        raise HTTPException(status_code=404, detail='Produto não encontrado')

    return {'id': resultado["id"], 'ativo': resultado["ativo"]}


@produto_routes.get('/listar/novo-produto/{id}')
async def listar_produto(
    id: int,
    request: Request,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    produto = fetch_one(conn, "SELECT * FROM sabores WHERE id = %s", (id,))
    grade = fetch_one(conn, "SELECT grade_id FROM grade_sabores WHERE sabores_id = %s", (id,))
    precos = fetch_all(conn, "SELECT id, sabor_id, tamanho_id, preco FROM preco_pizza WHERE sabor_id = %s", (id,))

    if not produto:
        raise HTTPException(status_code=404, detail='Produto não encontrado')
    if not grade:
        raise HTTPException(status_code=404, detail='Grade do produto não encontrada')

    imagem_url = produto["imagem_url"]
    if imagem_url and not imagem_url.startswith('http'):
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        imagem_url = f'{base_url}{imagem_url}'

    return {
        'id': produto["id"],
        'nome': produto["nome"],
        'descricao': produto["descricao"],
        'ativo': produto["ativo"],
        'categoria_id': produto["categoria_id"],
        'grade_id': grade["grade_id"],
        'precos': precos,
        'imagem_url': imagem_url,
        'disponivel_cardapio_normal': produto["disponivel_cardapio_normal"],
        'disponivel_monte_sua_pizza': produto["disponivel_monte_sua_pizza"],
        'permite_borda': produto["permite_borda"],
        'permite_ingrediente': produto["permite_ingrediente"],
    }


@produto_routes.get('/listar/todos-produtos')
async def listar_todos_produtos(
    request: Request,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    produtos = fetch_all(conn, "SELECT * FROM sabores", ())
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    return [
        {
            'id': p["id"],
            'nome': p["nome"],
            'descricao': p["descricao"],
            'ativo': p["ativo"],
            'categoria_id': p["categoria_id"],
            'disponivel_monte_sua_pizza': p["disponivel_monte_sua_pizza"],
            'imagem_url': f'{base_url}{p["imagem_url"]}' if p["imagem_url"] and not p["imagem_url"].startswith('http') else p["imagem_url"],
        }
        for p in produtos
    ]
