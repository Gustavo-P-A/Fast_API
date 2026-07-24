from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies import pegar_sessao
from schemas import EnderecoEntregaCreateSchema, EnderecoEntregaResponseSchema
from models import EnderecoEntrega, Usuario
from core.security import verificar_token
from fastapi.encoders import jsonable_encoder


enderecos_router = APIRouter(prefix='/enderecos', tags=['enderecos'])

@enderecos_router.post('/localizacao')
async def endereco_entrega(
    endereco_schema: EnderecoEntregaCreateSchema,
    session: Session = Depends(pegar_sessao),
    usuario: Usuario = Depends(verificar_token)
):
    try:
        novo_endereco = EnderecoEntrega(
            rua=endereco_schema.rua,
            cep=endereco_schema.cep,
            complemento=endereco_schema.complemento,
            cidade=endereco_schema.cidade,
            estado=endereco_schema.estado,
            numero=endereco_schema.numero,
            bairro=endereco_schema.bairro,
            usuario_id=usuario.id
        )

        session.add(novo_endereco)
        session.commit()
        session.refresh(novo_endereco)

        return {
    'sucesso': True,
    'mensagem': 'Endereço cadastrado com sucesso',
    'endereco': jsonable_encoder(novo_endereco)
        }
        

    except Exception as error:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f'Erro ao cadastrar endereço: {str(error)}'
        )



@enderecos_router.get('/meus-enderecos', response_model=list[EnderecoEntregaResponseSchema])
async def minhas_localizacoes( session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    meus_enderecos = session.query(EnderecoEntrega).filter(EnderecoEntrega.usuario_id == usuario.id ).all()
    return meus_enderecos


@enderecos_router.delete('/meus-enderecos/deletar/{id_endereco}')
async def deletar_endereco(
    id_endereco: int,
    session: Session = Depends(pegar_sessao),
    usuario: Usuario = Depends(verificar_token)
):
    excluir_endereco = (
        session.query(EnderecoEntrega)
        .filter(EnderecoEntrega.id == id_endereco)
        .first()
    )

    if not excluir_endereco:
        raise HTTPException(
            status_code=404, 
            detail='Endereço não encontrado'
        )

    if not usuario.adm and usuario.id != excluir_endereco.usuario_id:
        raise HTTPException(
            status_code=403, 
            detail='Você não tem autorização para remover este endereço'
        )

    try:
        session.delete(excluir_endereco)
        session.commit()
        
        return {
            'sucesso': True,
            'mensagem': 'Endereço removido com sucesso',
            'id_removido': id_endereco
        }
    except Exception as error:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f'Erro ao remover endereço: {str(error)}'
        )


@enderecos_router.put('/meus-enderecos/editar/{id_endereco}')
async def editar_endereco(
    id_endereco: int,
    endereco_schema: EnderecoEntregaCreateSchema,
    session: Session = Depends(pegar_sessao),
    usuario: Usuario = Depends(verificar_token)
):
    endereco_editar = (
        session.query(EnderecoEntrega)
        .filter(EnderecoEntrega.id == id_endereco)
        .first()
    )

    if not endereco_editar:
        raise HTTPException(
            status_code=404, 
            detail='Endereço não encontrado'
        )

    if not usuario.adm and usuario.id != endereco_editar.usuario_id:
        raise HTTPException(
            status_code=403, 
            detail='Você não tem autorização para editar este endereço'
        )

    try:
        endereco_editar.rua = endereco_schema.rua
        endereco_editar.cep = endereco_schema.cep
        endereco_editar.cidade = endereco_schema.cidade
        endereco_editar.estado = endereco_schema.estado
        endereco_editar.complemento = endereco_schema.complemento
        endereco_editar.bairro = endereco_schema.bairro
        endereco_editar.numero = endereco_schema.numero

        session.commit()
        session.refresh(endereco_editar)

        return {
            'sucesso': True,
            'mensagem': 'Endereço atualizado com sucesso',
            'endereco': jsonable_encoder(endereco_editar)
        }
    except Exception as error:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f'Erro ao editar endereço: {str(error)}'
        )