"""
Testes das rotas administrativas gerais (area_admin.py): tamanhos,
adicionais, status de pedido, grade, categoria, clientes e o
agrupamento de produtos por grade usado no admin.
"""


def _criar_tamanho(db_conn, nome="Grande", qtd_sabores=2, qtd_bordas=2):
    return db_conn.execute(
        "INSERT INTO tamanhos (nome, qtd_sabores, qtd_bordas) VALUES (%s, %s, %s) RETURNING *",
        (nome, qtd_sabores, qtd_bordas),
    ).fetchone()


def _criar_categoria(db_conn, nome="Pizzas"):
    return db_conn.execute("INSERT INTO categoria (nome) VALUES (%s) RETURNING *", (nome,)).fetchone()


def _criar_grade(db_conn, nome="Grade 1", posicao=1):
    return db_conn.execute(
        "INSERT INTO grade (nome, posicao) VALUES (%s, %s) RETURNING *", (nome, posicao)
    ).fetchone()


def _criar_sabor(db_conn, nome="Calabresa", categoria_id=None, ativo=True):
    return db_conn.execute(
        "INSERT INTO sabores (nome, categoria_id, ativo) VALUES (%s, %s, %s) RETURNING *",
        (nome, categoria_id, ativo),
    ).fetchone()


def _criar_usuario(db_conn, nome="Cliente", email="cliente@teste.com", adm=False):
    return db_conn.execute(
        "INSERT INTO usuarios (nome, email, senha, adm) VALUES (%s, %s, %s, %s) RETURNING *",
        (nome, email, "hash-fake", adm),
    ).fetchone()


def _criar_pedido(db_conn, usuario_id, status="PENDENTE", preco=50.0):
    return db_conn.execute(
        "INSERT INTO pedidos (usuario_id, status, preco) VALUES (%s, %s, %s) RETURNING *",
        (usuario_id, status, preco),
    ).fetchone()


class TestTamanhos:

    def test_cria_tamanho(self, client, db_conn):
        response = client.post("/admin/tamanhos", json={"nome": "Grande", "qtd_sabores": 2, "qtd_bordas": 2})
        assert response.status_code == 200
        assert db_conn.execute("SELECT COUNT(*) AS n FROM tamanhos").fetchone()["n"] == 1

    def test_edita_tamanho_existente(self, client, db_conn):
        tamanho = _criar_tamanho(db_conn, nome="Média", qtd_sabores=1)
        response = client.put(
            f"/admin/editar/tamanho/{tamanho['id']}",
            json={"nome": "Média Editada", "qtd_sabores": 3, "qtd_bordas": 1},
        )
        assert response.status_code == 200
        atualizado = db_conn.execute("SELECT * FROM tamanhos WHERE id = %s", (tamanho["id"],)).fetchone()
        assert atualizado["nome"] == "Média Editada"
        assert atualizado["qtd_sabores"] == 3

    def test_editar_tamanho_inexistente_retorna_404(self, client):
        response = client.put(
            "/admin/editar/tamanho/99999", json={"nome": "X", "qtd_sabores": 1, "qtd_bordas": 1}
        )
        assert response.status_code == 404

    def test_deleta_tamanho_sem_uso(self, client, db_conn):
        tamanho = _criar_tamanho(db_conn)
        response = client.delete(f"/admin/deletar/tamanho/{tamanho['id']}")
        assert response.status_code == 200
        assert db_conn.execute("SELECT * FROM tamanhos WHERE id = %s", (tamanho["id"],)).fetchone() is None

    def test_deletar_tamanho_inexistente_retorna_404(self, client):
        assert client.delete("/admin/deletar/tamanho/99999").status_code == 404

    def test_deletar_tamanho_em_uso_retorna_409(self, client, db_conn):
        tamanho = _criar_tamanho(db_conn)
        sabor = _criar_sabor(db_conn)
        db_conn.execute(
            "INSERT INTO preco_pizza (sabor_id, tamanho_id, preco) VALUES (%s, %s, %s)",
            (sabor["id"], tamanho["id"], 40.0),
        )
        response = client.delete(f"/admin/deletar/tamanho/{tamanho['id']}")
        assert response.status_code == 409


