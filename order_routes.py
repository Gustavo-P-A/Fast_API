from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from dependencies import pegar_sessao
from schemas import PedidoSchema

from models import Pedidos

order_router = APIRouter(prefix="/order", tags=['order'])

@order_router.get('/')
async def pedidos():
    return {'mensagem': 'voce acesso a rota de pedidos'}

@order_router.post('/pedido')
async def criar_pedido(pedido_schema: PedidoSchema, session: Session =  Depends(pegar_sessao)):
    novo_pedido = Pedidos(usuario = pedido_schema.id_usuario)
    session.add(novo_pedido)
    session.commit()
    return {'mensagem': f'pedido criado com sucesso. ID do pedido: {novo_pedido.id}'}