from fastapi import APIRouter, Depends, HTTPException
from models import Usuario, Sabores, Tamanhos, PrecoPizza, Adicionais, Pedidos
from dependencies import pegar_sessao
from dependsadm import verificar_adm
from schemas import SaboresSchema, TamanhosSchema, PrecoPizzaSchema, AdicionaisSchema, ResponsePedidoSchema
from sqlalchemy.orm import Session
from enum import Enum

area_admin = APIRouter(prefix='/admin', tags=['admin'])



@area_admin.get('/')
async def home(usuario: Usuario = Depends(verificar_adm)):
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
        

        
@area_admin.put('/editar/sabores/{id_sabor}')
async def editar_sabores (id_sabor: int, sabor_schema: SaboresSchema, seisson: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    sabores = seisson.query(Sabores).filter(Sabores.id == id_sabor).first()
    if not sabores:
        raise HTTPException (status_code=404, detail='Sabor não encontrado')
    sabores.nome = sabor_schema.nome
    sabores.descricao = sabor_schema.descricao

    seisson.commit()
    return{
        'mensagem': 'Sabor editado com sucesso',

    }


@area_admin.put('/editar/tamanho/{id_tamanho}')
async def editar_tamanho (id_tamanho: int, tamanho_schema: TamanhosSchema, seisson: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    tamanhos = seisson.query(Tamanhos).filter(Tamanhos.id == id_tamanho).first()
    if not tamanhos:
        raise HTTPException (status_code=404, detail='Tamanho não encontrado')
    tamanhos.nome = tamanho_schema.nome

    seisson.commit()
    return{
        'mensagem': 'Tamanho editado com sucesso',

    }




@area_admin.put('/editar/preco/{id_preco}')
async def editar_preco (id_preco: int, preco_schema: PrecoPizzaSchema, seisson: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    preco = seisson.query(PrecoPizza).filter(PrecoPizza.id == id_preco).first()
    if not preco:
        raise HTTPException (status_code=404, detail='Produto não encontrado')
    preco.sabor_id = preco_schema.sabor_id
    preco.tamanho_id = preco_schema.tamanho_id
    preco.preco = preco_schema.preco

    seisson.commit()
    return{
        'mensagem': 'Tamanho editado com sucesso',

    }


@area_admin.put('/editar/adicionais/{id_adicionais}')
async def editar_adicionais (id_adicionais: int, adicionais_schema: AdicionaisSchema, seisson: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    adicionais = seisson.query(Adicionais).filter(Adicionais.id == id_adicionais).first()
    if not adicionais:
        raise HTTPException (status_code=404, detail='Produto não encontrado')
    adicionais.nome = adicionais_schema.nome
    adicionais.preco = adicionais_schema.preco

    seisson.commit()
    return{
        'mensagem': 'Adicionais editado com sucesso',

    }



@area_admin.delete('/deletar/sabor/{id_sabor}')
async def deletar_sabor (id_sabor: int, session: Session =  Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    del_sabor = session.query(Sabores).filter(Sabores.id == id_sabor).first()
    if not del_sabor:
        raise HTTPException (status_code=404, detail='Sabor não encontrado')
    session.delete(del_sabor)
    session.commit()
    return{
        'msg': 'Sabor deletado com sucesso'
    }




@area_admin.delete('/deletar/tamanho/{id_tamanho}')
async def deletar_tamanho (id_tamanho: int, session: Session =  Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    del_tamanho = session.query(Tamanhos).filter(Tamanhos.id == id_tamanho).first()
    if not del_tamanho:
        raise HTTPException (status_code=404, detail='Tamanho não encontrado')
    session.delete(del_tamanho)
    session.commit()
    return{
        'msg': 'Tamanho deletado com sucesso'
    }




@area_admin.delete('/deletar/preco/{id_preco}')
async def deletar_preco (id_preco: int, session: Session =  Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    del_preco = session.query(PrecoPizza).filter(PrecoPizza.id == id_preco).first()
    if not del_preco:
        raise HTTPException (status_code=404, detail='Preco não encontrado')
    session.delete(del_preco)
    session.commit()
    return{
        'msg': 'Preco deletado com sucesso'
    }



@area_admin.delete('/deletar/adicionais/{id_adicionais}')
async def deletar_adicionais (id_adicionais: int, seisson: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    adicionais = seisson.query(Adicionais).filter(Adicionais.id == id_adicionais).first()
    if not adicionais:
        raise HTTPException (status_code=404, detail='Produto não encontrado')

    seisson.delete(adicionais)
    seisson.commit()
    return{
        'mensagem': 'Adicionais deletado com sucesso',

    }


