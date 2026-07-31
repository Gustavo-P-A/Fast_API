import logging
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from database import pegar_conexao, fetch_one, ConnCommitRoute
from core.security import criar_token, hash_password, verify_password, verificar_refresh_token, verificar_token
from core.settings import settings
from core.limiter import limiter
from schemas import UsuarioSchema, LoginSchema, AtualizarUsuarioSchema
from datetime import timedelta

logger = logging.getLogger("auth")


auth_router = APIRouter(prefix='/auth', tags=['auth'], route_class=ConnCommitRoute)

# secure=True em produção (HTTPS), False em desenvolvimento (HTTP) — controlado
# pela variável de ambiente COOKIE_SECURE no .env.
COOKIE_SECURE = settings.COOKIE_SECURE
COOKIE_SAMESITE = "strict"


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key='token',
        value=access_token,
        httponly=True,
        samesite=COOKIE_SAMESITE,
        secure=COOKIE_SECURE,
        path='/',
        max_age=1800,
    )
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        samesite=COOKIE_SAMESITE,
        secure=COOKIE_SECURE,
        path='/',
        max_age=604800,
    )


def autenticar_usuario(email, senha, conn):
    usuario = fetch_one(conn, "SELECT * FROM usuarios WHERE email = %s", (email,))
    if not usuario:
        logger.warning("Tentativa de login com e-mail inexistente: %s", email)
        return False
    if not verify_password(senha, usuario["senha"]):
        logger.warning("Falha de autenticação para usuário: %s", email)
        return False
    logger.info("Login bem-sucedido para usuário: %s", email)
    return usuario


@auth_router.post('/refresh')
async def refresh_token(response: Response, usuario: dict = Depends(verificar_refresh_token)):
    access_token = criar_token(usuario["id"])
    refresh = criar_token(usuario["id"], duracao_token=timedelta(days=7))

    _set_auth_cookies(response, access_token, refresh)

    return {"mensagem": "Token atualizado com sucesso"}

@auth_router.get('/me')
async def me(usuario: dict = Depends(verificar_token)):
    return {
        "id": usuario["id"],
        "nome": usuario["nome"],
        "email": usuario["email"],
        "cpf": usuario["cpf"],
        "telefone": usuario["telefone"],
        "adm": usuario["adm"],
    }


@auth_router.put('/me')
async def atualizar_me(
    dados: AtualizarUsuarioSchema,
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token),
):
    email_em_uso = fetch_one(
        conn,
        "SELECT id FROM usuarios WHERE email = %s AND id != %s",
        (dados.email, usuario["id"]),
    )
    if email_em_uso:
        raise HTTPException(status_code=400, detail='Este e-mail já está em uso por outra conta')

    if dados.cpf:
        cpf_em_uso = fetch_one(
            conn,
            "SELECT id FROM usuarios WHERE cpf = %s AND id != %s",
            (dados.cpf, usuario["id"]),
        )
        if cpf_em_uso:
            raise HTTPException(status_code=400, detail='Este CPF já está cadastrado em outra conta')

    usuario_atualizado = fetch_one(
        conn,
        """
        UPDATE usuarios SET nome = %s, email = %s, cpf = %s, telefone = %s
        WHERE id = %s
        RETURNING id, nome, email, cpf, telefone, adm
        """,
        (dados.nome, dados.email, dados.cpf, dados.telefone, usuario["id"]),
    )

    return {
        "mensagem": "Dados atualizados com sucesso",
        **usuario_atualizado,
    }

@auth_router.post('/criar_usuario')
@limiter.limit("3/minute")
async def criar_usuario(request: Request, usuario_schema: UsuarioSchema, response: Response, conn = Depends(pegar_conexao)):
    usuario = fetch_one(conn, "SELECT id FROM usuarios WHERE email = %s", (usuario_schema.email,))
    if usuario:
        raise HTTPException(status_code=400, detail='E-mail já cadastrado')
    else:
        senha_cripitografada = await hash_password(usuario_schema.senha)
        novo_usuario = fetch_one(
            conn,
            "INSERT INTO usuarios (nome, email, senha) VALUES (%s, %s, %s) RETURNING id",
            (usuario_schema.nome, usuario_schema.email, senha_cripitografada),
        )

        access_token = criar_token(novo_usuario["id"])
        refresh = criar_token(novo_usuario["id"], duracao_token=timedelta(days=7))
        _set_auth_cookies(response, access_token, refresh)
        return {"mensagem": "Cadastro realizado com sucesso"}


@auth_router.post('/login')
@limiter.limit("5/minute")
async def login(request: Request, response: Response, login_schema: LoginSchema, conn = Depends(pegar_conexao)):
    usuario = autenticar_usuario(login_schema.email, login_schema.senha, conn)
    if not usuario:
        raise HTTPException(status_code=400, detail='Usuario não encontrado ou credenciais invalidas')
    else:
        access_token = criar_token(usuario["id"])
        refresh = criar_token(usuario["id"], duracao_token=timedelta(days=7))
        _set_auth_cookies(response, access_token, refresh)
        return {"mensagem": "Login realizado com sucesso"}


@auth_router.post('/logout')
async def logout(response: Response):
    response.delete_cookie('token', path='/', secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE)
    response.delete_cookie('refresh_token', path='/', secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE)
    return {"mensagem": "Logout realizado com sucesso"}
