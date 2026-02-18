from fastapi import APIRouter, Depends
from models import Usuario
from dependencies import pegar_sessao
from main import bcrypt_context

auth_router = APIRouter(prefix='/auth', tags=['auth '])

@auth_router.get('/')
async def home():
    return{'mensagem': 'voce acesso a rota de autenticacao'}

@auth_router.post('/criar_usuario')
async def criar_usuario(email: str, senha: str, nome: str, session = Depends(pegar_sessao)):
    usuario = session.query(Usuario).filter(Usuario.email == email).first()
    if usuario:
        return {"mensagem": 'já existe um usuario com esse email'}
    else:
        senha_cripitografada = bcrypt_context.hash(senha)
        novo_usuario = Usuario(nome, email, senha_cripitografada)
        session.add(novo_usuario)
        session.commit()
        return {"mensagem": "usuário cadastrado com sucesso"}
