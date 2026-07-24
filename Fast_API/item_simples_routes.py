from fastapi import APIRouter, Depends, HTTPException, Request
from models import ItemSimples, TipoItemSimples
from dependencies import pegar_sessao
from dependsadm import verificar_adm
from schemas import ItemSimplesSchema
from sqlalchemy.orm import Session

item_simples_routes = APIRouter(prefix='/admin', tags=['itens-simples'])


def _resolver_imagem(item, request: Request):
    if item.imagem_url and not item.imagem_url.startswith('http'):
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        return f'{base_url}{item.imagem_url}'
    return item.imagem_url


@item_simples_routes.post('/item-simples')
async def criar_item_simples(
    schema: ItemSimplesSchema,
    session: Session = Depends(pegar_sessao),
    usuario=Depends(verificar_adm)
):
    item = ItemSimples(
        tipo=TipoItemSimples[schema.tipo],
        nome=schema.nome,
        categoria_id=schema.categoria_id,
        grade_id=schema.grade_id,
        preco=schema.preco,
        descricao=schema.descricao,
        ativo=schema.ativo,
        imagem_url=schema.imagem_url,
    )
    session.add(item)
    session.commit()
    return {'mensagem': 'Item criado com sucesso', 'id': item.id}


@item_simples_routes.get('/item-simples/{id}')
async def buscar_item_simples(
    id: int,
    request: Request,
    session: Session = Depends(pegar_sessao),
    usuario=Depends(verificar_adm)
):
    item = session.query(ItemSimples).filter(ItemSimples.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail='Item não encontrado')

    return {
        'id': item.id,
        'tipo': item.tipo.value,
        'nome': item.nome,
        'categoria_id': item.categoria_id,
        'grade_id': item.grade_id,
        'preco': item.preco,
        'descricao': item.descricao,
        'ativo': item.ativo,
        'imagem_url': _resolver_imagem(item, request),
    }

@item_simples_routes.put('/item-simples/{id}')
async def editar_item_simples(
    id: int,
    schema: ItemSimplesSchema,
    session: Session = Depends(pegar_sessao),
    usuario=Depends(verificar_adm)
):
    item = session.query(ItemSimples).filter(ItemSimples.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail='Item não encontrado')

    item.nome = schema.nome
    item.categoria_id = schema.categoria_id
    item.grade_id = schema.grade_id
    item.preco = schema.preco
    item.descricao = schema.descricao
    item.ativo = schema.ativo
    if schema.imagem_url:
        item.imagem_url = schema.imagem_url

    session.commit()
    return {'mensagem': 'Item editado com sucesso'}


@item_simples_routes.get('/listar/item-simples')
async def listar_item_simples(
    tipo: str,
    request: Request,
    session: Session = Depends(pegar_sessao),
    usuario=Depends(verificar_adm)
):
    itens = session.query(ItemSimples).filter(ItemSimples.tipo == TipoItemSimples[tipo]).all()
    return [
        {
            'id': i.id,
            'tipo': i.tipo.value,
            'nome': i.nome,
            'categoria_id': i.categoria_id,
            'grade_id': i.grade_id,
            'preco': i.preco,
            'descricao': i.descricao,
            'ativo': i.ativo,
            'imagem_url': _resolver_imagem(i, request),
        }
        for i in itens
    ]


@item_simples_routes.patch('/item-simples/{id}/status')
async def toggle_status_item_simples(
    id: int,
    session: Session = Depends(pegar_sessao),
    usuario=Depends(verificar_adm)
):
    item = session.query(ItemSimples).filter(ItemSimples.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail='Item não encontrado')

    item.ativo = not item.ativo
    session.commit()
    return {'id': id, 'ativo': item.ativo}


@item_simples_routes.delete('/item-simples/{id}')
async def deletar_item_simples(
    id: int,
    session: Session = Depends(pegar_sessao),
    usuario=Depends(verificar_adm)
):
    item = session.query(ItemSimples).filter(ItemSimples.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail='Item não encontrado')

    session.delete(item)
    session.commit()
    return {'mensagem': 'Item deletado com sucesso'}