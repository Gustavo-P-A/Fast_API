"""
Testes complementares de produto_routes.py -- cobre o que
test_produto_routes.py ainda não cobria: upload de imagem, editar,
toggle de status, listar (um e todos) e deletar sabor.
"""
import io


def _criar_categoria_grade_tamanho(db_conn):
    categoria = db_conn.execute(
        "INSERT INTO categoria (nome) VALUES (%s) RETURNING *", ("Pizzas Salgadas",)
    ).fetchone()
    grade = db_conn.execute(
        "INSERT INTO grade (nome, posicao) VALUES (%s, %s) RETURNING *", ("Grade Padrão", 1)
    ).fetchone()
    tamanho = db_conn.execute(
        "INSERT INTO tamanhos (nome, qtd_sabores, qtd_bordas) VALUES (%s, %s, %s) RETURNING *",
        ("Grande", 1, 2),
    ).fetchone()
    return categoria, grade, tamanho


def _criar_sabor_com_grade(db_conn, categoria_id, grade_id, nome="Calabresa", imagem_url=None):
    sabor = db_conn.execute(
        "INSERT INTO sabores (nome, descricao, categoria_id, imagem_url) VALUES (%s, %s, %s, %s) RETURNING *",
        (nome, "desc", categoria_id, imagem_url),
    ).fetchone()
    db_conn.execute(
        "INSERT INTO grade_sabores (grade_id, sabores_id) VALUES (%s, %s)", (grade_id, sabor["id"])
    )
    return sabor


def _payload_produto(grade_id, categoria_id, tamanho_id, **overrides):
    base = {
        "nome": "Pizza Calabresa",
        "descricao": "Molho, calabresa e cebola",
        "ativo": True,
        "grade_id": grade_id,
        "categoria_id": categoria_id,
        "precos": [{"tamanho_id": tamanho_id, "preco": 45.90}],
    }
    base.update(overrides)
    return base


