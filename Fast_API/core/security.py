import hashlib
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from core.settings import settings
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from dependencies import pegar_sessao
from models import Usuario

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth2_schema = OAuth2PasswordBearer(tokenUrl='auth/login-form')


async def hash_password(password: str) -> str:
    password_monster = password + settings.SECRET
    hash =hashlib.sha256(password_monster.encode()).hexdigest()
    return bcrypt_context.hash(hash)

def verify_password(password: str, hashed_password: str) -> bool:
    password_monster = password + settings.SECRET
    hash = hashlib.sha256(password_monster.encode()).hexdigest()
    return bcrypt_context.verify(hash, hashed_password)

def criar_token (id_usuario, duracao_token = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)):
    data_expiracao = datetime.now(timezone.utc) + duracao_token
    dic_info = {
        'sub': str(id_usuario), 'exp': data_expiracao
    }
    jwt_codificado = jwt.encode(dic_info, settings.SECRET_KEY, settings.ALGORITHM)
    return jwt_codificado 


def verificar_token(token: str = Depends(oauth2_schema), session: Session = Depends(pegar_sessao)):
    try:
        dic_info = jwt.decode(token, settings.SECRET_KEY, settings.ALGORITHM)
        id_usuario = dic_info.get('sub')
    except JWTError:
        raise HTTPException(status_code=401, detail='Acesso negado')
    usuario = session.query(Usuario).filter(Usuario.id==int(id_usuario)).first()
    if not usuario:
        raise HTTPException (status_code=401, detail='Acesso invalido')
    return usuario
