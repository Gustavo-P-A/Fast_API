from fastapi import APIRouter, Depends
from models import Adicionais, Sabores, Tamanhos, PrecoPizza
from sqlalchemy.orm import Session
from dependencies import pegar_sessao
from schemas import AdicionaisSchema, SaboresResponseSchema, SaboresVisualizacaoSchema, TamanhosSchema, PrecoPizzaResponseSchema

cardapio_routes = APIRouter(prefix='/cardapio', tags=['/cardapio'])

@cardapio_routes.get('/')
async def home():
    return {'mensagem': 'Bem vindo a rota cardapio'}



@cardapio_routes.get('/sabores', response_model=list[SaboresResponseSchema])
async def sabores_inicial(session: Session = Depends(pegar_sessao)):
    todos_sabores = session.query(Sabores).all()
    return todos_sabores


@cardapio_routes.get('/sabores/{id_sabor}', response_model=SaboresVisualizacaoSchema)
async def sabor_visualizacao(id_sabor: int, session: Session = Depends(pegar_sessao)):
    sabor_ID = session.query(Sabores).filter(Sabores.id == id_sabor).first()
    return sabor_ID


@cardapio_routes.get('/adicionais', response_model=list[AdicionaisSchema])
async def adicionais_inicial(session: Session = Depends(pegar_sessao)):
    todos_adicionais = session.query(Adicionais).all()
    return todos_adicionais


@cardapio_routes.get('/tamanhos', response_model=list[TamanhosSchema])
async def tamanhos_inicial(session: Session = Depends(pegar_sessao)):
    todos_tamanhos = session.query(Tamanhos).all()
    return todos_tamanhos


@cardapio_routes.get('/precos', response_model=list[PrecoPizzaResponseSchema])
async def preco_inicial (session: Session = Depends(pegar_sessao)):
    todos_precos = session.query(PrecoPizza).all()
    return todos_precos