class TestAdicionais:

    def test_cria_adicional(self, client, db_conn):
        response = client.post("/admin/adicionais", json={"nome": "Borda Catupiry"})
        assert response.status_code == 200
        assert "id" in response.json()

    def test_listar_adicionais_traz_precos_aninhados(self, client, db_conn):
        adicional = db_conn.execute(
            "INSERT INTO adicionais (nome) VALUES (%s) RETURNING *", ("Borda",)
        ).fetchone()
        tamanho = _criar_tamanho(db_conn)
        db_conn.execute(
            "INSERT INTO preco_adicional (adicional_id, tamanho_id, preco) VALUES (%s, %s, %s)",
            (adicional["id"], tamanho["id"], 8.0),
        )
        response = client.get("/admin/listar/adicionais")
        assert response.status_code == 200
        corpo = response.json()[0]
        assert corpo["nome"] == "Borda"
        assert corpo["precos"][0]["preco"] == 8.0

    def test_upsert_preco_adicional_cria_quando_nao_existe(self, client, db_conn):
        adicional = db_conn.execute("INSERT INTO adicionais (nome) VALUES (%s) RETURNING *", ("Borda",)).fetchone()
        tamanho = _criar_tamanho(db_conn)

        response = client.put(
            f"/admin/adicionais/{adicional['id']}/preco/{tamanho['id']}",
            json={"adicional_id": adicional["id"], "tamanho_id": tamanho["id"], "preco": 9.0},
        )

        assert response.status_code == 200
        preco = db_conn.execute(
            "SELECT preco FROM preco_adicional WHERE adicional_id = %s AND tamanho_id = %s",
            (adicional["id"], tamanho["id"]),
        ).fetchone()
        assert preco["preco"] == 9.0

    def test_upsert_preco_adicional_atualiza_quando_ja_existe(self, client, db_conn):
        adicional = db_conn.execute("INSERT INTO adicionais (nome) VALUES (%s) RETURNING *", ("Borda",)).fetchone()
        tamanho = _criar_tamanho(db_conn)
        db_conn.execute(
            "INSERT INTO preco_adicional (adicional_id, tamanho_id, preco) VALUES (%s, %s, %s)",
            (adicional["id"], tamanho["id"], 5.0),
        )

        client.put(
            f"/admin/adicionais/{adicional['id']}/preco/{tamanho['id']}",
            json={"adicional_id": adicional["id"], "tamanho_id": tamanho["id"], "preco": 12.0},
        )

        precos = db_conn.execute(
            "SELECT * FROM preco_adicional WHERE adicional_id = %s AND tamanho_id = %s",
            (adicional["id"], tamanho["id"]),
        ).fetchall()
        assert len(precos) == 1
        assert precos[0]["preco"] == 12.0

    def test_toggle_status_adicional(self, client, db_conn):
        adicional = db_conn.execute("INSERT INTO adicionais (nome) VALUES (%s) RETURNING *", ("Borda",)).fetchone()
        response = client.patch(f"/admin/adicionais/{adicional['id']}/status")
        assert response.status_code == 200
        assert response.json()["ativo"] is False

    def test_toggle_status_adicional_inexistente_retorna_404(self, client):
        assert client.patch("/admin/adicionais/99999/status").status_code == 404

    def test_deletar_adicional_remove_precos_tambem(self, client, db_conn):
        adicional = db_conn.execute("INSERT INTO adicionais (nome) VALUES (%s) RETURNING *", ("Borda",)).fetchone()
        tamanho = _criar_tamanho(db_conn)
        db_conn.execute(
            "INSERT INTO preco_adicional (adicional_id, tamanho_id, preco) VALUES (%s, %s, %s)",
            (adicional["id"], tamanho["id"], 5.0),
        )

        response = client.delete(f"/admin/adicionais/{adicional['id']}")

        assert response.status_code == 200
        assert db_conn.execute("SELECT * FROM adicionais WHERE id = %s", (adicional["id"],)).fetchone() is None
        assert db_conn.execute("SELECT * FROM preco_adicional WHERE adicional_id = %s", (adicional["id"],)).fetchone() is None

    def test_deletar_adicional_inexistente_retorna_404(self, client):
        assert client.delete("/admin/adicionais/99999").status_code == 404


class TestDeletarPreco:

    def test_deleta_preco_existente(self, client, db_conn):
        sabor = _criar_sabor(db_conn)
        tamanho = _criar_tamanho(db_conn)
        preco = db_conn.execute(
            "INSERT INTO preco_pizza (sabor_id, tamanho_id, preco) VALUES (%s, %s, %s) RETURNING *",
            (sabor["id"], tamanho["id"], 40.0),
        ).fetchone()

        response = client.delete(f"/admin/deletar/preco/{preco['id']}")

        assert response.status_code == 200
        assert db_conn.execute("SELECT * FROM preco_pizza WHERE id = %s", (preco["id"],)).fetchone() is None

    def test_deletar_preco_inexistente_retorna_404(self, client):
        assert client.delete("/admin/deletar/preco/99999").status_code == 404


