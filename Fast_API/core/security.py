from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from core.settings import settings
from fastapi import Depends, HTTPException, Cookie
from database import pegar_conexao, fetch_one


argon2_context = CryptContext(schemes=['argon2'], deprecated='auto')


def _pepper_password(password: str) -> str:
    return f"{password}{settings.SECRET}"


async def hash_password(password: str) -> str:
    return argon2_context.hash(_pepper_password(password))


def verify_password(password: str, hashed_password: str) -> bool:
    return argon2_context.verify(_pepper_password(password), hashed_password)

def criar_token(id_usuario, duracao_token=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)):
    data_expiracao = datetime.now(timezone.utc) + duracao_token
    dic_info = {
        'sub': str(id_usuario),
        'exp': data_expiracao,
        'iss': 'pizzaria-api',
    }
    jwt_codificado = jwt.encode(dic_info, f"{settings.SECRET_KEY}{settings.SECRET}", settings.ALGORITHM)
    return jwt_codificado

def verificar_refresh_token(refresh_token: str = Cookie(None), conn = Depends(pegar_conexao)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail='Refresh token ausente')
    try:
        dic_info = jwt.decode(refresh_token, f"{settings.SECRET_KEY}{settings.SECRET}", settings.ALGORITHM)
        id_usuario = dic_info.get('sub')

        if id_usuario is None:
            raise HTTPException(status_code=401, detail='Token inválido')

    except JWTError:
        raise HTTPException(status_code=401, detail='Refresh token expirado')

    usuario = fetch_one(conn, "SELECT * FROM usuarios WHERE id = %s", (int(id_usuario),))

    if not usuario:
        raise HTTPException(status_code=401, detail='Usuário não encontrado')

    return usuario


def verificar_token(token: str = Cookie(None), conn = Depends(pegar_conexao)):
    if not token:
        raise HTTPException(status_code=401, detail='Acesso negado: Token ausente')
    try:
        dic_info = jwt.decode(token, f"{settings.SECRET_KEY}{settings.SECRET}", settings.ALGORITHM)
        id_usuario = dic_info.get('sub')

        if id_usuario is None:
            raise HTTPException(status_code=401, detail='Token inválido: Campo sub ausente')

    except JWTError:
        raise HTTPException(status_code=401, detail='Sessão expirada ou token corrompido')

    usuario = fetch_one(conn, "SELECT * FROM usuarios WHERE id = %s", (int(id_usuario),))

    if not usuario:
        raise HTTPException(status_code=401, detail='Usuário não encontrado no sistema')

    return usuario
