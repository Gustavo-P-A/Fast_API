from fastapi import APIRouter
from models import Usuario, db
from sqlalchemy.orm import sessionmaker

auth_router = APIRouter(prefix='/auth', tags=['auth '])

@auth_router.get('/')
async def home():
    return{'mensagem': 'voce acesso a rota de autenticacao'}

@auth_router.post('/criar_usuario')
async def criar_usuario(email: str, senha: str, nome: str):
    Session = sessionmaker(bind=db)
    session = Session()
    usuario = session.query(Usuario).filter(Usuario.email == email).first()
    if usuario:
        pass
    else:
        novo_usuario = Usuario(nome, email, senha)
        session.add(novo_usuario)
        
