from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from models import Grade, Sabores, PrecoPizza, GradeSabores
from dependencies import pegar_sessao
from dependsadm import verificar_adm
from schemas import NovoProdutoSchema
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder
import shutil, os, uuid

TIPOS_PERMITIDOS = {"image/jpeg", "image/png", "image/webp"}
TAMANHO_MAXIMO = 2 * 1024 * 1024  # 2MB

produto_routes = APIRouter(prefix='/admin', tags=['produtos'])


@produto_routes.post('/upload-imagem')
async def upload_imagem(
    request: Request,
    file: UploadFile = File(...),
    usuario=Depends(verificar_adm)
):
    if file.content_type not in TIPOS_PERMITIDOS:
        raise HTTPException(status_code=400, detail="Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.")

    conteudo = await file.read()
    if len(conteudo) > TAMANHO_MAXIMO:
        raise HTTPException(status_code=400, detail="Imagem muito grande. Máximo 2MB.")

    os.makedirs('uploads', exist_ok=True)

    extensao = file.content_type.split("/")[-1].replace("jpeg", "jpg")
    novo_nome = f"{uuid.uuid4()}.{extensao}"
    file_location = f"uploads/{novo_nome}"

    with open(file_location, "wb") as buffer:
        buffer.write(conteudo)

    base_url = f"{request.url.scheme}://{request.url.netloc}"
    return {"url": f"{base_url}/uploads/{novo_nome}"}


@produto_routes.post('/novo-produto')
async def criar_novo_produto(
    novo_produto_schema: NovoProdutoSchema,
    session: Session = Depends(pegar_sessao),
    usuario=Depends(verificar_adm)
):
    sabor = Sabores(
        nome=novo_produto_schema.nome,
        descricao=novo_produto_schema.descricao,
        ativo=novo_produto_schema.ativo,
        categoria_id=novo_produto_schema.categoria_id,
        imagem_url=novo_produto_schema.imagem_url
    )
    session.add(sabor)
    session.commit()

    for i in novo_produto_schema.precos:
        session.add(PrecoPizza(sabor_id=sabor.id, tamanho_id=i.tamanho_id, preco=i.preco))

    session.add(GradeSabores(grade_id=novo_produto_schema.grade_id, sabores_id=sabor.id))
    session.commit()
    return {'mensagem': 'Produto criado com sucesso'}


@produto_routes.put('/editar/novo-produto/{id}')
async def editar_novo_produto(
    id: int,
    produto_schema: NovoProdutoSchema,
    session: Session = Depends(pegar_sessao),
    usuario=Depends(verificar_adm)
):
    produto = session.query(Sabores).filter(Sabores.id == id).first()
    if not produto:
        raise HTTPException(status_code=404, detail='Produto não encontrado')

    grade = session.query(GradeSabores).filter(GradeSabores.sabores_id == id).first()
    if not grade:
        raise HTTPException(status_code=404, detail='Grade do produto não encontrada')

    produto.nome = produto_schema.nome
    produto.descricao = produto_schema.descricao
    produto.ativo = produto_schema.ativo
    produto.categoria_id = produto_schema.categoria_id
    if produto_schema.imagem_url:
        produto.imagem_url = produto_schema.imagem_url

    grade.grade_id = produto_schema.grade_id

    for i in produto_schema.precos:
        preco_db = session.query(PrecoPizza).filter(
            PrecoPizza.sabor_id == id,
            PrecoPizza.tamanho_id == i.tamanho_id
        ).first()
        if preco_db:
            preco_db.preco = i.preco
        else:
            session.add(PrecoPizza(sabor_id=id, tamanho_id=i.tamanho_id, preco=i.preco))

    session.commit()
    return {'mensagem': 'Produto editado com sucesso', 'produto': jsonable_encoder(produto)}


@produto_routes.patch('/produto/{id}/status')
async def toggle_status(
    id: int,
    session: Session = Depends(pegar_sessao),
    usuario=Depends(verificar_adm)
):
    produto = session.query(Sabores).filter(Sabores.id == id).first()
    if not produto:
        raise HTTPException(status_code=404, detail='Produto não encontrado')

    produto.ativo = not produto.ativo
    session.commit()
    return {'id': id, 'ativo': produto.ativo}


@produto_routes.get('/listar/novo-produto/{id}')
async def listar_produto(
    id: int,
    request: Request,
    session: Session = Depends(pegar_sessao),
    usuario=Depends(verificar_adm)
):
    produto = session.query(Sabores).filter(Sabores.id == id).first()
    grade = session.query(GradeSabores).filter(GradeSabores.sabores_id == id).first()
    precos = session.query(PrecoPizza).filter(PrecoPizza.sabor_id == id).all()

    if not produto:
        raise HTTPException(status_code=404, detail='Produto não encontrado')
    if not grade:
        raise HTTPException(status_code=404, detail='Grade do produto não encontrada')

    imagem_url = produto.imagem_url
    if imagem_url and not imagem_url.startswith('http'):
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        imagem_url = f'{base_url}{imagem_url}'

    return {
        'id': produto.id,
        'nome': produto.nome,
        'descricao': produto.descricao,
        'ativo': produto.ativo,
        'categoria_id': produto.categoria_id,
        'grade_id': grade.grade_id,
        'precos': precos,
        'imagem_url': imagem_url
    }


@produto_routes.get('/listar/todos-produtos')
async def listar_todos_produtos(
    request: Request,
    session: Session = Depends(pegar_sessao),
    usuario=Depends(verificar_adm)
):
    produtos = session.query(Sabores).all()
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    return [
        {
            'id': p.id,
            'nome': p.nome,
            'descricao': p.descricao,
            'ativo': p.ativo,
            'categoria_id': p.categoria_id,
            'imagem_url': f'{base_url}{p.imagem_url}' if p.imagem_url and not p.imagem_url.startswith('http') else p.imagem_url,
        }
        for p in produtos
    ]


@produto_routes.delete('/deletar/sabor/{id}')
async def deletar_sabor(
    id: int,
    session: Session = Depends(pegar_sessao),
    usuario=Depends(verificar_adm)
):
    sabor = session.query(Sabores).filter(Sabores.id == id).first()
    if not sabor:
        raise HTTPException(status_code=404, detail='Sabor não encontrado')

    if sabor.imagem_url and not sabor.imagem_url.startswith('http'):
        caminho = sabor.imagem_url.lstrip('/')
        if os.path.exists(caminho):
            os.remove(caminho)

    session.query(PrecoPizza).filter(PrecoPizza.sabor_id == id).delete()
    session.delete(sabor)
    session.commit()
    return {'mensagem': 'Sabor deletado com sucesso'}

@produto_routes.get('/listar/produtos-por-grade')
async def produtos_por_grade(
    request: Request,
    session: Session = Depends(pegar_sessao),
    usuario=Depends(verificar_adm)
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
        produtos = []
        for s in sabores:
            menor_preco = session.query(PrecoPizza).filter(PrecoPizza.sabor_id == s.id).order_by(PrecoPizza.preco).first()
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