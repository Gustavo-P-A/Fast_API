"""
Camada central de acesso ao banco — PostgreSQL puro, sem ORM.

Toda rota que precisa do banco passa por aqui: o pool de conexões, a
dependência `pegar_conexao` (substitui o antigo `pegar_sessao` do
SQLAlchemy), três helpers pra não ficar repetindo
`conn.execute(...).fetchone()` em cada arquivo de rota, e `ConnCommitRoute`.

Padrão de uso numa rota:

    @router.get("/sabores/{id}")
    def buscar_sabor(id: int, conn = Depends(pegar_conexao)):
        sabor = fetch_one(conn, "SELECT * FROM sabores WHERE id = %s", (id,))
        if not sabor:
            raise HTTPException(status_code=404, detail="Sabor não encontrado")
        return sabor

IMPORTANTE — por que o commit não fica só no cleanup do `yield`:
nesta versão do FastAPI, o código de limpeza de uma dependência com
`yield` roda DEPOIS que a resposta HTTP já foi enviada pro cliente (dá
pra confirmar isso com um teste simples contra um uvicorn de verdade —
não é bug, é como o AsyncExitStack de dependências é montado aqui).
Se o commit ficasse só nesse cleanup, existe uma janela de corrida real:
o cliente recebe "200 OK" e já manda a próxima requisição antes do
commit anterior ter terminado, e essa próxima leitura pode não ver o
escrito ainda. Por isso todo router usa `route_class=ConnCommitRoute`
(uma linha por arquivo de rotas) — ela roda o commit/rollback logo
depois que a função da rota termina, mas antes da resposta ser
enviada, então não tem essa corrida.
"""
import os
from typing import Callable

from dotenv import load_dotenv
from fastapi import Request, Response
from fastapi.routing import APIRoute
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row

# Sem isso, os.getenv() abaixo nunca via o conteúdo do .env -- só
# enxergava variável de ambiente já exportada de verdade no processo.
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://pizzaria_app:pizzaria_dev_pw@localhost:5432/pizzaria",
)

# open=False: o pool só abre conexão de verdade no startup do FastAPI
# (main.py chama pool.open() no lifespan). Isso permite trocar DATABASE_URL
# antes de qualquer conexão existir — é o que os testes fazem pra apontar
# pra um banco de teste em vez do banco "de verdade".
pool = ConnectionPool(
    DATABASE_URL,
    open=False,
    min_size=1,
    max_size=10,
    kwargs={"row_factory": dict_row},
)


def pegar_conexao(request: Request):
    """
    Dependência do FastAPI — equivalente ao antigo `pegar_sessao`.

    Empresta uma conexão do pool pra rota inteira e guarda ela em
    `request.state.conn` — é ali que `ConnCommitRoute` (abaixo) vai
    buscar pra decidir commit ou rollback, logo depois que a rota
    termina. O `with` aqui ainda garante que a conexão volta pro pool
    no final (e serve de rede de segurança: se por algum motivo
    `ConnCommitRoute` não rodar, o psycopg_pool ainda faz o rollback
    sozinho em caso de exceção).
    """
    with pool.connection() as conn:
        request.state.conn = conn
        yield conn


class ConnCommitRoute(APIRoute):
    """
    Toda rota que mexe no banco precisa declarar o router com
    `APIRouter(..., route_class=ConnCommitRoute)`. Depois que a função
    da rota termina (e ainda antes da resposta ser enviada), commita a
    conexão de `request.state.conn` se a resposta foi bem-sucedida
    (status < 400), ou desfaz (rollback) se deu erro -- tratado ou não.
    """
    def get_route_handler(self) -> Callable:
        original_handler = super().get_route_handler()

        async def custom_handler(request: Request) -> Response:
            try:
                response = await original_handler(request)
            except Exception:
                conn = getattr(request.state, "conn", None)
                if conn is not None:
                    conn.rollback()
                raise

            conn = getattr(request.state, "conn", None)
            if conn is not None:
                if response.status_code < 400:
                    conn.commit()
                else:
                    conn.rollback()
            return response

        return custom_handler


def fetch_one(conn, query: str, params: tuple = ()) -> dict | None:
    """Roda um SELECT (ou INSERT/UPDATE ... RETURNING) e devolve a
    primeira linha como dict, ou None se não achou nada."""
    return conn.execute(query, params).fetchone()


def fetch_all(conn, query: str, params: tuple = ()) -> list[dict]:
    """Roda um SELECT e devolve todas as linhas como lista de dicts."""
    return conn.execute(query, params).fetchall()


def execute(conn, query: str, params: tuple = ()):
    """Roda um INSERT/UPDATE/DELETE que não precisa devolver linha
    nenhuma. Devolve o cursor (dá pra checar .rowcount se precisar)."""
    return conn.execute(query, params)