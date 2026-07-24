from fastapi import APIRouter, Depends, Request
from models import Adicionais, GradeSabores, Sabores, Tamanhos, PrecoPizza, PrecoAdicional, Grade
from sqlalchemy.orm import Session
from dependencies import pegar_sessao
from schemas import AdicionaisSchema, SaboresResponseSchema, SaboresVisualizacaoSchema, TamanhosSchema, PrecoPizzaResponseSchema, PrecoAdicionalResponseSchema

cardapio_routes = APIRouter(prefix='/cardapio', tags=['/cardapio'])

@cardapio_routes.get('/sabores', response_model=list[SaboresResponseSchema])
async def sabores_inicial(request: Request, session: Session = Depends(pegar_sessao)):
    todos_sabores = session.query(Sabores).filter(Sabores.ativo == True).all()
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    resultado = []
    for sabor in todos_sabores:
        sabor_dict = {
            'id': sabor.id,
            'nome': sabor.nome,
            'descricao': sabor.descricao,
            'imagem_url': f'{base_url}{sabor.imagem_url}' if sabor.imagem_url and not sabor.imagem_url.startswith('http') else sabor.imagem_url,
        }
        resultado.append(SaboresResponseSchema(**sabor_dict))
    return resultado


@cardapio_routes.get('/sabores/{id_sabor}', response_model=SaboresVisualizacaoSchema)
async def sabor_visualizacao(id_sabor: int, request: Request, session: Session = Depends(pegar_sessao)):
    sabor_ID = session.query(Sabores).filter(Sabores.id == id_sabor).first()
    if sabor_ID and sabor_ID.imagem_url and not sabor_ID.imagem_url.startswith('http'):
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        sabor_ID.imagem_url = f'{base_url}{sabor_ID.imagem_url}'
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


@cardapio_routes.get('/preco_adicional', response_model=list[PrecoAdicionalResponseSchema])
async def precos_adicional(tamanho_id:int,session: Session = Depends(pegar_sessao)):
    preco_adicional = session.query(PrecoAdicional).filter(PrecoAdicional.tamanho_id == tamanho_id).all()
    return preco_adicional

@cardapio_routes.get('/grades')
async def grades_publicas(
    request: Request,
    session: Session = Depends(pegar_sessao)
):
    grades = session.query(Grade).order_by(Grade.posicao).all()
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    resultado = []
    for grade in grades:
        sabores = (
            session.query(Sabores)
            .join(GradeSabores, GradeSabores.sabores_id == Sabores.id)
            .filter(GradeSabores.grade_id == grade.id, Sabores.ativo == True)
            .all()
        )
        if not sabores:
            continue
        produtos = []
        for s in sabores:
            menor_preco = session.query(PrecoPizza).filter(
                PrecoPizza.sabor_id == s.id
            ).order_by(PrecoPizza.preco).first()
            imagem = f"{base_url}{s.imagem_url}" if s.imagem_url and not s.imagem_url.startswith("http") else s.imagem_url
            produtos.append({
                "id": s.id,
                "nome": s.nome,
                "descricao": s.descricao,
                "imagem_url": imagem,
                "menor_preco": menor_preco.preco if menor_preco else None,
            })
        resultado.append({
            "grade_id": grade.id,
            "grade_nome": grade.nome,
            "posicao": grade.posicao,
            "produtos": produtos,
        })
    return resultado