class TestUploadImagem:

    def test_aceita_png_dentro_do_limite(self, client, tmp_path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        arquivo = io.BytesIO(b"conteudo-fake-de-imagem")

        response = client.post(
            "/admin/upload-imagem", files={"file": ("foto.png", arquivo, "image/png")}
        )

        assert response.status_code == 200
        assert response.json()["url"].endswith(".png")

    def test_rejeita_tipo_nao_permitido(self, client, tmp_path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        arquivo = io.BytesIO(b"conteudo")

        response = client.post(
            "/admin/upload-imagem", files={"file": ("foto.gif", arquivo, "image/gif")}
        )

        assert response.status_code == 400

    def test_rejeita_arquivo_maior_que_2mb(self, client, tmp_path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        conteudo_grande = b"x" * (2 * 1024 * 1024 + 1)
        arquivo = io.BytesIO(conteudo_grande)

        response = client.post(
            "/admin/upload-imagem", files={"file": ("foto.png", arquivo, "image/png")}
        )

        assert response.status_code == 400


class TestEditarNovoProduto:

    def test_edita_campos_e_precos(self, client, db_conn):
        categoria, grade, tamanho = _criar_categoria_grade_tamanho(db_conn)
        sabor = _criar_sabor_com_grade(db_conn, categoria["id"], grade["id"])
        db_conn.execute(
            "INSERT INTO preco_pizza (sabor_id, tamanho_id, preco) VALUES (%s, %s, %s)",
            (sabor["id"], tamanho["id"], 40.0),
        )

        response = client.put(
            f"/admin/editar/novo-produto/{sabor['id']}",
            json=_payload_produto(grade["id"], categoria["id"], tamanho["id"], nome="Calabresa Editada", precos=[{"tamanho_id": tamanho["id"], "preco": 55.0}]),
        )

        assert response.status_code == 200
        assert db_conn.execute("SELECT nome FROM sabores WHERE id = %s", (sabor["id"],)).fetchone()["nome"] == "Calabresa Editada"
        assert db_conn.execute("SELECT preco FROM preco_pizza WHERE sabor_id = %s", (sabor["id"],)).fetchone()["preco"] == 55.0

    def test_adiciona_preco_novo_para_tamanho_sem_preco_ainda(self, client, db_conn):
        categoria, grade, tamanho = _criar_categoria_grade_tamanho(db_conn)
        sabor = _criar_sabor_com_grade(db_conn, categoria["id"], grade["id"])
        outro_tamanho = db_conn.execute(
            "INSERT INTO tamanhos (nome, qtd_sabores, qtd_bordas) VALUES (%s, %s, %s) RETURNING *",
            ("Pequena", 1, 1),
        ).fetchone()

        client.put(
            f"/admin/editar/novo-produto/{sabor['id']}",
            json=_payload_produto(grade["id"], categoria["id"], tamanho["id"], precos=[{"tamanho_id": outro_tamanho["id"], "preco": 25.0}]),
        )

        preco = db_conn.execute(
            "SELECT preco FROM preco_pizza WHERE sabor_id = %s AND tamanho_id = %s", (sabor["id"], outro_tamanho["id"])
        ).fetchone()
        assert preco["preco"] == 25.0

    def test_mantem_imagem_quando_nao_envia_nova(self, client, db_conn):
        categoria, grade, tamanho = _criar_categoria_grade_tamanho(db_conn)
        sabor = _criar_sabor_com_grade(db_conn, categoria["id"], grade["id"], imagem_url="/uploads/antiga.png")

        client.put(
            f"/admin/editar/novo-produto/{sabor['id']}",
            json=_payload_produto(grade["id"], categoria["id"], tamanho["id"], precos=[]),
        )

        assert db_conn.execute("SELECT imagem_url FROM sabores WHERE id = %s", (sabor["id"],)).fetchone()["imagem_url"] == "/uploads/antiga.png"

    def test_produto_inexistente_retorna_404(self, client, db_conn):
        categoria, grade, tamanho = _criar_categoria_grade_tamanho(db_conn)
        response = client.put(
            "/admin/editar/novo-produto/99999",
            json=_payload_produto(grade["id"], categoria["id"], tamanho["id"]),
        )
        assert response.status_code == 404

    def test_sabor_sem_grade_vinculada_retorna_404(self, client, db_conn):
        categoria, grade, tamanho = _criar_categoria_grade_tamanho(db_conn)
        sabor = db_conn.execute(
            "INSERT INTO sabores (nome, categoria_id) VALUES (%s, %s) RETURNING *", ("Órfão", categoria["id"])
        ).fetchone()

        response = client.put(
            f"/admin/editar/novo-produto/{sabor['id']}",
            json=_payload_produto(grade["id"], categoria["id"], tamanho["id"]),
        )

        assert response.status_code == 404


class TestToggleStatus:

    def test_alterna_status_do_produto(self, client, db_conn):
        categoria, grade, tamanho = _criar_categoria_grade_tamanho(db_conn)
        sabor = _criar_sabor_com_grade(db_conn, categoria["id"], grade["id"])
        db_conn.execute("UPDATE sabores SET ativo = true WHERE id = %s", (sabor["id"],))

        response = client.patch(f"/admin/produto/{sabor['id']}/status")

        assert response.status_code == 200
        assert response.json()["ativo"] is False

    def test_produto_inexistente_retorna_404(self, client):
        assert client.patch("/admin/produto/99999/status").status_code == 404


class TestListarProduto:

    def test_lista_um_produto_com_precos_e_grade(self, client, db_conn):
        categoria, grade, tamanho = _criar_categoria_grade_tamanho(db_conn)
        sabor = _criar_sabor_com_grade(db_conn, categoria["id"], grade["id"])
        db_conn.execute(
            "INSERT INTO preco_pizza (sabor_id, tamanho_id, preco) VALUES (%s, %s, %s)",
            (sabor["id"], tamanho["id"], 40.0),
        )

        response = client.get(f"/admin/listar/novo-produto/{sabor['id']}")

        assert response.status_code == 200
        corpo = response.json()
        assert corpo["grade_id"] == grade["id"]
        assert corpo["precos"][0]["preco"] == 40.0

    def test_produto_inexistente_retorna_404(self, client):
        assert client.get("/admin/listar/novo-produto/99999").status_code == 404

    def test_sabor_sem_grade_retorna_404(self, client, db_conn):
        categoria, grade, tamanho = _criar_categoria_grade_tamanho(db_conn)
        sabor = db_conn.execute(
            "INSERT INTO sabores (nome, categoria_id) VALUES (%s, %s) RETURNING *", ("Órfão", categoria["id"])
        ).fetchone()

        assert client.get(f"/admin/listar/novo-produto/{sabor['id']}").status_code == 404


class TestListarTodosProdutos:

    def test_lista_todos_e_resolve_imagem_relativa(self, client, db_conn):
        categoria, grade, tamanho = _criar_categoria_grade_tamanho(db_conn)
        _criar_sabor_com_grade(db_conn, categoria["id"], grade["id"], imagem_url="/uploads/foto.png")

        response = client.get("/admin/listar/todos-produtos")

        assert response.status_code == 200
        assert response.json()[0]["imagem_url"].startswith("http")
        assert response.json()[0]["imagem_url"].endswith("/uploads/foto.png")


class TestDeletarSabor:

    def test_deleta_com_sucesso_e_limpa_precos_e_grade(self, client, db_conn):
        categoria, grade, tamanho = _criar_categoria_grade_tamanho(db_conn)
        sabor = _criar_sabor_com_grade(db_conn, categoria["id"], grade["id"])
        db_conn.execute(
            "INSERT INTO preco_pizza (sabor_id, tamanho_id, preco) VALUES (%s, %s, %s)",
            (sabor["id"], tamanho["id"], 40.0),
        )

        response = client.delete(f"/admin/deletar/sabor/{sabor['id']}")

        assert response.status_code == 200
        assert db_conn.execute("SELECT * FROM sabores WHERE id = %s", (sabor["id"],)).fetchone() is None
        assert db_conn.execute("SELECT * FROM preco_pizza WHERE sabor_id = %s", (sabor["id"],)).fetchone() is None
        assert db_conn.execute("SELECT * FROM grade_sabores WHERE sabores_id = %s", (sabor["id"],)).fetchone() is None

    def test_sabor_inexistente_retorna_404(self, client):
        assert client.delete("/admin/deletar/sabor/99999").status_code == 404

    def test_sabor_usado_em_pedido_retorna_409(self, client, db_conn):
        categoria, grade, tamanho = _criar_categoria_grade_tamanho(db_conn)
        sabor = _criar_sabor_com_grade(db_conn, categoria["id"], grade["id"])
        usuario = db_conn.execute(
            "INSERT INTO usuarios (nome, email, senha) VALUES (%s, %s, %s) RETURNING *",
            ("Cliente", "cliente_sabor@teste.com", "hash-fake"),
        ).fetchone()
        pedido = db_conn.execute(
            "INSERT INTO pedidos (usuario_id, status, preco) VALUES (%s, %s, %s) RETURNING *",
            (usuario["id"], "PENDENTE", 40.0),
        ).fetchone()
        item = db_conn.execute(
            "INSERT INTO itens_pedido (pedido_id, tamanho_id, quantidade) VALUES (%s, %s, %s) RETURNING *",
            (pedido["id"], tamanho["id"], 1),
        ).fetchone()
        db_conn.execute(
            "INSERT INTO item_pedido_sabor (item_pedido_id, sabor_id) VALUES (%s, %s)",
            (item["id"], sabor["id"]),
        )

        response = client.delete(f"/admin/deletar/sabor/{sabor['id']}")

        assert response.status_code == 409
