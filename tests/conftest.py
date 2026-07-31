"""
Configuração compartilhada dos testes (pytest carrega este arquivo
automaticamente, não precisa importar em lugar nenhum).

Ideia central: cada teste roda dentro de uma transação Postgres que
nunca é commitada -- ao final do teste, um ROLLBACK desfaz tudo, então
o próximo teste começa limpo, sem precisar recriar tabela a cada vez.
O schema (as 20 tabelas de sql/schema.sql) é recriado do zero uma vez
por sessão de testes.

Precisa de um Postgres acessível via TEST_DATABASE_URL (default: banco
pizzaria_test local -- suba com `docker compose up` na raiz do repo e
crie o banco uma vez com `createdb -h localhost -U pizzaria_app pizzaria_test`).
"""
import os

# Precisa vir ANTES de importar qualquer coisa do projeto, porque
# core/settings.py e database.py leem essas variáveis assim que são importados.
os.environ.setdefault("SECRET_KEY", "chave-de-teste-nao-usar-em-producao")
os.environ.setdefault("SECRET", "segredo-de-teste-nao-usar-em-producao")
os.environ["DATABASE_URL"] = os.getenv(
    "TEST_DATABASE_URL", "postgresql://pizzaria_app:pizzaria_dev_pw@localhost:5432/pizzaria_test"
)
TEST_DATABASE_URL = os.environ["DATABASE_URL"]

import sys
import psycopg
from psycopg.rows import dict_row
import pytest
from fastapi.testclient import TestClient

# Garante que os módulos do backend (main, database, produto_routes...)
# sejam importáveis quando o pytest rodar a partir da raiz do projeto.
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "Fast_API")
sys.path.insert(0, os.path.abspath(BACKEND_DIR))

# main.py monta StaticFiles(directory="uploads") com caminho relativo,
# então essa pasta precisa existir em relação ao diretório de trabalho
# de onde o pytest é executado.
os.makedirs(os.path.join(os.path.abspath(BACKEND_DIR), "uploads"), exist_ok=True)
os.chdir(os.path.abspath(BACKEND_DIR))

from database import pegar_conexao  # noqa: E402
from dependsadm import verificar_adm  # noqa: E402
from core.security import verificar_token  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _preparar_schema_teste():
    """Recria as tabelas do zero uma vez por sessão de testes, a
    partir de sql/schema.sql -- garante que a estrutura do banco de
    teste está sempre em dia com o schema atual do projeto."""
    schema_path = os.path.join(os.path.abspath(BACKEND_DIR), "sql", "schema.sql")
    with open(schema_path) as f:
        schema_sql = f.read()
    with psycopg.connect(TEST_DATABASE_URL, autocommit=True) as conn:
        conn.execute("DROP SCHEMA public CASCADE")
        conn.execute("CREATE SCHEMA public")
        conn.execute(schema_sql)


@pytest.fixture()
def db_conn():
    """Uma conexão por teste, dentro de uma transação nunca commitada
    -- ao sair do teste, o rollback desfaz tudo que ele escreveu."""
    with psycopg.connect(TEST_DATABASE_URL, row_factory=dict_row, autocommit=False) as conn:
        yield conn
        conn.rollback()


@pytest.fixture()
def admin_usuario(db_conn):
    """Um usuário admin já salvo no banco de teste, pronto pra ser
    usado como 'usuário logado' nos testes que exigem admin."""
    return db_conn.execute(
        "INSERT INTO usuarios (nome, email, senha, ativo, adm) VALUES (%s, %s, %s, %s, %s) RETURNING *",
        ("Admin Teste", "admin@teste.com", "hash-fake", True, True),
    ).fetchone()


@pytest.fixture()
def usuario_comum(db_conn):
    """Um usuário 'dono do pedido' comum, não-admin -- usado para
    testar as regras de 'só o dono ou um admin pode mexer no pedido'."""
    return db_conn.execute(
        "INSERT INTO usuarios (nome, email, senha, ativo, adm) VALUES (%s, %s, %s, %s, %s) RETURNING *",
        ("Cliente Teste", "cliente@teste.com", "hash-fake", True, False),
    ).fetchone()


@pytest.fixture()
def client(db_conn, admin_usuario):
    """
    TestClient do FastAPI com duas dependências trocadas:
    - pegar_conexao -> devolve a conexão de teste (transação isolada)
    - verificar_adm -> devolve direto o admin de teste, sem precisar
      logar de verdade / gerar JWT / mandar cookie
    """
    def _get_test_conn():
        yield db_conn

    def _get_test_admin():
        return admin_usuario

    app.dependency_overrides[pegar_conexao] = _get_test_conn
    app.dependency_overrides[verificar_adm] = _get_test_admin

    # Sem "with": o lifespan de main.py (que abre/fecha o pool de verdade)
    # não precisa rodar aqui -- pegar_conexao já está sobrescrito acima,
    # então nenhuma requisição de teste toca o pool real. Além disso, o
    # pool real não pode ser reaberto depois de fechado (psycopg_pool),
    # então entrar no lifespan a cada teste quebraria a partir do segundo.
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture()
def client_como(db_conn):
    """
    Variante do fixture 'client' para rotas que usam verificar_token
    diretamente (como order_routes.py), em vez de verificar_adm.

    Uso: client_como(usuario_comum) ou client_como(admin_usuario)
    -- assim um mesmo teste pode simular "logado como fulano" sem
    precisar de um fixture fixo por tipo de usuário.
    """
    def _fabrica(usuario_logado):
        def _get_test_conn():
            yield db_conn

        def _get_test_usuario():
            return usuario_logado

        app.dependency_overrides[pegar_conexao] = _get_test_conn
        app.dependency_overrides[verificar_token] = _get_test_usuario

        return TestClient(app)

    try:
        yield _fabrica
    finally:
        app.dependency_overrides.clear()