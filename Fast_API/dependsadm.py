from models import Usuario
from fastapi import Depends, HTTPException
from core.security import verificar_token

def verificar_adm(usuario: Usuario = Depends(verificar_token)):
    if not usuario.adm:
        raise HTTPException(status_code=403, detail="Acesso negado")
    return usuario