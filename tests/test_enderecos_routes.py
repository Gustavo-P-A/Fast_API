"""Testes das rotas de endereços de entrega (enderecos_routes.py)."""


def _payload_endereco(**overrides):
    base = {
        "rua": "Rua das Flores",
        "numero": "123",
        "complemento": "Apto 4",
        "bairro": "Centro",
        "cidade": "Cianorte",
        "estado": "PR",
        "cep": "87200-000",
    }
    base.update(overrides)
    return base


def _criar_endereco(db_conn, usuario_id, rua="Rua Antiga"):
    return db_conn.execute(
        """
        INSERT INTO enderecos_entrega (rua, cep, complemento, cidade, estado, numero, bairro, usuario_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *
        """,
        (rua, "87200-000", None, "Cianorte", "PR", "10", "Centro", usuario_id),
    ).fetchone()


class TestCriarEndereco:

    def test_cadastra_endereco_para_o_usuario_logado(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        response = c.post("/enderecos/localizacao", json=_payload_endereco())

        assert response.status_code == 200
        assert response.json()["sucesso"] is True
        salvo = db_conn.execute(
            "SELECT * FROM enderecos_entrega WHERE usuario_id = %s", (usuario_comum["id"],)
        ).fetchone()
        assert salvo["rua"] == "Rua das Flores"

    def test_campo_obrigatorio_faltando_retorna_422(self, client_como, usuario_comum):
        c = client_como(usuario_comum)
        payload = _payload_endereco()
        del payload["cep"]
        response = c.post("/enderecos/localizacao", json=payload)
        assert response.status_code == 422


class TestMeusEnderecos:

    def test_lista_apenas_enderecos_do_usuario_logado(self, client_como, usuario_comum, admin_usuario, db_conn):
        _criar_endereco(db_conn, usuario_comum["id"], rua="Minha Rua")
        _criar_endereco(db_conn, admin_usuario["id"], rua="Rua de Outra Pessoa")

        c = client_como(usuario_comum)
        response = c.get("/enderecos/meus-enderecos")

        assert response.status_code == 200
        assert [e["rua"] for e in response.json()] == ["Minha Rua"]


class TestEditarEndereco:

    def test_dono_edita_com_sucesso(self, client_como, usuario_comum, db_conn):
        endereco = _criar_endereco(db_conn, usuario_comum["id"])
        c = client_como(usuario_comum)

        response = c.put(
            f"/enderecos/meus-enderecos/editar/{endereco['id']}",
            json=_payload_endereco(rua="Rua Editada"),
        )

        assert response.status_code == 200
        assert response.json()["endereco"]["rua"] == "Rua Editada"

    def test_outro_usuario_nao_pode_editar(self, client_como, usuario_comum, admin_usuario, db_conn):
        endereco = _criar_endereco(db_conn, admin_usuario["id"])
        outro = client_como(usuario_comum)

        response = outro.put(
            f"/enderecos/meus-enderecos/editar/{endereco['id']}", json=_payload_endereco()
        )

        assert response.status_code == 403

    def test_admin_pode_editar_endereco_de_outro_usuario(self, client_como, usuario_comum, admin_usuario, db_conn):
        endereco = _criar_endereco(db_conn, usuario_comum["id"])
        c = client_como(admin_usuario)

        response = c.put(
            f"/enderecos/meus-enderecos/editar/{endereco['id']}", json=_payload_endereco(rua="Editado pelo admin")
        )

        assert response.status_code == 200

    def test_endereco_inexistente_retorna_404(self, client_como, usuario_comum):
        c = client_como(usuario_comum)
        response = c.put("/enderecos/meus-enderecos/editar/99999", json=_payload_endereco())
        assert response.status_code == 404


class TestDeletarEndereco:

    def test_dono_remove_com_sucesso(self, client_como, usuario_comum, db_conn):
        endereco = _criar_endereco(db_conn, usuario_comum["id"])
        c = client_como(usuario_comum)

        response = c.delete(f"/enderecos/meus-enderecos/deletar/{endereco['id']}")

        assert response.status_code == 200
        assert db_conn.execute("SELECT * FROM enderecos_entrega WHERE id = %s", (endereco["id"],)).fetchone() is None

    def test_outro_usuario_nao_pode_remover(self, client_como, usuario_comum, admin_usuario, db_conn):
        endereco = _criar_endereco(db_conn, admin_usuario["id"])
        outro = client_como(usuario_comum)

        response = outro.delete(f"/enderecos/meus-enderecos/deletar/{endereco['id']}")

        assert response.status_code == 403

    def test_endereco_inexistente_retorna_404(self, client_como, usuario_comum):
        c = client_como(usuario_comum)
        response = c.delete("/enderecos/meus-enderecos/deletar/99999")
        assert response.status_code == 404
