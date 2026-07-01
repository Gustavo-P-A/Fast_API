"""
Configuração compartilhada dos testes (pytest carrega este arquivo
automaticamente, não precisa importar em lugar nenhum).

Ideia central: cada teste roda contra um banco SQLite EM MEMÓRIA,
criado do zero e destruído no final. Isso é o que separa "teste
automatizado" de "teste manual no /docs": ele não depende de estado
que sobrou de uma execução anterior, e não toca no seu banco.db real.
"""
import os

# Precisa vir ANTES de importar qualquer coisa do projeto, porque
# core/settings.py lê essas variáveis assim que é importado.
os.environ.setdefault("SECRET_KEY", "chave-de-teste-nao-usar-em-producao")
os.environ.setdefault("SECRET", "segredo-de-teste-nao-usar-em-producao")

import sys
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Garante que os módulos do backend (main, models, produto_routes...)
# sejam importáveis quando o pytest rodar a partir da raiz do projeto.
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "Fast_API")
sys.path.insert(0, os.path.abspath(BACKEND_DIR))

# main.py monta StaticFiles(directory="uploads") com caminho relativo,
# então essa pasta precisa existir em relação ao diretório de trabalho
# de onde o pytest é executado.
os.makedirs(os.path.join(os.path.abspath(BACKEND_DIR), "uploads"), exist_ok=True)
os.chdir(os.path.abspath(BACKEND_DIR))

from models import Base, Usuario  # noqa: E402
from dependencies import pegar_sessao  # noqa: E402
from dependsadm import verificar_adm  # noqa: E402
from core.security import verificar_token  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture()
def db_session():
    """Cria um banco SQLite em memória novo para cada teste."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture()
def admin_usuario(db_session):
    """Um usuário admin já salvo no banco de teste, pronto pra ser
    usado como 'usuário logado' nos testes que exigem admin."""
    usuario = Usuario(
        nome="Admin Teste",
        email="admin@teste.com",
        senha="hash-fake",
        ativo=True,
        adm=True,
    )
    db_session.add(usuario)
    db_session.commit()
    db_session.refresh(usuario)
    return usuario


@pytest.fixture()
def usuario_comum(db_session):
    """Um usuário 'dono do pedido' comum, não-admin -- usado para
    testar as regras de 'só o dono ou um admin pode mexer no pedido'."""
    usuario = Usuario(
        nome="Cliente Teste",
        email="cliente@teste.com",
        senha="hash-fake",
        ativo=True,
        adm=False,
    )
    db_session.add(usuario)
    db_session.commit()
    db_session.refresh(usuario)
    return usuario


@pytest.fixture()
def client(db_session, admin_usuario):
    """
    TestClient do FastAPI com duas dependências trocadas:
    - pegar_sessao -> devolve a sessão de teste (banco em memória)
    - verificar_adm -> devolve direto o admin de teste, sem precisar
      logar de verdade / gerar JWT / mandar cookie

    Isso é o "dependency override" do FastAPI: testamos a LÓGICA da
    rota sem precisar simular autenticação de verdade em todo teste.
    (Autenticação em si merece seus próprios testes separados.)
    """
    def _get_test_session():
        yield db_session

    def _get_test_admin():
        return admin_usuario

    app.dependency_overrides[pegar_sessao] = _get_test_session
    app.dependency_overrides[verificar_adm] = _get_test_admin

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture()
def client_como(db_session):
    """
    Variante do fixture 'client' para rotas que usam verificar_token
    diretamente (como order_routes.py), em vez de verificar_adm.

    Uso: client_como(usuario_comum) ou client_como(admin_usuario)
    -- assim um mesmo teste pode simular "logado como fulano" sem
    precisar de um fixture fixo por tipo de usuário.
    """
    def _fabrica(usuario_logado):
        def _get_test_session():
            yield db_session

        def _get_test_usuario():
            return usuario_logado

        app.dependency_overrides[pegar_sessao] = _get_test_session
        app.dependency_overrides[verificar_token] = _get_test_usuario

        return TestClient(app)

    yield _fabrica
    app.dependency_overrides.clear()