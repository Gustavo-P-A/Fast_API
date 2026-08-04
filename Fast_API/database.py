import os
from typing import Callable

from dotenv import load_dotenv
from fastapi import Request, Response
from fastapi.routing import APIRoute
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://pizzaria_app:pizzaria_dev_pw@localhost:5432/pizzaria",
)


pool = ConnectionPool(
    DATABASE_URL,
    open=False,
    min_size=1,
    max_size=10,
    kwargs={"row_factory": dict_row},
)


def pegar_conexao(request: Request):
    
    with pool.connection() as conn:
        request.state.conn = conn
        yield conn


class ConnCommitRoute(APIRoute):
    
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
    
    return conn.execute(query, params).fetchone()


def fetch_all(conn, query: str, params: tuple = ()) -> list[dict]:
    return conn.execute(query, params).fetchall()


def execute(conn, query: str, params: tuple = ()):
    return conn.execute(query, params)