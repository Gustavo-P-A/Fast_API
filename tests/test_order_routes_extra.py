"""
Testes complementares de order_routes.py -- cobre o que
test_order_routes.py ainda não cobria: ingredientes, bebidas,
adicionais/borda (com rateio de partes), finalizar pedido,
visualizar/listar pedidos e marcar como entregue.
"""


def _criar_produto_pronto(db_conn, qtd_bordas=2, preco=40.0, permite_borda=True, permite_ingrediente=True):
    categoria = db_conn.execute(
        "INSERT INTO categoria (nome) VALUES (%s) RETURNING *", ("Pizzas Salgadas",)
    ).fetchone()
    tamanho = db_conn.execute(
        "INSERT INTO tamanhos (nome, qtd_sabores, qtd_bordas) VALUES (%s, %s, %s) RETURNING *",
        ("Grande", 1, qtd_bordas),
    ).fetchone()
    sabor = db_conn.execute(
        "INSERT INTO sabores (nome, categoria_id, ativo, permite_borda, permite_ingrediente) VALUES (%s, %s, %s, %s, %s) RETURNING *",
        ("Calabresa", categoria["id"], True, permite_borda, permite_ingrediente),
    ).fetchone()
    db_conn.execute(
        "INSERT INTO preco_pizza (sabor_id, tamanho_id, preco) VALUES (%s, %s, %s)",
        (sabor["id"], tamanho["id"], preco),
    )
    return sabor, tamanho


def _criar_pedido_com_item(db_conn, c, preco=40.0, qtd_bordas=2, permite_borda=True, permite_ingrediente=True):
    sabor, tamanho = _criar_produto_pronto(
        db_conn, qtd_bordas=qtd_bordas, preco=preco, permite_borda=permite_borda, permite_ingrediente=permite_ingrediente
    )
    pedido_id = c.post("/order/pedido").json()["id"]
    payload = {"tamanho_id": tamanho["id"], "sabor_ids": [sabor["id"]], "quantidade": 1}
    item_id = c.post(f"/order/pedidos/adicionar-item/{pedido_id}", json=payload).json()["item_id"]
    return pedido_id, item_id, tamanho


def _criar_ingrediente(db_conn, preco=6.0):
    return db_conn.execute(
        "INSERT INTO itens_simples (tipo, nome, preco, ativo) VALUES (%s, %s, %s, %s) RETURNING *",
        ("INGREDIENTE", "Bacon Extra", preco, True),
    ).fetchone()


def _criar_bebida(db_conn, preco=8.0):
    return db_conn.execute(
        "INSERT INTO itens_simples (tipo, nome, preco, ativo) VALUES (%s, %s, %s, %s) RETURNING *",
        ("BEBIDA", "Coca-Cola", preco, True),
    ).fetchone()


def _criar_adicional_com_preco(db_conn, tamanho_id, preco=10.0, nome="Catupiry"):
    adicional = db_conn.execute("INSERT INTO adicionais (nome) VALUES (%s) RETURNING *", (nome,)).fetchone()
    db_conn.execute(
        "INSERT INTO preco_adicional (adicional_id, tamanho_id, preco) VALUES (%s, %s, %s)",
        (adicional["id"], tamanho_id, preco),
    )
    return adicional


