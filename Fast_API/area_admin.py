from fastapi import APIRouter, Depends, HTTPException, Request
from models import PrecoPizza, Sabores, Usuario, Tamanhos, Adicionais, Pedidos, PrecoAdicional, Grade, GradeSabores, Categoria
from dependencies import pegar_sessao
from dependsadm import verificar_adm
from schemas import GradeCriarSchema, TamanhosSchema, AdicionaisSchema, ResponsePedidoSchema, PrecoAdicionalSchema, GradeSchema, GradeSaboresSchema, CategoriaSchema
from sqlalchemy.orm import Session
from enum import Enum

area_admin = APIRouter(prefix='/admin', tags=['admin'])


@area_admin.post('/tamanhos')
async def tamanho_pizza(tamanho_schema: TamanhosSchema, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    session.add(Tamanhos(nome=tamanho_schema.nome, qtd_sabores=tamanho_schema.qtd_sabores, qtd_bordas=tamanho_schema.qtd_bordas))
    session.commit()
    return {'mensagem': 'Tamanho adicionado com sucesso'}


@area_admin.post('/adicionais')
async def adicionais_pizza(adicionais_schema: AdicionaisSchema, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    session.add(Adicionais(nome=adicionais_schema.nome))
    session.commit()
    return {'mensagem': 'Adicionais adicionado com sucesso'}


@area_admin.post('/preco_adicional')
async def precos_adicional(preco_adicional_schema: PrecoAdicionalSchema, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    session.add(PrecoAdicional(adicional_id=preco_adicional_schema.adicional_id, tamanho_id=preco_adicional_schema.tamanho_id, preco=preco_adicional_schema.preco))
    session.commit()
    return {'mensagem': 'Preco adicionais cadastrado com sucesso'}


class TipoStatus(str, Enum):
    CONFIRMADO = 'CONFIRMADO'
    EM_PREPARO = 'EM PREPARO'
    SAIU_PARA_ENTREGA = 'SAIU PARA ENTREGA'
    ENTREGUE = 'ENTREGUE'
    CANCELADO = 'CANCELADO'


@area_admin.put('/mudar_status/{id_pedido}')
async def muda_status(id_pedido: int, tipo_status: TipoStatus, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    pedido = session.query(Pedidos).filter(Pedidos.id == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')
    
    # Bloqueia cancelamento após saiu para entrega
    nao_cancelaveis = {'SAIU PARA ENTREGA', 'ENTREGUE'}
    if tipo_status == TipoStatus.CANCELADO and pedido.status in nao_cancelaveis:
        raise HTTPException(status_code=400, detail='Pedido não pode ser cancelado neste estágio')
    
    pedido.status = tipo_status
    session.commit()
    return {'mensagem': 'Status editado com sucesso'}



@area_admin.get('/listar/pedidos-cliente')
async def listar_pedidos_cliente(
    status: str = None,
    session: Session = Depends(pegar_sessao),
    usuario: Usuario = Depends(verificar_adm)
):
    query = session.query(Pedidos)
    if status:
        query = query.filter(Pedidos.status == status.upper())
    pedidos = query.order_by(Pedidos.id.desc()).all()
    return [
        {
            'id': p.id,
            'status': p.status,
            'preco': p.preco,
            'formato_de_pagamento': p.formato_de_pagamento.value if p.formato_de_pagamento else None,
            'created_at': p.created_at.isoformat() if p.created_at else None,
            'cliente_nome': p.usuario_rel.nome if p.usuario_rel else None,
            'cliente_email': p.usuario_rel.email if p.usuario_rel else None,
            'total_itens': len(p.itens),
        }
        for p in pedidos
    ]


@area_admin.put('/editar/tamanho/{id_tamanho}')
async def editar_tamanho(id_tamanho: int, tamanho_schema: TamanhosSchema, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    tamanho = session.query(Tamanhos).filter(Tamanhos.id == id_tamanho).first()
    if not tamanho:
        raise HTTPException(status_code=404, detail='Tamanho não encontrado')
    tamanho.nome = tamanho_schema.nome
    tamanho.qtd_sabores = tamanho_schema.qtd_sabores
    session.commit()
    return {'mensagem': 'Tamanho editado com sucesso'}


@area_admin.put('/editar/adicionais/{id_adicionais}')
async def editar_adicionais(id_adicionais: int, id_tamanho: int, adicionais_schema: PrecoAdicionalSchema, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    adicional = session.query(PrecoAdicional).filter(PrecoAdicional.adicional_id == id_adicionais, PrecoAdicional.tamanho_id == id_tamanho).first()
    if not adicional:
        raise HTTPException(status_code=404, detail='Produto não encontrado')
    adicional.adicional_id = adicionais_schema.adicional_id
    adicional.tamanho_id = adicionais_schema.tamanho_id
    adicional.preco = adicionais_schema.preco
    session.commit()
    return {'mensagem': 'Adicionais editado com sucesso'}


@area_admin.delete('/deletar/tamanho/{id_tamanho}')
async def deletar_tamanho(id_tamanho: int, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    tamanho = session.query(Tamanhos).filter(Tamanhos.id == id_tamanho).first()
    if not tamanho:
        raise HTTPException(status_code=404, detail='Tamanho não encontrado')
    session.delete(tamanho)
    session.commit()
    return {'msg': 'Tamanho deletado com sucesso'}


@area_admin.delete('/deletar/preco/{id_preco}')
async def deletar_preco(id_preco: int, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    from models import PrecoPizza
    preco = session.query(PrecoPizza).filter(PrecoPizza.id == id_preco).first()
    if not preco:
        raise HTTPException(status_code=404, detail='Preco não encontrado')
    session.delete(preco)
    session.commit()
    return {'msg': 'Preco deletado com sucesso'}


@area_admin.delete('/deletar/adicionais/{id_adicionais}')
async def deletar_adicionais(id_adicionais: int, id_tamanho: int, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    adicional = session.query(PrecoAdicional).filter(PrecoAdicional.adicional_id == id_adicionais, PrecoAdicional.tamanho_id == id_tamanho).first()
    if not adicional:
        raise HTTPException(status_code=404, detail='Produto não encontrado')
    session.delete(adicional)
    session.commit()
    return {'mensagem': 'Adicionais deletado com sucesso'}


@area_admin.post('/grade')
async def criar_grade(grade_schema: GradeCriarSchema, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    session.add(Grade(nome=grade_schema.nome, posicao=grade_schema.posicao))
    session.commit()
    return {'mensagem': 'Grade criada'}


@area_admin.get('/listar/grade', response_model=list[GradeSchema])
async def listar_grade(session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    return session.query(Grade).all()


@area_admin.delete('/deletar/grade/{id_grade}')
async def deletar_grade(id_grade: int, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    grade = session.query(Grade).filter(Grade.id == id_grade).first()
    if not grade:
        raise HTTPException(status_code=404, detail='Grade não encontrada')
    session.delete(grade)
    session.commit()
    return {'mensagem': 'Grade excluida'}


@area_admin.post('/grade_sabores')
async def grade_sabores(grade_sabores_schema: GradeSaboresSchema, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    session.add(GradeSabores(grade_id=grade_sabores_schema.id_grade, sabores_id=grade_sabores_schema.id_sabores))
    session.commit()
    return {'mensagem': 'Grade de sabores criada'}


@area_admin.post('/categoria')
async def criar_categoria(categoria_schema: CategoriaSchema, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    session.add(Categoria(nome=categoria_schema.nome))
    session.commit()
    return {'mensagem': 'Categoria criada'}


@area_admin.get('/listar/categoria')
async def listar_categoria(session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    return session.query(Categoria).all()


@area_admin.get('/listar/tamanho')
async def listar_tamanho(session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    return session.query(Tamanhos).all()

@area_admin.get('/clientes')
async def listar_clientes(session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    clientes = session.query(Usuario).filter(Usuario.adm == False).all()
    return [
        {
            'id': c.id,
            'nome': c.nome,
            'email': c.email,
            'ativo': c.ativo,
            'total_pedidos': len(c.pedidos),
            'gasto_total': round(sum(p.preco or 0 for p in c.pedidos), 2),
        }
        for c in clientes
    ]


@area_admin.get('/clientes/{id}/pedidos')
async def pedidos_do_cliente(id: int, session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_adm)):
    cliente = session.query(Usuario).filter(Usuario.id == id, Usuario.adm == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail='Cliente não encontrado')
    return [
        {
            'id': p.id,
            'status': p.status,
            'preco': p.preco,
            'formato_de_pagamento': p.formato_de_pagamento.value if p.formato_de_pagamento else None,
        }
        for p in cliente.pedidos
    ]


@area_admin.patch('/produtos/mover-grade')
async def mover_produtos_grade(
    body: dict,
    session: Session = Depends(pegar_sessao),
    usuario: Usuario = Depends(verificar_adm)
):
    sabor_ids = body.get("sabor_ids", [])
    grade_id = body.get("grade_id")
    if not sabor_ids or not grade_id:
        raise HTTPException(status_code=400, detail="sabor_ids e grade_id são obrigatórios")
    grade = session.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Grade não encontrada")
    atualizados = (
        session.query(GradeSabores)
        .filter(GradeSabores.sabores_id.in_(sabor_ids))
        .all()
    )
    ids_atualizados = {gs.sabores_id for gs in atualizados}
    for gs in atualizados:
        gs.grade_id = grade_id
    novos = [
        GradeSabores(grade_id=grade_id, sabores_id=sid)
        for sid in sabor_ids if sid not in ids_atualizados
    ]
    session.add_all(novos)
    session.commit()
    return {"mensagem": f"{len(sabor_ids)} produto(s) movido(s) para a grade {grade.nome}"}


@area_admin.get('/listar/produtos-por-grade')
async def produtos_por_grade(
    request: Request,
    session: Session = Depends(pegar_sessao),
    usuario: Usuario = Depends(verificar_adm)
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
            menor_preco = (
                session.query(PrecoPizza)
                .filter(PrecoPizza.sabor_id == s.id)
                .order_by(PrecoPizza.preco)
                .first()
            )
            imagem = (
                f"{base_url}{s.imagem_url}"
                if s.imagem_url and not s.imagem_url.startswith("http")
                else s.imagem_url
            )
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