class TestMudaStatusPedido:

    def test_muda_status_com_sucesso(self, client, db_conn):
        usuario = _criar_usuario(db_conn)
        pedido = _criar_pedido(db_conn, usuario["id"], status="CONFIRMADO")

        response = client.put(f"/admin/mudar_status/{pedido['id']}", params={"tipo_status": "EM PREPARO"})

        assert response.status_code == 200
        atualizado = db_conn.execute("SELECT status FROM pedidos WHERE id = %s", (pedido["id"],)).fetchone()
        assert atualizado["status"] == "EM PREPARO"

    def test_pedido_inexistente_retorna_404(self, client):
        response = client.put("/admin/mudar_status/99999", params={"tipo_status": "CONFIRMADO"})
        assert response.status_code == 404

    def test_bloqueia_cancelar_pedido_que_ja_saiu_para_entrega(self, client, db_conn):
        usuario = _criar_usuario(db_conn)
        pedido = _criar_pedido(db_conn, usuario["id"], status="SAIU PARA ENTREGA")

        response = client.put(f"/admin/mudar_status/{pedido['id']}", params={"tipo_status": "CANCELADO"})

        assert response.status_code == 400

    def test_permite_cancelar_pedido_confirmado(self, client, db_conn):
        usuario = _criar_usuario(db_conn)
        pedido = _criar_pedido(db_conn, usuario["id"], status="CONFIRMADO")

        response = client.put(f"/admin/mudar_status/{pedido['id']}", params={"tipo_status": "CANCELADO"})

        assert response.status_code == 200


class TestListarPedidosCliente:

    def test_lista_todos_com_dados_do_cliente(self, client, db_conn):
        usuario = _criar_usuario(db_conn, nome="João")
        _criar_pedido(db_conn, usuario["id"], status="CONFIRMADO")

        response = client.get("/admin/listar/pedidos-cliente")

        assert response.status_code == 200
        assert response.json()[0]["cliente_nome"] == "João"

    def test_filtra_por_status(self, client, db_conn):
        usuario = _criar_usuario(db_conn)
        _criar_pedido(db_conn, usuario["id"], status="CONFIRMADO")
        _criar_pedido(db_conn, usuario["id"], status="ENTREGUE")

        response = client.get("/admin/listar/pedidos-cliente", params={"status": "entregue"})

        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["status"] == "ENTREGUE"


class TestGrade:

    def test_cria_grade(self, client, db_conn):
        response = client.post("/admin/grade", json={"nome": "Grade Padrão", "posicao": 1})
        assert response.status_code == 200
        assert db_conn.execute("SELECT COUNT(*) AS n FROM grade").fetchone()["n"] == 1

    def test_listar_grade(self, client, db_conn):
        _criar_grade(db_conn, nome="G1")
        response = client.get("/admin/listar/grade")
        assert response.status_code == 200
        assert response.json()[0]["nome"] == "G1"

    def test_editar_grade(self, client, db_conn):
        grade = _criar_grade(db_conn)
        response = client.put(f"/admin/grade/{grade['id']}", json={"nome": "Editada", "posicao": 2})
        assert response.status_code == 200
        assert db_conn.execute("SELECT nome FROM grade WHERE id = %s", (grade["id"],)).fetchone()["nome"] == "Editada"

    def test_editar_grade_inexistente_retorna_404(self, client):
        assert client.put("/admin/grade/99999", json={"nome": "X", "posicao": 1}).status_code == 404

    def test_deletar_grade_sem_uso(self, client, db_conn):
        grade = _criar_grade(db_conn)
        response = client.delete(f"/admin/deletar/grade/{grade['id']}")
        assert response.status_code == 200

    def test_deletar_grade_inexistente_retorna_404(self, client):
        assert client.delete("/admin/deletar/grade/99999").status_code == 404

    def test_deletar_grade_em_uso_por_sabor_retorna_400(self, client, db_conn):
        grade = _criar_grade(db_conn)
        sabor = _criar_sabor(db_conn)
        db_conn.execute(
            "INSERT INTO grade_sabores (grade_id, sabores_id) VALUES (%s, %s)", (grade["id"], sabor["id"])
        )
        response = client.delete(f"/admin/deletar/grade/{grade['id']}")
        assert response.status_code == 400

    def test_deletar_grade_em_uso_por_item_simples_retorna_400(self, client, db_conn):
        """grade_id de itens_simples não é checado explicitamente no código --
        cai no except ForeignKeyViolation, e mesmo assim deve responder 400."""
        grade = _criar_grade(db_conn)
        db_conn.execute(
            "INSERT INTO itens_simples (tipo, nome, preco, grade_id) VALUES (%s, %s, %s, %s)",
            ("BEBIDA", "Coca-Cola", 8.0, grade["id"]),
        )
        response = client.delete(f"/admin/deletar/grade/{grade['id']}")
        assert response.status_code == 400

    def test_cria_vinculo_grade_sabores(self, client, db_conn):
        grade = _criar_grade(db_conn)
        sabor = _criar_sabor(db_conn)
        response = client.post("/admin/grade_sabores", json={"id_grade": grade["id"], "id_sabores": sabor["id"]})
        assert response.status_code == 200
        assert db_conn.execute("SELECT COUNT(*) AS n FROM grade_sabores").fetchone()["n"] == 1


