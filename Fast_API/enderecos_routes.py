from fastapi import APIRouter, Depends, HTTPException
from database import pegar_conexao, fetch_one, fetch_all, execute, ConnCommitRoute
from schemas import EnderecoEntregaCreateSchema, EnderecoEntregaResponseSchema
from core.security import verificar_token


enderecos_router = APIRouter(prefix='/enderecos', tags=['enderecos'], route_class=ConnCommitRoute)

@enderecos_router.post('/localizacao')
async def endereco_entrega(
    endereco_schema: EnderecoEntregaCreateSchema,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    try:
        novo_endereco = fetch_one(
            conn,
            """
            INSERT INTO enderecos_entrega (rua, cep, complemento, cidade, estado, numero, bairro, usuario_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                endereco_schema.rua, endereco_schema.cep, endereco_schema.complemento,
                endereco_schema.cidade, endereco_schema.estado, endereco_schema.numero,
                endereco_schema.bairro, usuario["id"],
            ),
        )

        return {
            'sucesso': True,
            'mensagem': 'Endereço cadastrado com sucesso',
            'endereco': novo_endereco,
        }

    except Exception as error:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f'Erro ao cadastrar endereço: {str(error)}'
        )


@enderecos_router.get('/meus-enderecos', response_model=list[EnderecoEntregaResponseSchema])
async def minhas_localizacoes(conn = Depends(pegar_conexao), usuario: dict = Depends(verificar_token)):
    meus_enderecos = fetch_all(conn, "SELECT * FROM enderecos_entrega WHERE usuario_id = %s", (usuario["id"],))
    return meus_enderecos


@enderecos_router.delete('/meus-enderecos/deletar/{id_endereco}')
async def deletar_endereco(
    id_endereco: int,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    excluir_endereco = fetch_one(conn, "SELECT * FROM enderecos_entrega WHERE id = %s", (id_endereco,))

    if not excluir_endereco:
        raise HTTPException(
            status_code=404,
            detail='Endereço não encontrado'
        )

    if not usuario["adm"] and usuario["id"] != excluir_endereco["usuario_id"]:
        raise HTTPException(
            status_code=403,
            detail='Você não tem autorização para remover este endereço'
        )

    try:
        execute(conn, "DELETE FROM enderecos_entrega WHERE id = %s", (id_endereco,))

        return {
            'sucesso': True,
            'mensagem': 'Endereço removido com sucesso',
            'id_removido': id_endereco
        }
    except Exception as error:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f'Erro ao remover endereço: {str(error)}'
        )


@enderecos_router.put('/meus-enderecos/editar/{id_endereco}')
async def editar_endereco(
    id_endereco: int,
    endereco_schema: EnderecoEntregaCreateSchema,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    endereco_editar = fetch_one(conn, "SELECT * FROM enderecos_entrega WHERE id = %s", (id_endereco,))

    if not endereco_editar:
        raise HTTPException(
            status_code=404,
            detail='Endereço não encontrado'
        )

    if not usuario["adm"] and usuario["id"] != endereco_editar["usuario_id"]:
        raise HTTPException(
            status_code=403,
            detail='Você não tem autorização para editar este endereço'
        )

    try:
        endereco_atualizado = fetch_one(
            conn,
            """
            UPDATE enderecos_entrega
            SET rua = %s, cep = %s, cidade = %s, estado = %s, complemento = %s, bairro = %s, numero = %s
            WHERE id = %s
            RETURNING *
            """,
            (
                endereco_schema.rua, endereco_schema.cep, endereco_schema.cidade, endereco_schema.estado,
                endereco_schema.complemento, endereco_schema.bairro, endereco_schema.numero, id_endereco,
            ),
        )

        return {
            'sucesso': True,
            'mensagem': 'Endereço atualizado com sucesso',
            'endereco': endereco_atualizado,
        }
    except Exception as error:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f'Erro ao editar endereço: {str(error)}'
        )
