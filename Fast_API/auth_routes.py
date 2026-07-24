from fastapi import APIRouter, Depends, HTTPException, Response
from models import Usuario
from dependencies import pegar_sessao
from core.security import criar_token, hash_password, verify_password, verificar_refresh_token, verificar_token
from schemas import UsuarioSchema, LoginSchema
from sqlalchemy.orm import Session
from datetime import timedelta  
                                                                                                                                               

auth_router = APIRouter(prefix='/auth', tags=['auth'])


def autenticar_usuario(email, senha, session: Session):
    usuario = session.query(Usuario).filter(Usuario.email == email).first()
    if not usuario:
        return False
    if not verify_password(senha, usuario.senha):
        return False    
    return usuario


@auth_router.post('/refresh')  
async def refresh_token(response: Response, usuario: Usuario = Depends(verificar_refresh_token)):
    access_token = criar_token(usuario.id)  
    refresh = criar_token(usuario.id, duracao_token=timedelta(days=7)) 
    
    response.set_cookie(key='token', value=access_token, httponly=True, samesite='lax', secure=False, path='/', max_age=1800)
    response.set_cookie(key='refresh_token', value=refresh, httponly=True, samesite='lax', secure=False, path='/', max_age=604800)
    
    return {"mensagem": "Token atualizado com sucesso"}

@auth_router.get('/me')
async def me(usuario: Usuario = Depends(verificar_token)):
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "adm": usuario.adm
    }

@auth_router.post('/criar_usuario')
async def criar_usuario(usuario_schema:UsuarioSchema,response: Response , session: Session =  Depends(pegar_sessao)): 
    usuario = session.query(Usuario).filter(Usuario.email == usuario_schema.email).first()
    if usuario:
        raise HTTPException(status_code=400, detail='E-mail já cadastrado')
    else:
        senha_cripitografada = await hash_password(usuario_schema.senha)
        novo_usuario = Usuario(nome=usuario_schema.nome, email=usuario_schema.email, senha=senha_cripitografada)        
        session.add(novo_usuario)
        session.commit()
        session.refresh(novo_usuario)   

        access_token = criar_token(novo_usuario.id)
        refresh = criar_token(novo_usuario.id, duracao_token=timedelta(days=7))
        response.set_cookie(key='token', value=access_token, httponly=True, samesite='lax', secure=False, path='/', max_age=1800)
        response.set_cookie(key='refresh_token', value=refresh, httponly=True, samesite='lax', secure=False, path='/', max_age=604800)
        return {"mensagem": "Cadastro realizado com sucesso"}


@auth_router.post('/login')
async def login(response: Response,login_schema: LoginSchema, session: Session =  Depends(pegar_sessao)):
    usuario = autenticar_usuario(login_schema.email, login_schema.senha, session)
    if not usuario:
        raise HTTPException(status_code=400, detail='Usuario não encontrado ou credenciais invalidas')
    else:
        access_token = criar_token(usuario.id)
        refresh = criar_token(usuario.id, duracao_token=timedelta(days=7))
        response.set_cookie(key='token', value=access_token, httponly=True, samesite='lax', secure=False, path='/', max_age=1800)
        response.set_cookie(key='refresh_token', value=refresh, httponly=True, samesite='lax', secure=False, path='/', max_age=604800)
        return {"mensagem": "Login realizado com sucesso"}


@auth_router.post('/logout')
async def logout(response: Response):
    response.delete_cookie('token', path='/')
    response.delete_cookie('refresh_token', path='/')
    return {"mensagem": "Logout realizado com sucesso"}