class TestCategoria:

    def test_cria_categoria(self, client, db_conn):
        response = client.post("/admin/categoria", json={"nome": "Pizzas Salgadas"})
        assert response.status_code == 200
        assert db_conn.execute("SELECT COUNT(*) AS n FROM categoria").fetchone()["n"] == 1

    def test_listar_categoria(self, client, db_conn):
        _criar_categoria(db_conn, nome="Sobremesas")
        response = client.get("/admin/listar/categoria")
        assert response.json()[0]["nome"] == "Sobremesas"

    def test_editar_categoria(self, client, db_conn):
        categoria = _criar_categoria(db_conn)
        response = client.put(f"/admin/categoria/{categoria['id']}", json={"nome": "Editada"})
        assert response.status_code == 200

    def test_editar_categoria_inexistente_retorna_404(self, client):
        assert client.put("/admin/categoria/99999", json={"nome": "X"}).status_code == 404

    def test_deletar_categoria_sem_uso(self, client, db_conn):
        categoria = _criar_categoria(db_conn)
        assert client.delete(f"/admin/categoria/{categoria['id']}").status_code == 200

    def test_deletar_categoria_inexistente_retorna_404(self, client):
        assert client.delete("/admin/categoria/99999").status_code == 404

    def test_deletar_categoria_em_uso_por_sabor_retorna_400(self, client, db_conn):
        categoria = _criar_categoria(db_conn)
        _criar_sabor(db_conn, categoria_id=categoria["id"])
        response = client.delete(f"/admin/categoria/{categoria['id']}")
        assert response.status_code == 400

    def test_deletar_categoria_em_uso_por_item_simples_retorna_400(self, client, db_conn):
        categoria = _criar_categoria(db_conn)
        db_conn.execute(
            "INSERT INTO itens_simples (tipo, nome, preco, categoria_id) VALUES (%s, %s, %s, %s)",
            ("INGREDIENTE", "Cebola", 2.0, categoria["id"]),
        )
        response = client.delete(f"/admin/categoria/{categoria['id']}")
        assert response.status_code == 400


class TestListarTamanho:

    def test_lista_tamanhos_cadastrados(self, client, db_conn):
        _criar_tamanho(db_conn, nome="Broto")
        response = client.get("/admin/listar/tamanho")
        assert response.status_code == 200
        assert response.json()[0]["nome"] == "Broto"


class TestClientes:

    def test_lista_apenas_clientes_com_pedidos_e_soma_gasto(self, client, db_conn):
        cliente = _criar_usuario(db_conn, nome="Maria", email="maria@teste.com")
        _criar_pedido(db_conn, cliente["id"], preco=30.0)
        _criar_pedido(db_conn, cliente["id"], preco=20.0)
        _criar_usuario(db_conn, nome="Sem Pedido", email="sempedido@teste.com")

        response = client.get("/admin/clientes")

        assert response.status_code == 200
        corpo = response.json()
        assert len(corpo) == 1
        assert corpo[0]["nome"] == "Maria"
        assert corpo[0]["total_pedidos"] == 2
        assert corpo[0]["gasto_total"] == 50.0

    def test_admin_nao_aparece_na_lista_de_clientes(self, client, db_conn, admin_usuario):
        _criar_pedido(db_conn, admin_usuario["id"], preco=10.0)
        response = client.get("/admin/clientes")
        nomes = [c["nome"] for c in response.json()]
        assert admin_usuario["nome"] not in nomes


