"""Testes das rotas de formas de pagamento (formas_pagamento_routes.py)."""


def _payload_forma(**overrides):
    base = {
        "tipo": "CREDITO",
        "bandeira": "Visa",
        "nome_impresso": "FULANO DE TAL",
        "numero": "4111111111111234",
        "validade": "12/30",
        "padrao": False,
    }
    base.update(overrides)
    return base


def _criar_forma(db_conn, usuario_id, tipo="CREDITO", padrao=False, ativo=True):
    return db_conn.execute(
        """
        INSERT INTO formas_pagamento (usuario_id, tipo, bandeira, nome_impresso, final_numero, validade, padrao, ativo)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *
        """,
        (usuario_id, tipo, "Visa", "FULANO DE TAL", "1234", "12/30", padrao, ativo),
    ).fetchone()


class TestCriarFormaPagamento:

    def test_primeira_forma_cadastrada_vira_padrao_automaticamente(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        response = c.post("/formas-pagamento/", json=_payload_forma(padrao=False))

        assert response.status_code == 200
        assert response.json()["forma_pagamento"]["padrao"] is True

    def test_apenas_ultimos_4_digitos_sao_persistidos(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        c.post("/formas-pagamento/", json=_payload_forma(numero="4111111111111234"))

        salvo = db_conn.execute(
            "SELECT final_numero FROM formas_pagamento WHERE usuario_id = %s", (usuario_comum["id"],)
        ).fetchone()
        assert salvo["final_numero"] == "1234"

    def test_segunda_forma_nao_padrao_nao_derruba_a_primeira(self, client_como, usuario_comum, db_conn):
        _criar_forma(db_conn, usuario_comum["id"], padrao=True)
        c = client_como(usuario_comum)

        c.post("/formas-pagamento/", json=_payload_forma(padrao=False))

        padroes = db_conn.execute(
            "SELECT COUNT(*) AS n FROM formas_pagamento WHERE usuario_id = %s AND padrao = true",
            (usuario_comum["id"],),
        ).fetchone()
        assert padroes["n"] == 1

    def test_marcar_nova_como_padrao_tira_padrao_da_antiga(self, client_como, usuario_comum, db_conn):
        antiga = _criar_forma(db_conn, usuario_comum["id"], padrao=True)
        c = client_como(usuario_comum)

        c.post("/formas-pagamento/", json=_payload_forma(padrao=True))

        antiga_atual = db_conn.execute(
            "SELECT padrao FROM formas_pagamento WHERE id = %s", (antiga["id"],)
        ).fetchone()
        assert antiga_atual["padrao"] is False


class TestMinhasFormasPagamento:

    def test_lista_apenas_ativas_do_usuario_logado(self, client_como, usuario_comum, admin_usuario, db_conn):
        _criar_forma(db_conn, usuario_comum["id"], ativo=True)
        _criar_forma(db_conn, usuario_comum["id"], ativo=False)
        _criar_forma(db_conn, admin_usuario["id"], ativo=True)

        c = client_como(usuario_comum)
        response = c.get("/formas-pagamento/minhas")

        assert response.status_code == 200
        assert len(response.json()) == 1


class TestEditarFormaPagamento:

    def test_dono_edita_com_sucesso(self, client_como, usuario_comum, db_conn):
        forma = _criar_forma(db_conn, usuario_comum["id"])
        c = client_como(usuario_comum)

        response = c.put(f"/formas-pagamento/{forma['id']}", json=_payload_forma(nome_impresso="NOVO NOME"))

        assert response.status_code == 200
        assert response.json()["forma_pagamento"]["nome_impresso"] == "NOVO NOME"

    def test_outro_usuario_nao_pode_editar(self, client_como, usuario_comum, admin_usuario, db_conn):
        forma = _criar_forma(db_conn, admin_usuario["id"])
        outro = client_como(usuario_comum)

        response = outro.put(f"/formas-pagamento/{forma['id']}", json=_payload_forma())

        assert response.status_code == 403

    def test_forma_inexistente_retorna_404(self, client_como, usuario_comum):
        c = client_como(usuario_comum)
        response = c.put("/formas-pagamento/99999", json=_payload_forma())
        assert response.status_code == 404


class TestDefinirPadrao:

    def test_define_nova_padrao_e_tira_da_antiga(self, client_como, usuario_comum, db_conn):
        antiga = _criar_forma(db_conn, usuario_comum["id"], padrao=True)
        nova = _criar_forma(db_conn, usuario_comum["id"], padrao=False)
        c = client_como(usuario_comum)

        response = c.patch(f"/formas-pagamento/{nova['id']}/padrao")

        assert response.status_code == 200
        assert db_conn.execute("SELECT padrao FROM formas_pagamento WHERE id = %s", (antiga["id"],)).fetchone()["padrao"] is False
        assert db_conn.execute("SELECT padrao FROM formas_pagamento WHERE id = %s", (nova["id"],)).fetchone()["padrao"] is True

    def test_outro_usuario_nao_pode_definir_padrao(self, client_como, usuario_comum, admin_usuario, db_conn):
        forma = _criar_forma(db_conn, admin_usuario["id"])
        outro = client_como(usuario_comum)

        response = outro.patch(f"/formas-pagamento/{forma['id']}/padrao")

        assert response.status_code == 403

    def test_forma_inexistente_retorna_404(self, client_como, usuario_comum):
        c = client_como(usuario_comum)
        assert c.patch("/formas-pagamento/99999/padrao").status_code == 404


class TestDeletarFormaPagamento:

    def test_remove_forma_nao_padrao(self, client_como, usuario_comum, db_conn):
        forma = _criar_forma(db_conn, usuario_comum["id"], padrao=False)
        c = client_como(usuario_comum)

        response = c.delete(f"/formas-pagamento/{forma['id']}")

        assert response.status_code == 200
        assert db_conn.execute("SELECT * FROM formas_pagamento WHERE id = %s", (forma["id"],)).fetchone() is None

    def test_remover_a_padrao_promove_a_proxima_restante(self, client_como, usuario_comum, db_conn):
        padrao_antiga = _criar_forma(db_conn, usuario_comum["id"], padrao=True)
        restante = _criar_forma(db_conn, usuario_comum["id"], padrao=False)
        c = client_como(usuario_comum)

        c.delete(f"/formas-pagamento/{padrao_antiga['id']}")

        assert db_conn.execute("SELECT padrao FROM formas_pagamento WHERE id = %s", (restante["id"],)).fetchone()["padrao"] is True

    def test_outro_usuario_nao_pode_remover(self, client_como, usuario_comum, admin_usuario, db_conn):
        forma = _criar_forma(db_conn, admin_usuario["id"])
        outro = client_como(usuario_comum)

        response = outro.delete(f"/formas-pagamento/{forma['id']}")

        assert response.status_code == 403

    def test_forma_inexistente_retorna_404(self, client_como, usuario_comum):
        c = client_como(usuario_comum)
        assert c.delete("/formas-pagamento/99999").status_code == 404
