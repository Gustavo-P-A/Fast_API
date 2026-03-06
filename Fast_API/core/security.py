import hashlib
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from core.settings import settings

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth2_schema = OAuth2PasswordBearer(tokenUrl='auth/login-form')


async def hash_password(password: str) -> str:
    password_monster = password + settings.SECRET
    hash =hashlib.sha256(password_monster.encode()).hexdigest()
    return bcrypt_context.hash(hash)

async def verify_password(password: str, hashed_password: str) -> bool:
    password_monster = password + settings.SECRET
    hash = hashlib.sha256(password_monster.encode()).hexdigest()
    return bcrypt_context.verify(hash, hashed_password)

async def access_token_expires(user_id: str, expires_minutes: int = None) -> str:
    if expires_minutes is None:
        expires_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    expires = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload = {"sub": str(user_id), "exp": expires}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

async def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

