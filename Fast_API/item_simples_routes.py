from fastapi import APIRouter, Depends, HTTPException, Request
from database import pegar_conexao, fetch_one, fetch_all, execute, ConnCommitRoute
from dependsadm import verificar_adm
from schemas import ItemSimplesSchema
from psycopg import errors

item_simples_routes = APIRouter(prefix='/admin', tags=['itens-simples'], route_class=ConnCommitRoute)


def _resolver_imagem(item: dict, request: Request):
    if item["imagem_url"] and not item["imagem_url"].startswith('http'):
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        return f'{base_url}{item["imagem_url"]}'
    return item["imagem_url"]


@item_simples_routes.post('/item-simples')
async def criar_item_simples(
    schema: ItemSimplesSchema,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    item = fetch_one(
        conn,
        """
        INSERT INTO itens_simples (tipo, nome, categoria_id, grade_id, preco, descricao, ativo, imagem_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            schema.tipo, schema.nome, schema.categoria_id, schema.grade_id,
            schema.preco, schema.descricao, schema.ativo, schema.imagem_url,
        ),
    )
    return {'mensagem': 'Item criado com sucesso', 'id': item["id"]}


@item_simples_routes.get('/item-simples/{id}')
async def buscar_item_simples(
    id: int,
    request: Request,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    item = fetch_one(conn, "SELECT * FROM itens_simples WHERE id = %s", (id,))
    if not item:
        raise HTTPException(status_code=404, detail='Item não encontrado')

    return {
        'id': item["id"],
        'tipo': item["tipo"],
        'nome': item["nome"],
        'categoria_id': item["categoria_id"],
        'grade_id': item["grade_id"],
        'preco': item["preco"],
        'descricao': item["descricao"],
        'ativo': item["ativo"],
        'imagem_url': _resolver_imagem(item, request),
    }

@item_simples_routes.put('/item-simples/{id}')
async def editar_item_simples(
    id: int,
    schema: ItemSimplesSchema,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    item = fetch_one(conn, "SELECT imagem_url FROM itens_simples WHERE id = %s", (id,))
    if not item:
        raise HTTPException(status_code=404, detail='Item não encontrado')

    imagem_url = schema.imagem_url if schema.imagem_url else item["imagem_url"]

    execute(
        conn,
        """
        UPDATE itens_simples
        SET nome = %s, categoria_id = %s, grade_id = %s, preco = %s, descricao = %s, ativo = %s, imagem_url = %s
        WHERE id = %s
        """,
        (schema.nome, schema.categoria_id, schema.grade_id, schema.preco, schema.descricao, schema.ativo, imagem_url, id),
    )

    return {'mensagem': 'Item editado com sucesso'}


@item_simples_routes.get('/listar/item-simples')
async def listar_item_simples(
    tipo: str,
    request: Request,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    # Nota: tipo não é validado aqui (query param solto, sem Literal do Pydantic).
    # Antes, um valor fora de BEBIDA/INGREDIENTE estourava KeyError (500);
    # agora, sem lookup de enum, uma string desconhecida só não bate com
    # nenhuma linha e devolve lista vazia.
    itens = fetch_all(conn, "SELECT * FROM itens_simples WHERE tipo = %s", (tipo,))
    return [
        {
            'id': i["id"],
            'tipo': i["tipo"],
            'nome': i["nome"],
            'categoria_id': i["categoria_id"],
            'grade_id': i["grade_id"],
            'preco': i["preco"],
            'descricao': i["descricao"],
            'ativo': i["ativo"],
            'imagem_url': _resolver_imagem(i, request),
        }
        for i in itens
    ]


@item_simples_routes.patch('/item-simples/{id}/status')
async def toggle_status_item_simples(
    id: int,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    resultado = fetch_one(
        conn,
        "UPDATE itens_simples SET ativo = NOT ativo WHERE id = %s RETURNING id, ativo",
        (id,),
    )
    if not resultado:
        raise HTTPException(status_code=404, detail='Item não encontrado')

    return {'id': resultado["id"], 'ativo': resultado["ativo"]}


@item_simples_routes.delete('/item-simples/{id}')
async def deletar_item_simples(
    id: int,
    conn = Depends(pegar_conexao),
    usuario=Depends(verificar_adm)
):
    item = fetch_one(conn, "SELECT id FROM itens_simples WHERE id = %s", (id,))
    if not item:
        raise HTTPException(status_code=404, detail='Item não encontrado')

    try:
        execute(conn, "DELETE FROM itens_simples WHERE id = %s", (id,))
    except errors.ForeignKeyViolation:
        conn.rollback()
        raise HTTPException(
            status_code=409,
            detail='Não é possível excluir: esse item já foi usado em pedidos existentes',
        )
    return {'mensagem': 'Item deletado com sucesso'}