class TestPedidosDoCliente:

    def test_lista_pedidos_de_um_cliente(self, client, db_conn):
        cliente = _criar_usuario(db_conn)
        _criar_pedido(db_conn, cliente["id"])

        response = client.get(f"/admin/clientes/{cliente['id']}/pedidos")

        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_cliente_inexistente_retorna_404(self, client):
        assert client.get("/admin/clientes/99999/pedidos").status_code == 404

    def test_admin_nao_e_tratado_como_cliente_retorna_404(self, client, admin_usuario):
        response = client.get(f"/admin/clientes/{admin_usuario['id']}/pedidos")
        assert response.status_code == 404


class TestMoverProdutosGrade:

    def test_move_sabores_novos_e_ja_vinculados(self, client, db_conn):
        grade_origem = _criar_grade(db_conn, nome="Origem", posicao=1)
        grade_destino = _criar_grade(db_conn, nome="Destino", posicao=2)
        ja_vinculado = _criar_sabor(db_conn, "Calabresa")
        novo = _criar_sabor(db_conn, "Marguerita")
        db_conn.execute(
            "INSERT INTO grade_sabores (grade_id, sabores_id) VALUES (%s, %s)",
            (grade_origem["id"], ja_vinculado["id"]),
        )

        response = client.patch(
            "/admin/produtos/mover-grade",
            json={"sabor_ids": [ja_vinculado["id"], novo["id"]], "grade_id": grade_destino["id"]},
        )

        assert response.status_code == 200
        vinculos = db_conn.execute("SELECT * FROM grade_sabores WHERE sabores_id = ANY(%s)", ([ja_vinculado["id"], novo["id"]],)).fetchall()
        assert all(v["grade_id"] == grade_destino["id"] for v in vinculos)

    def test_move_monte_pizza_e_item_simples(self, client, db_conn):
        categoria = _criar_categoria(db_conn)
        grade_origem = _criar_grade(db_conn, nome="Origem", posicao=1)
        grade_destino = _criar_grade(db_conn, nome="Destino", posicao=2)
        tamanho = _criar_tamanho(db_conn)
        mp = db_conn.execute(
            "INSERT INTO produto_monte_pizza (nome, tamanho_id, grade_id) VALUES (%s,%s,%s) RETURNING *",
            ("MSP", tamanho["id"], grade_origem["id"]),
        ).fetchone()
        item = db_conn.execute(
            "INSERT INTO itens_simples (tipo, nome, preco, grade_id) VALUES (%s,%s,%s,%s) RETURNING *",
            ("BEBIDA", "Coca-Cola", 8.0, grade_origem["id"]),
        ).fetchone()

        response = client.patch(
            "/admin/produtos/mover-grade",
            json={"monte_pizza_ids": [mp["id"]], "item_simples_ids": [item["id"]], "grade_id": grade_destino["id"]},
        )

        assert response.status_code == 200
        assert db_conn.execute("SELECT grade_id FROM produto_monte_pizza WHERE id = %s", (mp["id"],)).fetchone()["grade_id"] == grade_destino["id"]
        assert db_conn.execute("SELECT grade_id FROM itens_simples WHERE id = %s", (item["id"],)).fetchone()["grade_id"] == grade_destino["id"]

    def test_sem_produtos_e_sem_grade_retorna_400(self, client):
        response = client.patch("/admin/produtos/mover-grade", json={})
        assert response.status_code == 400

    def test_grade_inexistente_retorna_404(self, client, db_conn):
        sabor = _criar_sabor(db_conn)
        response = client.patch(
            "/admin/produtos/mover-grade", json={"sabor_ids": [sabor["id"]], "grade_id": 99999}
        )
        assert response.status_code == 404


class TestProdutosPorGrade:

    def test_agrupa_produtos_e_inclui_grades_vazias(self, client, db_conn):
        grade_com_sabor = _criar_grade(db_conn, "Com Sabor", posicao=1)
        grade_vazia = _criar_grade(db_conn, "Vazia", posicao=2)
        sabor = _criar_sabor(db_conn, "Calabresa")
        db_conn.execute(
            "INSERT INTO grade_sabores (grade_id, sabores_id) VALUES (%s, %s)",
            (grade_com_sabor["id"], sabor["id"]),
        )

        response = client.get("/admin/listar/produtos-por-grade")

        assert response.status_code == 200
        corpo = {g["grade_nome"]: g for g in response.json()}
        assert len(corpo["Com Sabor"]["produtos"]) == 1
        # diferente de /cardapio/grades, aqui grades vazias continuam na resposta
        assert corpo["Vazia"]["produtos"] == []


class TestAutorizacao:

    def test_bloqueia_quem_nao_e_admin(self, client_como, usuario_comum):
        c = client_como(usuario_comum)
        response = c.get("/admin/listar/tamanho")
        assert response.status_code in (401, 403)
