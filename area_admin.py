from fastapi import APIRouter, Depends, HTTPException
from models import Usuario, Sabores, Tamanhos, PrecoPizza, Adicionais, Pedidos
from dependencies import pegar_sessao
from dependsadm import verificar_adm
from schemas import SaboresSchema, TamanhosSchema, PrecoPizzaSchema, AdicionaisSchema, ResponsePedidoSchema
from sqlalchemy.orm import Session
from enum import Enum

area_admin = APIRouter(prefix='/admin', tags=['admin'])



@area_admin.get('/')
async def home():
    return {'mensagem': 'Voce esta na rota admin'}


@area_admin.post('/sabores')
async def sabor_pizza (sabores_schema: SaboresSchema , session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    sabores = Sabores(nome=sabores_schema.nome, descricao=sabores_schema.descricao)
    session.add(sabores)
    session.commit()
    return {'mensagem': 'sabor adicionado com sucesso'}


@area_admin.post('/tamanhos')
async def tamanho_pizza (tamanho_schema: TamanhosSchema , session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    tamanhos = Tamanhos(nome= tamanho_schema.nome)
    session.add(tamanhos)
    session.commit()
    return {'mensagem': 'Tamanho adicionado com sucesso'}


@area_admin.post('/adicionais')
async def adicionais_pizza (adicionais_schema: AdicionaisSchema , session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    adicionais = Adicionais(nome=adicionais_schema.nome, preco=adicionais_schema.preco)
    session.add(adicionais)
    session.commit()
    return {'mensagem': 'Adicionais adicionado com sucesso'}


@area_admin.post('/preco_pizza')
async def precos_pizza (preco_pizza_schema: PrecoPizzaSchema , session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    preco_pizza = PrecoPizza(preco=preco_pizza_schema.preco, sabor_id = preco_pizza_schema.sabor_id, tamanho_id = preco_pizza_schema.tamanho_id)
    session.add(preco_pizza)
    session.commit()
    return {'mensagem': 'preço da pizza adicionado com sucesso'}


class TipoStatus(str, Enum):
    CONFIRMADO = 'CONFIRMADO' 
    EM_PREPARO = 'EM PREPARO'
    SAIU_PARA_ENTREGA = 'SAIU PARA ENTREGA'

@area_admin.put('/mudar_status/{id}')
async def muda_status (id_pedido: int,tipo_status: TipoStatus, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    pedido = session.query(Pedidos).filter(Pedidos.id == id_pedido).first()
    if not pedido:
        raise HTTPException (status_code=404, detail='Pedido não encontrado')
    
    pedido.status = tipo_status
    session.commit()
    return{
        'mensagem': 'Status editado com sucesso'
    }


@area_admin.get('/listar/pedidos-cliente', response_model=list[ResponsePedidoSchema])
async def listar_pedidos_cliente(session: Session =  Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    produtos = session.query(Pedidos).all()
    return produtos
        
