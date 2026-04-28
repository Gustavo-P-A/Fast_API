from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, session
from dependencies import pegar_sessao
from schemas import EnderecoEntregaSchema
from models import EnderecoEntrega, Usuario
from core.security import verificar_token


enderecos_router = APIRouter(prefix='/enderecos', tags=['enderecos'])

@enderecos_router.get('/')
async def home():
    return {'mensagem': 'Voce esta na rota de endereços'}


@enderecos_router.post('/localizacao')
async def endereco_entrega(endereco_schema: EnderecoEntregaSchema, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    novo_endereco = EnderecoEntrega(rua = endereco_schema.rua, 
                                    cep = endereco_schema.cep, 
                                    complemento = endereco_schema.complemento,
                                    cidade =endereco_schema.cidade, 
                                    estado =endereco_schema.estado, 
                                    numero = endereco_schema.numero, 
                                    bairro = endereco_schema.bairro, 
                                    usuario_id = usuario.id)
    session.add(novo_endereco)
    session.commit()
    return {'mensagem': 'Endereco cadastrado com sucesso'}



@enderecos_router.get('/meus-enderecos', response_model=list[EnderecoEntregaSchema])
async def minhas_localizacoes( session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    meus_enderecos = session.query(EnderecoEntrega).filter(EnderecoEntrega.usuario_id == usuario.id )
    return meus_enderecos



@enderecos_router.delete('/meus-enderecos/deletar/{id_endereco}')
async def deletar_endereco(id_endereco:int, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    excluir_endereco = session.query(EnderecoEntrega).filter(EnderecoEntrega.id == id_endereco).first()
    if not excluir_endereco:
        raise HTTPException(status_code=404, detail='Endereco não encontrado')
    if not usuario.adm and usuario.id != excluir_endereco.usuario_id:
        raise HTTPException(status_code=401, detail='Você não tem autorização para fazer está modificação')    
    session.delete(excluir_endereco)
    session.commit()
    return {
        'mensagem': 'Endereco removido do pedido com sucesso',
    }


@enderecos_router.put('/meus-enderecos/editar/{id_endereco}')
async def editar_endereco(id_endereco:int, endereco_schema: EnderecoEntregaSchema, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    endereco_editar= session.query(EnderecoEntrega).filter(EnderecoEntrega.id == id_endereco).first()
    
    if not endereco_editar:
        raise HTTPException(status_code=404, detail='Endereco não encontrado')
    if not usuario.adm and usuario.id != endereco_editar.usuario_id:
        raise HTTPException(status_code=401, detail='Você não tem autorização para fazer está modificação')    
    
    endereco_editar.rua = endereco_schema.rua
    endereco_editar.cep = endereco_schema.cep
    endereco_editar.cidade = endereco_schema.cidade
    endereco_editar.estado = endereco_schema.estado
    endereco_editar.complemento = endereco_schema.complemento
    endereco_editar.bairro = endereco_schema.bairro
    endereco_editar.numero = endereco_schema.numero

    session.commit()
    return {
        'mensagem': 'Endereco editado do pedido com sucesso',
    }