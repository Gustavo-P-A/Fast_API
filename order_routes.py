from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies import pegar_sessao, verificar_token
from schemas import PedidoSchema, ItemPedidoSchema
from models import Pedidos, Usuario, ItemPedido

order_router = APIRouter(prefix="/order", tags=['order'], dependencies=[Depends(verificar_token)])

@order_router.get('/')
async def pedidos():
    return {'mensagem': 'voce acesso a rota de pedidos'}

@order_router.post('/pedido')
async def criar_pedido(pedido_schema: PedidoSchema, session: Session =  Depends(pegar_sessao)):
    novo_pedido = Pedidos(usuario = pedido_schema.id_usuario)
    session.add(novo_pedido)
    session.commit()
    return {'mensagem': f'pedido criado com sucesso. ID do pedido: {novo_pedido.id}'}

@order_router.post('/pedido/cancelar/{id_pedido}')
async def cancelar_pedido(id_pedido: int, session: Session =  Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    pedido = session.query(Pedidos).filter(Pedidos.id == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=400, detail='Pedido não encontrado')
    
    if not usuario.adm and usuario.id != pedido.usuario:
        raise HTTPException(status_code=401, detail='vc nao autorizacao para fazer esta modificação')
    
    pedido.status= 'CANCELADO'
    session.commit()
    return{
        'mensagem': f'Pedido numero: {pedido.id} cancelado com sucesso', 'pedido': pedido
    }

@order_router.get('/listar')
async def listar_pedido(session: Session =  Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    if usuario.adm == False:
        raise HTTPException(status_code=401, detail='vc nao autorizacao para fazer esta operacao')
    else:
        pedidos = session.query(Pedidos).all()
        return{
            'pedidos': pedidos
        }
    
@order_router.post('/pedidos/adicionar-item/{id_pedido}')
async def adicionar_item_pedido(id_pedido: int, item_pedido_schema: ItemPedidoSchema, session: Session =  Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    pedido =session.query(Pedidos).filter(Pedidos.id == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=400, detail='Pedido não encontrado')
    elif not usuario.adm and usuario.id != pedido.usuario:
        raise HTTPException(status_code=401, detail='vc nao autorizacao para fazer esta modificação')
    item_pedido = ItemPedido(
        quantidade=item_pedido_schema.quantidade,
        sabor=item_pedido_schema.sabor,
        tamanho=item_pedido_schema.tamanho,
        preco=item_pedido_schema.preco,
        pedido = id_pedido
    )
    session.add(item_pedido)
    pedido.calcular_preco()
    session.commit()
    return {
        'mensagem': f'Item adicionado ao pedido {id_pedido}',
        'item_id': item_pedido.id,
        'preco_pedido': pedido.preco
    }