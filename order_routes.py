from fastapi import APIRouter

order_router = APIRouter(prefix="/order", tags=['order'])

@order_router.get('/')
async def pedidos():
    return {'mensagem': 'voce acesso a rota de pedidos'}
