"""
Testes das rotas de autenticação (auth_routes.py).

Diferente dos outros módulos de teste, aqui usamos o fixture
`client_autenticacao_real` (só troca pegar_conexao) porque o próprio
fluxo de JWT + cookies é o que está sendo testado -- não faz sentido
simular verificar_token/verificar_adm aqui.

`/auth/criar_usuario` e `/auth/login` têm rate limit (slowapi, por IP).
Como o TestClient sempre "bate" do mesmo endereço, resetamos o limiter
a cada teste pra um teste não estourar o limite por causa do anterior.
"""
import pytest

from core.limiter import limiter


@pytest.fixture(autouse=True)
def _resetar_rate_limit():
    limiter.reset()
    yield


def _payload_usuario(email="novo@teste.com", senha="Senha1234", nome="Fulano"):
    return {"nome": nome, "email": email, "senha": senha}


class TestCriarUsuario:

    def test_cadastra_com_sucesso_e_seta_cookies(self, client_autenticacao_real, db_conn):
        response = client_autenticacao_real.post("/auth/criar_usuario", json=_payload_usuario())

        assert response.status_code == 200
        assert response.json()["mensagem"] == "Cadastro realizado com sucesso"
        assert "token" in response.cookies
        assert "refresh_token" in response.cookies

        usuario = db_conn.execute(
            "SELECT * FROM usuarios WHERE email = %s", ("novo@teste.com",)
        ).fetchone()
        assert usuario is not None
        # nasce sem ser admin (ver comentário em sql/schema.sql sobre o bug antigo)
        assert usuario["adm"] is False
        # senha nunca fica em texto puro
        assert usuario["senha"] != "Senha1234"

    def test_rejeita_email_duplicado(self, client_autenticacao_real, db_conn):
        db_conn.execute(
            "INSERT INTO usuarios (nome, email, senha) VALUES (%s, %s, %s)",
            ("Existente", "duplicado@teste.com", "hash-fake"),
        )

        response = client_autenticacao_real.post(
            "/auth/criar_usuario", json=_payload_usuario(email="duplicado@teste.com")
        )

        assert response.status_code == 400
        assert "já cadastrado" in response.json()["detail"]

    def test_rejeita_senha_curta_ou_sem_numero(self, client_autenticacao_real):
        response = client_autenticacao_real.post(
            "/auth/criar_usuario", json=_payload_usuario(senha="apenasletras")
        )
        assert response.status_code == 422


class TestLogin:

    def test_login_com_sucesso_seta_cookies(self, client_autenticacao_real):
        client_autenticacao_real.post("/auth/criar_usuario", json=_payload_usuario(email="login@teste.com"))

        response = client_autenticacao_real.post(
            "/auth/login", json={"email": "login@teste.com", "senha": "Senha1234"}
        )

        assert response.status_code == 200
        assert response.json()["mensagem"] == "Login realizado com sucesso"
        assert "token" in response.cookies

    def test_rejeita_senha_errada(self, client_autenticacao_real):
        client_autenticacao_real.post("/auth/criar_usuario", json=_payload_usuario(email="senhaerrada@teste.com"))

        response = client_autenticacao_real.post(
            "/auth/login", json={"email": "senhaerrada@teste.com", "senha": "SenhaErrada1"}
        )

        assert response.status_code == 400

    def test_rejeita_email_inexistente(self, client_autenticacao_real):
        response = client_autenticacao_real.post(
            "/auth/login", json={"email": "naoexiste@teste.com", "senha": "Senha1234"}
        )
        assert response.status_code == 400


class TestMe:

    def test_me_retorna_dados_do_usuario_logado(self, client_autenticacao_real):
        client_autenticacao_real.post("/auth/criar_usuario", json=_payload_usuario(email="me@teste.com", nome="Ciclano"))

        response = client_autenticacao_real.get("/auth/me")

        assert response.status_code == 200
        corpo = response.json()
        assert corpo["email"] == "me@teste.com"
        assert corpo["nome"] == "Ciclano"
        assert corpo["adm"] is False

    def test_sem_cookie_retorna_401(self, client_autenticacao_real):
        response = client_autenticacao_real.get("/auth/me")
        assert response.status_code == 401


class TestAtualizarMe:

    def test_atualiza_nome_e_email_com_sucesso(self, client_autenticacao_real):
        client_autenticacao_real.post("/auth/criar_usuario", json=_payload_usuario(email="editar@teste.com"))

        response = client_autenticacao_real.put(
            "/auth/me",
            json={"nome": "Nome Editado", "email": "editado@teste.com"},
        )

        assert response.status_code == 200
        assert response.json()["nome"] == "Nome Editado"
        assert response.json()["email"] == "editado@teste.com"

    def test_rejeita_email_ja_usado_por_outra_conta(self, client_autenticacao_real, db_conn):
        db_conn.execute(
            "INSERT INTO usuarios (nome, email, senha) VALUES (%s, %s, %s)",
            ("Outro", "ocupado@teste.com", "hash-fake"),
        )
        client_autenticacao_real.post("/auth/criar_usuario", json=_payload_usuario(email="eu@teste.com"))

        response = client_autenticacao_real.put(
            "/auth/me", json={"nome": "Eu", "email": "ocupado@teste.com"}
        )

        assert response.status_code == 400
        assert "e-mail" in response.json()["detail"].lower()

    def test_rejeita_cpf_invalido(self, client_autenticacao_real):
        client_autenticacao_real.post("/auth/criar_usuario", json=_payload_usuario(email="cpf@teste.com"))

        response = client_autenticacao_real.put(
            "/auth/me",
            json={"nome": "Fulano", "email": "cpf@teste.com", "cpf": "11111111111"},
        )

        assert response.status_code == 422

    def test_rejeita_telefone_invalido(self, client_autenticacao_real):
        client_autenticacao_real.post("/auth/criar_usuario", json=_payload_usuario(email="tel@teste.com"))

        response = client_autenticacao_real.put(
            "/auth/me",
            json={"nome": "Fulano", "email": "tel@teste.com", "telefone": "123"},
        )

        assert response.status_code == 422


class TestRefreshTokenELogout:

    def test_refresh_sem_cookie_retorna_401(self, client_autenticacao_real):
        response = client_autenticacao_real.post("/auth/refresh")
        assert response.status_code == 401

    def test_refresh_com_cookie_valido_gera_novo_token(self, client_autenticacao_real):
        client_autenticacao_real.post("/auth/criar_usuario", json=_payload_usuario(email="refresh@teste.com"))

        response = client_autenticacao_real.post("/auth/refresh")

        assert response.status_code == 200
        assert response.json()["mensagem"] == "Token atualizado com sucesso"
        assert "token" in response.cookies

    def test_logout_limpa_cookies_e_bloqueia_acesso_seguinte(self, client_autenticacao_real):
        client_autenticacao_real.post("/auth/criar_usuario", json=_payload_usuario(email="logout@teste.com"))

        logout = client_autenticacao_real.post("/auth/logout")
        assert logout.status_code == 200
        assert logout.json()["mensagem"] == "Logout realizado com sucesso"

        me = client_autenticacao_real.get("/auth/me")
        assert me.status_code == 401


class TestRateLimit:

    def test_login_bloqueia_apos_5_tentativas_no_minuto(self, client_autenticacao_real):
        payload = {"email": "raterl@teste.com", "senha": "SenhaErrada1"}

        respostas = [client_autenticacao_real.post("/auth/login", json=payload) for _ in range(6)]

        assert respostas[-1].status_code == 429