class TestIngredientes:

    def test_adiciona_ingrediente_e_recalcula_preco(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, item_id, _ = _criar_pedido_com_item(db_conn, c, preco=40.0)
        ingrediente = _criar_ingrediente(db_conn, preco=6.0)

        response = c.post(
            "/order/ingredientes",
            params={"id_pedido": pedido_id, "id_item_pedido": item_id, "id_item_simples": ingrediente["id"], "quantidade": 2},
        )

        assert response.status_code == 200
        assert response.json()["preco_pedido"] == 52.0  # 40 + 6*2

    def test_adicionar_duas_vezes_soma_quantidade_em_vez_de_duplicar(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, item_id, _ = _criar_pedido_com_item(db_conn, c, preco=40.0)
        ingrediente = _criar_ingrediente(db_conn, preco=6.0)

        c.post("/order/ingredientes", params={"id_pedido": pedido_id, "id_item_pedido": item_id, "id_item_simples": ingrediente["id"]})
        c.post("/order/ingredientes", params={"id_pedido": pedido_id, "id_item_pedido": item_id, "id_item_simples": ingrediente["id"]})

        vinculos = db_conn.execute(
            "SELECT * FROM item_pedido_ingrediente WHERE item_pedido_id = %s", (item_id,)
        ).fetchall()
        assert len(vinculos) == 1
        assert vinculos[0]["quantidade"] == 2

    def test_sabor_que_nao_permite_ingrediente_bloqueia(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, item_id, _ = _criar_pedido_com_item(db_conn, c, permite_ingrediente=False)
        ingrediente = _criar_ingrediente(db_conn)

        response = c.post(
            "/order/ingredientes",
            params={"id_pedido": pedido_id, "id_item_pedido": item_id, "id_item_simples": ingrediente["id"]},
        )

        assert response.status_code == 400

    def test_quantidade_menor_que_1_rejeitada(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, item_id, _ = _criar_pedido_com_item(db_conn, c)
        ingrediente = _criar_ingrediente(db_conn)

        response = c.post(
            "/order/ingredientes",
            params={"id_pedido": pedido_id, "id_item_pedido": item_id, "id_item_simples": ingrediente["id"], "quantidade": 0},
        )

        assert response.status_code == 400

    def test_remove_ingrediente_e_recalcula(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, item_id, _ = _criar_pedido_com_item(db_conn, c, preco=40.0)
        ingrediente = _criar_ingrediente(db_conn, preco=6.0)
        c.post("/order/ingredientes", params={"id_pedido": pedido_id, "id_item_pedido": item_id, "id_item_simples": ingrediente["id"]})

        response = c.delete(f"/order/ingredientes/{item_id}/{ingrediente['id']}")

        assert response.status_code == 200
        assert response.json()["preco_pedido"] == 40.0

    def test_remover_ingrediente_inexistente_retorna_404(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, item_id, _ = _criar_pedido_com_item(db_conn, c)

        response = c.delete(f"/order/ingredientes/{item_id}/99999")

        assert response.status_code == 404


class TestBebidas:

    def test_adiciona_bebida_e_recalcula_preco(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id = c.post("/order/pedido").json()["id"]
        bebida = _criar_bebida(db_conn, preco=8.0)

        response = c.post("/order/bebidas", params={"id_pedido": pedido_id, "id_item_simples": bebida["id"], "quantidade": 2})

        assert response.status_code == 200
        assert response.json()["preco_pedido"] == 16.0

    def test_adicionar_bebida_duas_vezes_soma_quantidade(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id = c.post("/order/pedido").json()["id"]
        bebida = _criar_bebida(db_conn, preco=8.0)

        c.post("/order/bebidas", params={"id_pedido": pedido_id, "id_item_simples": bebida["id"]})
        c.post("/order/bebidas", params={"id_pedido": pedido_id, "id_item_simples": bebida["id"]})

        vinculos = db_conn.execute(
            "SELECT * FROM item_pedido_bebida WHERE pedido_id = %s", (pedido_id,)
        ).fetchall()
        assert len(vinculos) == 1
        assert vinculos[0]["quantidade"] == 2

    def test_pedido_inexistente_retorna_404(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        bebida = _criar_bebida(db_conn)
        response = c.post("/order/bebidas", params={"id_pedido": 99999, "id_item_simples": bebida["id"]})
        assert response.status_code == 404

    def test_remove_bebida_e_recalcula(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id = c.post("/order/pedido").json()["id"]
        bebida = _criar_bebida(db_conn, preco=8.0)
        c.post("/order/bebidas", params={"id_pedido": pedido_id, "id_item_simples": bebida["id"]})

        response = c.delete(f"/order/bebidas/{pedido_id}/{bebida['id']}")

        assert response.status_code == 200
        assert response.json()["preco_pedido"] == 0.0

    def test_remover_bebida_nao_vinculada_retorna_404(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id = c.post("/order/pedido").json()["id"]
        bebida = _criar_bebida(db_conn)

        response = c.delete(f"/order/bebidas/{pedido_id}/{bebida['id']}")

        assert response.status_code == 404


class TestAdicionaisBorda:

    def test_adiciona_borda_e_recalcula_preco(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, item_id, tamanho = _criar_pedido_com_item(db_conn, c, preco=40.0, qtd_bordas=2)
        adicional = _criar_adicional_com_preco(db_conn, tamanho["id"], preco=10.0)

        response = c.post(
            "/order/adicionais",
            params={
                "id_pedido": pedido_id, "id_item_pedido": item_id,
                "id_adicional": adicional["id"], "id_tamanho": tamanho["id"], "partes": 2,
            },
        )

        assert response.status_code == 200
        assert response.json()["preco_pedido"] == 50.0

    def test_sabor_que_nao_permite_borda_bloqueia(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, item_id, tamanho = _criar_pedido_com_item(db_conn, c, permite_borda=False)
        adicional = _criar_adicional_com_preco(db_conn, tamanho["id"])

        response = c.post(
            "/order/adicionais",
            params={"id_pedido": pedido_id, "id_item_pedido": item_id, "id_adicional": adicional["id"], "id_tamanho": tamanho["id"]},
        )

        assert response.status_code == 400

    def test_partes_alem_do_limite_do_tamanho_bloqueia(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, item_id, tamanho = _criar_pedido_com_item(db_conn, c, qtd_bordas=2)
        adicional = _criar_adicional_com_preco(db_conn, tamanho["id"])

        response = c.post(
            "/order/adicionais",
            params={
                "id_pedido": pedido_id, "id_item_pedido": item_id,
                "id_adicional": adicional["id"], "id_tamanho": tamanho["id"], "partes": 3,
            },
        )

        assert response.status_code == 400

    def test_partes_menor_que_1_bloqueia(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, item_id, tamanho = _criar_pedido_com_item(db_conn, c)
        adicional = _criar_adicional_com_preco(db_conn, tamanho["id"])

        response = c.post(
            "/order/adicionais",
            params={
                "id_pedido": pedido_id, "id_item_pedido": item_id,
                "id_adicional": adicional["id"], "id_tamanho": tamanho["id"], "partes": 0,
            },
        )

        assert response.status_code == 400

    def test_remove_adicional_e_recalcula(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, item_id, tamanho = _criar_pedido_com_item(db_conn, c, preco=40.0)
        adicional = _criar_adicional_com_preco(db_conn, tamanho["id"], preco=10.0)
        c.post(
            "/order/adicionais",
            params={"id_pedido": pedido_id, "id_item_pedido": item_id, "id_adicional": adicional["id"], "id_tamanho": tamanho["id"]},
        )

        response = c.delete(f"/order/pedidos/remover-item/{item_id}/{adicional['id']}/{tamanho['id']}")

        assert response.status_code == 200
        assert response.json()["pedido"]["preco"] == 40.0

    def test_remover_adicional_nao_vinculado_retorna_404(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, item_id, tamanho = _criar_pedido_com_item(db_conn, c)
        adicional = _criar_adicional_com_preco(db_conn, tamanho["id"])

        response = c.delete(f"/order/pedidos/remover-item/{item_id}/{adicional['id']}/{tamanho['id']}")

        assert response.status_code == 404


class TestFinalizarPedido:

    def test_finaliza_com_sucesso(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, _, _ = _criar_pedido_com_item(db_conn, c)
        endereco = db_conn.execute(
            """
            INSERT INTO enderecos_entrega (rua, cep, complemento, cidade, estado, numero, bairro, usuario_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *
            """,
            ("Rua X", "87200-000", None, "Cianorte", "PR", "1", "Centro", usuario_comum["id"]),
        ).fetchone()

        response = c.post(
            f"/order/pedido/finalizar/{pedido_id}",
            params={"tipo_pagamento": "Pix", "id_endereco": endereco["id"]},
        )

        assert response.status_code == 200
        pedido = db_conn.execute("SELECT status, formato_de_pagamento FROM pedidos WHERE id = %s", (pedido_id,)).fetchone()
        assert pedido["status"] == "PENDENTE"
        assert pedido["formato_de_pagamento"] == "Pix"

    def test_endereco_inexistente_retorna_404(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, _, _ = _criar_pedido_com_item(db_conn, c)

        response = c.post(f"/order/pedido/finalizar/{pedido_id}", params={"tipo_pagamento": "Pix", "id_endereco": 99999})

        assert response.status_code == 404

    def test_pedido_inexistente_retorna_404(self, client_como, usuario_comum):
        c = client_como(usuario_comum)
        response = c.post("/order/pedido/finalizar/99999", params={"tipo_pagamento": "Pix", "id_endereco": 1})
        assert response.status_code == 404


class TestVisualizarEListarPedidos:

    def test_visualiza_pedido_proprio(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, item_id, _ = _criar_pedido_com_item(db_conn, c, preco=40.0)

        response = c.get(f"/order/pedido/{pedido_id}")

        assert response.status_code == 200
        assert response.json()["id"] == pedido_id
        assert response.json()["itens"][0]["id"] == item_id

    def test_nao_pode_ver_pedido_de_outro_usuario(self, client_como, usuario_comum, admin_usuario, db_conn):
        c_admin = client_como(admin_usuario)
        pedido_id, _, _ = _criar_pedido_com_item(db_conn, c_admin)

        c_comum = client_como(usuario_comum)
        response = c_comum.get(f"/order/pedido/{pedido_id}")

        assert response.status_code == 401

    def test_pedido_inexistente_retorna_404(self, client_como, usuario_comum):
        c = client_como(usuario_comum)
        assert c.get("/order/pedido/99999").status_code == 404

    def test_lista_apenas_meus_pedidos(self, client_como, usuario_comum, admin_usuario):
        c_comum = client_como(usuario_comum)
        c_comum.post("/order/pedido")
        c_comum.post("/order/pedido")

        c_admin = client_como(admin_usuario)
        c_admin.post("/order/pedido")

        # client_como troca o dependency_override compartilhado do app --
        # setar de volta pro usuário comum antes de listar "meus pedidos"
        c_comum = client_como(usuario_comum)
        response = c_comum.get("/order/listar/meus-pedidos")

        assert response.status_code == 200
        assert len(response.json()) == 2


class TestPedidoEntregue:

    def test_marca_como_entregue(self, client_como, usuario_comum, db_conn):
        c = client_como(usuario_comum)
        pedido_id, _, _ = _criar_pedido_com_item(db_conn, c)

        response = c.put(f"/order/pedido/entregue/{pedido_id}")

        assert response.status_code == 200
        assert db_conn.execute("SELECT status FROM pedidos WHERE id = %s", (pedido_id,)).fetchone()["status"] == "ENTREGUE"

    def test_outro_usuario_nao_pode_marcar_como_entregue(self, client_como, usuario_comum, admin_usuario, db_conn):
        c_admin = client_como(admin_usuario)
        pedido_id, _, _ = _criar_pedido_com_item(db_conn, c_admin)

        c_comum = client_como(usuario_comum)
        response = c_comum.put(f"/order/pedido/entregue/{pedido_id}")

        assert response.status_code == 403

    def test_pedido_inexistente_retorna_404(self, client_como, usuario_comum):
        c = client_como(usuario_comum)
        assert c.put("/order/pedido/entregue/99999").status_code == 404
