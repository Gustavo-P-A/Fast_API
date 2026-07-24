from fastapi import APIRouter, Depends, HTTPException
from database import pegar_conexao, fetch_one, fetch_all, execute, ConnCommitRoute
from schemas import FormaPagamentoCreateSchema, FormaPagamentoResponseSchema
from core.security import verificar_token

formas_pagamento_routes = APIRouter(prefix='/formas-pagamento', tags=['formas-pagamento'], route_class=ConnCommitRoute)


@formas_pagamento_routes.post('/')
async def criar_forma_pagamento(
    schema: FormaPagamentoCreateSchema,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    try:
        contagem = fetch_one(
            conn,
            "SELECT COUNT(*) AS total FROM formas_pagamento WHERE usuario_id = %s AND ativo = true",
            (usuario["id"],),
        )
        eh_primeira = contagem["total"] == 0
        padrao = schema.padrao or eh_primeira

        if padrao:
            execute(conn, "UPDATE formas_pagamento SET padrao = false WHERE usuario_id = %s", (usuario["id"],))

        nova_forma = fetch_one(
            conn,
            """
            INSERT INTO formas_pagamento (usuario_id, tipo, bandeira, nome_impresso, final_numero, validade, padrao)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                usuario["id"], schema.tipo, schema.bandeira, schema.nome_impresso,
                schema.numero[-4:], schema.validade, padrao,
            ),
        )

        return {
            'sucesso': True,
            'mensagem': 'Forma de pagamento cadastrada com sucesso',
            'forma_pagamento': FormaPagamentoResponseSchema.model_validate(nova_forma)
        }

    except Exception as error:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f'Erro ao cadastrar forma de pagamento: {str(error)}'
        )


@formas_pagamento_routes.get('/minhas', response_model=list[FormaPagamentoResponseSchema])
async def minhas_formas_pagamento(
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    return fetch_all(
        conn,
        "SELECT * FROM formas_pagamento WHERE usuario_id = %s AND ativo = true",
        (usuario["id"],),
    )


@formas_pagamento_routes.put('/{id_forma}')
async def editar_forma_pagamento(
    id_forma: int,
    schema: FormaPagamentoCreateSchema,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    forma = fetch_one(conn, "SELECT * FROM formas_pagamento WHERE id = %s", (id_forma,))

    if not forma:
        raise HTTPException(status_code=404, detail='Forma de pagamento não encontrada')

    if not usuario["adm"] and usuario["id"] != forma["usuario_id"]:
        raise HTTPException(status_code=403, detail='Você não tem autorização para editar esta forma de pagamento')

    try:
        novo_padrao = forma["padrao"] or schema.padrao
        if schema.padrao and not forma["padrao"]:
            execute(conn, "UPDATE formas_pagamento SET padrao = false WHERE usuario_id = %s", (forma["usuario_id"],))
            novo_padrao = True

        forma_atualizada = fetch_one(
            conn,
            """
            UPDATE formas_pagamento
            SET tipo = %s, bandeira = %s, nome_impresso = %s, final_numero = %s, validade = %s, padrao = %s
            WHERE id = %s
            RETURNING *
            """,
            (
                schema.tipo, schema.bandeira, schema.nome_impresso, schema.numero[-4:],
                schema.validade, novo_padrao, id_forma,
            ),
        )

        return {
            'sucesso': True,
            'mensagem': 'Forma de pagamento atualizada com sucesso',
            'forma_pagamento': FormaPagamentoResponseSchema.model_validate(forma_atualizada)
        }
    except Exception as error:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f'Erro ao editar forma de pagamento: {str(error)}'
        )


@formas_pagamento_routes.patch('/{id_forma}/padrao')
async def definir_forma_pagamento_padrao(
    id_forma: int,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    forma = fetch_one(conn, "SELECT * FROM formas_pagamento WHERE id = %s", (id_forma,))

    if not forma:
        raise HTTPException(status_code=404, detail='Forma de pagamento não encontrada')

    if not usuario["adm"] and usuario["id"] != forma["usuario_id"]:
        raise HTTPException(status_code=403, detail='Você não tem autorização para alterar esta forma de pagamento')

    try:
        execute(conn, "UPDATE formas_pagamento SET padrao = false WHERE usuario_id = %s", (forma["usuario_id"],))
        execute(conn, "UPDATE formas_pagamento SET padrao = true WHERE id = %s", (id_forma,))

        return {'sucesso': True, 'mensagem': 'Forma de pagamento definida como padrão', 'id': id_forma}
    except Exception as error:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f'Erro ao definir forma de pagamento padrão: {str(error)}'
        )


@formas_pagamento_routes.delete('/{id_forma}')
async def deletar_forma_pagamento(
    id_forma: int,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    forma = fetch_one(conn, "SELECT * FROM formas_pagamento WHERE id = %s", (id_forma,))

    if not forma:
        raise HTTPException(status_code=404, detail='Forma de pagamento não encontrada')

    if not usuario["adm"] and usuario["id"] != forma["usuario_id"]:
        raise HTTPException(status_code=403, detail='Você não tem autorização para remover esta forma de pagamento')

    try:
        usuario_id = forma["usuario_id"]
        era_padrao = forma["padrao"]

        execute(conn, "DELETE FROM formas_pagamento WHERE id = %s", (id_forma,))

        # Se a removida era a padrão, promove a próxima forma restante (mesmo comportamento do mockup no front)
        if era_padrao:
            proxima = fetch_one(
                conn,
                "SELECT id FROM formas_pagamento WHERE usuario_id = %s AND ativo = true ORDER BY id LIMIT 1",
                (usuario_id,),
            )
            if proxima:
                execute(conn, "UPDATE formas_pagamento SET padrao = true WHERE id = %s", (proxima["id"],))

        return {
            'sucesso': True,
            'mensagem': 'Forma de pagamento removida com sucesso',
            'id_removido': id_forma
        }
    except Exception as error:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f'Erro ao remover forma de pagamento: {str(error)}'
        )
