"""Testes das rotas admin de itens simples (bebidas/ingredientes) -- item_simples_routes.py."""


def _payload_item(**overrides):
    base = {
        "tipo": "BEBIDA",
        "nome": "Coca-Cola Lata",
        "categoria_id": None,
        "grade_id": None,
        "preco": 8.0,
        "descricao": "350ml",
        "ativo": True,
        "imagem_url": None,
    }
    base.update(overrides)
    return base


def _criar_item(db_conn, tipo="BEBIDA", nome="Coca-Cola", ativo=True, imagem_url=None):
    return db_conn.execute(
        "INSERT INTO itens_simples (tipo, nome, preco, ativo, imagem_url) VALUES (%s, %s, %s, %s, %s) RETURNING *",
        (tipo, nome, 8.0, ativo, imagem_url),
    ).fetchone()


class TestCriarItemSimples:

    def test_cria_com_sucesso(self, client, db_conn):
        response = client.post("/admin/item-simples", json=_payload_item())

        assert response.status_code == 200
        assert "id" in response.json()
        assert db_conn.execute("SELECT COUNT(*) AS n FROM itens_simples").fetchone()["n"] == 1

    def test_rejeita_tipo_invalido(self, client):
        response = client.post("/admin/item-simples", json=_payload_item(tipo="SOBREMESA"))
        assert response.status_code == 422


class TestBuscarItemSimples:

    def test_busca_e_resolve_imagem_relativa(self, client, db_conn):
        item = _criar_item(db_conn, imagem_url="/uploads/coca.png")

        response = client.get(f"/admin/item-simples/{item['id']}")

        assert response.status_code == 200
        assert response.json()["imagem_url"].endswith("/uploads/coca.png")
        assert response.json()["imagem_url"].startswith("http")

    def test_mantem_url_absoluta_de_imagem(self, client, db_conn):
        item = _criar_item(db_conn, imagem_url="https://cdn.exemplo.com/coca.png")

        response = client.get(f"/admin/item-simples/{item['id']}")

        assert response.json()["imagem_url"] == "https://cdn.exemplo.com/coca.png"

    def test_item_inexistente_retorna_404(self, client):
        assert client.get("/admin/item-simples/99999").status_code == 404


class TestEditarItemSimples:

    def test_edita_com_sucesso(self, client, db_conn):
        item = _criar_item(db_conn)

        response = client.put(f"/admin/item-simples/{item['id']}", json=_payload_item(nome="Coca-Cola 2L"))

        assert response.status_code == 200
        assert db_conn.execute("SELECT nome FROM itens_simples WHERE id = %s", (item["id"],)).fetchone()["nome"] == "Coca-Cola 2L"

    def test_mantem_imagem_antiga_quando_nao_envia_nova(self, client, db_conn):
        item = _criar_item(db_conn, imagem_url="/uploads/antiga.png")

        client.put(f"/admin/item-simples/{item['id']}", json=_payload_item(imagem_url=None))

        atualizado = db_conn.execute("SELECT imagem_url FROM itens_simples WHERE id = %s", (item["id"],)).fetchone()
        assert atualizado["imagem_url"] == "/uploads/antiga.png"

    def test_troca_imagem_quando_envia_nova(self, client, db_conn):
        item = _criar_item(db_conn, imagem_url="/uploads/antiga.png")

        client.put(f"/admin/item-simples/{item['id']}", json=_payload_item(imagem_url="/uploads/nova.png"))

        atualizado = db_conn.execute("SELECT imagem_url FROM itens_simples WHERE id = %s", (item["id"],)).fetchone()
        assert atualizado["imagem_url"] == "/uploads/nova.png"

    def test_item_inexistente_retorna_404(self, client):
        response = client.put("/admin/item-simples/99999", json=_payload_item())
        assert response.status_code == 404


class TestListarItemSimples:

    def test_filtra_por_tipo(self, client, db_conn):
        _criar_item(db_conn, tipo="BEBIDA", nome="Coca-Cola")
        _criar_item(db_conn, tipo="INGREDIENTE", nome="Cebola")

        response = client.get("/admin/listar/item-simples", params={"tipo": "BEBIDA"})

        assert response.status_code == 200
        assert [i["nome"] for i in response.json()] == ["Coca-Cola"]

    def test_tipo_desconhecido_retorna_lista_vazia_em_vez_de_erro(self, client, db_conn):
        _criar_item(db_conn, tipo="BEBIDA")

        response = client.get("/admin/listar/item-simples", params={"tipo": "SOBREMESA"})

        assert response.status_code == 200
        assert response.json() == []


class TestToggleStatusItemSimples:

    def test_alterna_status(self, client, db_conn):
        item = _criar_item(db_conn, ativo=True)

        response = client.patch(f"/admin/item-simples/{item['id']}/status")

        assert response.status_code == 200
        assert response.json()["ativo"] is False

    def test_item_inexistente_retorna_404(self, client):
        assert client.patch("/admin/item-simples/99999/status").status_code == 404


class TestDeletarItemSimples:

    def test_deleta_com_sucesso(self, client, db_conn):
        item = _criar_item(db_conn)

        response = client.delete(f"/admin/item-simples/{item['id']}")

        assert response.status_code == 200
        assert db_conn.execute("SELECT * FROM itens_simples WHERE id = %s", (item["id"],)).fetchone() is None

    def test_item_inexistente_retorna_404(self, client):
        assert client.delete("/admin/item-simples/99999").status_code == 404

    def test_item_usado_em_pedido_retorna_409(self, client, db_conn):
        item = _criar_item(db_conn, tipo="BEBIDA")
        usuario = db_conn.execute(
            "INSERT INTO usuarios (nome, email, senha) VALUES (%s, %s, %s) RETURNING *",
            ("Cliente", "cliente_item@teste.com", "hash-fake"),
        ).fetchone()
        pedido = db_conn.execute(
            "INSERT INTO pedidos (usuario_id, status, preco) VALUES (%s, %s, %s) RETURNING *",
            (usuario["id"], "PENDENTE", 8.0),
        ).fetchone()
        db_conn.execute(
            "INSERT INTO item_pedido_bebida (pedido_id, item_simples_id, quantidade) VALUES (%s, %s, %s)",
            (pedido["id"], item["id"], 1),
        )

        response = client.delete(f"/admin/item-simples/{item['id']}")

        assert response.status_code == 409


class TestAutorizacao:

    def test_bloqueia_quem_nao_e_admin(self, client_como, usuario_comum):
        c = client_como(usuario_comum)
        response = c.get("/admin/listar/item-simples", params={"tipo": "BEBIDA"})
        assert response.status_code in (401, 403)
