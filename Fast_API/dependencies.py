from models import db
from sqlalchemy.orm import sessionmaker, Session
from models import Usuario
from fastapi import Depends, HTTPException
from jose import jwt, JWTError
from core.settings import settings
from core.security import oauth2_schema

def pegar_sessao():
    try:
        Session = sessionmaker(bind=db)
        session = Session()
        yield session
    finally:
        session.close()

def verificar_token(token: str = Depends(oauth2_schema), session: Session = Depends(pegar_sessao)):
    try:
        dic_info = jwt.decode(token, settings.SECRET_KEY, settings.ALGORITHM)
        id_usuario = int(dic_info.get('sub'))
    except JWTError:
        raise HTTPException(status_code=401, detail='acesso negado')
    usuario = session.query(Usuario).filter(Usuario.id == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=401, detail='Acesso Invalido')
    return usuario