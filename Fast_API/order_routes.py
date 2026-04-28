from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies import pegar_sessao
from schemas import ResponsePedidoSchema, ItemPedidoCriacaoSchema
from models import Pedidos, Usuario, ItemPedido, Adicionais, EnderecoEntrega, TipoPagamento
from core.security import verificar_token

order_router = APIRouter(prefix="/order", tags=['order'])

@order_router.get('/')
async def pedidos():
    return {'mensagem': 'voce acesso a rota de pedidos'}

@order_router.post('/pedido')
async def criar_pedido(session: Session =  Depends(pegar_sessao), usuario_token: Usuario = Depends(verificar_token)):
    novo_pedido = Pedidos(usuario_id= usuario_token.id)
    session.add(novo_pedido)
    session.commit()
    return {'mensagem': f'pedido criado com sucesso', 'id': novo_pedido.id}



@order_router.put('/pedido/cancelar/{id_pedido}')
async def cancelar_pedido(id_pedido: int, session: Session =  Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    pedido = session.query(Pedidos).filter(Pedidos.id == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')
    
    if not usuario.adm and usuario.id != pedido.usuario_id:
        raise HTTPException(status_code=401, detail='vc nao autorizacao para fazer esta modificação')
    
    pedido.status= 'CANCELADO'
    session.commit()
    return{
        'mensagem': f'Pedido numero: {pedido.id} cancelado com sucesso', 'pedido': pedido
    }


@order_router.post('/pedidos/adicionar-item/{id_pedido}')
async def adicionar_item_pedido(id_pedido: int, precopizza_id: int ,item_pedido_schema: ItemPedidoCriacaoSchema, session: Session =  Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    pedido =session.query(Pedidos).filter(Pedidos.id == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')
    elif not usuario.adm and usuario.id != pedido.usuario_id:
        raise HTTPException(status_code=401, detail='Você não tem autorização para fazer está modificação')
    item_pedido = ItemPedido(
        quantidade=item_pedido_schema.quantidade,
        pedido_id = id_pedido,
        precopizza_id = precopizza_id,
        observacoes = item_pedido_schema.observacoes
    )
    session.add(item_pedido)
    session.flush()
    pedido.calcular_preco()
    session.commit()
    return {
        'mensagem': f'Item adicionado ao pedido {id_pedido}',
        'item_id': item_pedido.id,
        'preco_pedido': pedido.preco
    }

@order_router.delete('/pedidos/remover-item/{id_item_pedido}')
async def remover_item_pedido(id_item_pedido: int, session: Session =  Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    item_pedido = session.query(ItemPedido).filter(ItemPedido.id == id_item_pedido).first()
    if not item_pedido:
        raise HTTPException(status_code=404, detail='Item do pedido não encontrado')
    
    pedido = session.query(Pedidos).filter(Pedidos.id == item_pedido.pedido_id).first()
    if not usuario.adm and usuario.id != pedido.usuario_id:
        raise HTTPException(status_code=401, detail='Você não tem autorização para fazer está modificação')
    session.delete(item_pedido)
    pedido.calcular_preco()
    session.commit()
    return {
        'mensagem': 'Item removido do pedido com sucesso',
        'itens_pedido': len(pedido.itens),
        'pedido': pedido
    }


@order_router.delete('/pedidos/remover-item/{id_item_pedido}/{id_adicional}')
async def remover_adicional(id_item_pedido: int, id_adicional: int, session: Session =  Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    item = session.query(ItemPedido).filter(ItemPedido.id == id_item_pedido).first()
    adicional = session.query(Adicionais).filter(Adicionais.id == id_adicional).first()    
    if not adicional or not item:
        raise HTTPException(status_code=404, detail='Item do pedido não encontrado')

    pedido = session.query(Pedidos).filter(Pedidos.id == item.pedido_id).first()
    if not usuario.adm and usuario.id != pedido.usuario_id:
        raise HTTPException(status_code=401, detail='Você não tem autorização para fazer está modificação')

    item.adicionais_rel.remove(adicional)
    session.flush()
    pedido.calcular_preco()
    session.commit()
    return {
        'mensagem': 'Adicional removido do pedido com sucesso',
        'itens_pedido': len(pedido.itens),
        'pedido': pedido
    }


@order_router.post('/pedido/finalizar/{id_pedido}')
async def finalizar_pedido(id_pedido: int, tipo_pagamento: TipoPagamento, id_endereco: int, session: Session =  Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    pedido = session.query(Pedidos).filter(Pedidos.id == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')
    
    if not usuario.adm and usuario.id != pedido.usuario_id:
        raise HTTPException(status_code=401, detail='Você não tem autorização para fazer está modificação')
    
    endereco = session.query(EnderecoEntrega).filter(EnderecoEntrega.id == id_endereco).first()
    if not endereco:
        raise HTTPException(status_code=404, detail='Endereço não encontrado')
    
    pedido.formato_de_pagamento = tipo_pagamento
    pedido.endereco_id = endereco.id
    pedido.status= 'FINALIZADO'
    session.commit()
    return{
        'mensagem': f'Pedido numero: {pedido.id} finalizado com sucesso', 'pedido': pedido
    }


@order_router.get('/pedido/{id_pedido}', response_model=ResponsePedidoSchema)
async def visualizar_pedido(id_pedido: int, session: Session =  Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    pedido = session.query(Pedidos).filter(Pedidos.id == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')
    
    if not usuario.adm and usuario.id != pedido.usuario_id:
        raise HTTPException(status_code=401, detail='Você não tem autorização para fazer está modificação')
    
    return pedido

@order_router.get('/listar/meus-pedidos', response_model=List[ResponsePedidoSchema])
async def listar_pedidos(session: Session =  Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    pedidos = session.query(Pedidos).filter(Pedidos.usuario_id == usuario.id).all()
    return pedidos
    

@order_router.post('/adicionais')
async def adicionar_adicionais(id_pedido:int, id_item_pedido: int, id_adicional:int, session: Session =  Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    pedido =session.query(Pedidos).filter(Pedidos.id == id_pedido).first()
    item = session.query(ItemPedido).filter(ItemPedido.id == id_item_pedido).first()
    adicional = session.query(Adicionais).filter(Adicionais.id == id_adicional).first()
    if not item or not adicional or not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')  
    elif not usuario.adm and usuario.id != pedido.usuario_id:
        raise HTTPException(status_code=401, detail='Você não tem autorização para fazer está modificação')
    item.adicionais_rel.append(adicional)
    session.flush()
    pedido.calcular_preco()
    session.commit()
    return {
        'mensagem': f'Item adicionado ao pedido {id_pedido}',
        'preco_pedido': pedido.preco
    }


@order_router.put('/pedido/entregue/{id_pedido}')
async def pedido_entregue (id_pedido: int, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    pedido = session.query(Pedidos).filter(Pedidos.id == id_pedido).first()
    if not pedido:
        raise HTTPException (status_code=404, detail='Pedido não encontrado')
    if usuario.adm or usuario.id != pedido.usuario_id:
        raise HTTPException(status_code=401, detail='Você não tem autorização para fazer está modificação')

    pedido.status = 'ENTREGUE'
    session.commit()
    return{
        'mensagem': 'Pedido entregue com sucesso',
        'pedido': pedido
    }