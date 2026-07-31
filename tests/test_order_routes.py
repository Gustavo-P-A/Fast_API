"""
Testes das rotas de pedido (order_routes.py).

Cobre o fluxo principal: criar pedido -> adicionar item -> conferir
preço calculado -> cancelar/remover -> regras de "só o dono ou admin
pode mexer".
"""


def _criar_produto_pronto(db_conn, qtd_bordas=2, preco=40.0):
    """Helper: monta uma categoria + grade + tamanho + sabor com preço,
    prontos pra virar item de pedido."""
    categoria = db_conn.execute(
        "INSERT INTO categoria (nome) VALUES (%s) RETURNING *", ("Pizzas Salgadas",)
    ).fetchone()
    db_conn.execute("INSERT INTO grade (nome, posicao) VALUES (%s, %s)", ("Grade Padrão", 1))
    tamanho = db_conn.execute(
        "INSERT INTO tamanhos (nome, qtd_sabores, qtd_bordas) VALUES (%s, %s, %s) RETURNING *",
        ("Grande", 1, qtd_bordas),
    ).fetchone()

    sabor = db_conn.execute(
        "INSERT INTO sabores (nome, categoria_id, ativo) VALUES (%s, %s, %s) RETURNING *",
        ("Calabresa", categoria["id"], True),
    ).fetchone()
    db_conn.execute(
        "INSERT INTO preco_pizza (sabor_id, tamanho_id, preco) VALUES (%s, %s, %s)",
        (sabor["id"], tamanho["id"], preco),
    )

    return sabor, tamanho


class TestCriarPedido:

    def test_cria_pedido_para_usuario_logado(self, client_como, usuario_comum):
        c = client_como(usuario_comum)
        response = c.post("/order/pedido")

        assert response.status_code == 200
        assert response.json()["mensagem"] == "pedido criado com sucesso"
        assert "id" in response.json()


class TestAdicionarItem:

    def test_adiciona_item_e_calcula_preco(self, client_como, usuario_comum, db_conn):
        sabor, tamanho = _criar_produto_pronto(db_conn, preco=40.0)
        c = client_como(usuario_comum)

        pedido_id = c.post("/order/pedido").json()["id"]

        payload = {
            "tamanho_id": tamanho["id"],
            "sabor_ids": [sabor["id"]],
            "quantidade": 1,
            "observacoes": "sem cebola",
        }
        response = c.post(f"/order/pedidos/adicionar-item/{pedido_id}", json=payload)

        assert response.status_code == 200
        assert response.json()["preco_pedido"] == 40.0

    def test_quantidade_multiplica_o_preco(self, client_como, usuario_comum, db_conn):
        sabor, tamanho = _criar_produto_pronto(db_conn, preco=40.0)
        c = client_como(usuario_comum)
        pedido_id = c.post("/order/pedido").json()["id"]

        payload = {
            "tamanho_id": tamanho["id"],
            "sabor_ids": [sabor["id"]],
            "quantidade": 3,
        }
        response = c.post(f"/order/pedidos/adicionar-item/{pedido_id}", json=payload)

        assert response.json()["preco_pedido"] == 120.0

    def test_rejeita_sabor_indisponivel_no_tamanho(self, client_como, usuario_comum, db_conn):
        """O sabor tem preço só pro tamanho 'Grande'; tentar usar num
        tamanho sem preço cadastrado deve ser bloqueado (400), não
        deixar passar com preço 0 silenciosamente."""
        sabor, tamanho_grande = _criar_produto_pronto(db_conn, preco=40.0)
        tamanho_pequeno = db_conn.execute(
            "INSERT INTO tamanhos (nome, qtd_sabores, qtd_bordas) VALUES (%s, %s, %s) RETURNING *",
            ("Pequena", 1, 0),
        ).fetchone()

        c = client_como(usuario_comum)
        pedido_id = c.post("/order/pedido").json()["id"]

        payload = {
            "tamanho_id": tamanho_pequeno["id"],
            "sabor_ids": [sabor["id"]],
            "quantidade": 1,
        }
        response = c.post(f"/order/pedidos/adicionar-item/{pedido_id}", json=payload)

        assert response.status_code == 400

    def test_rejeita_mais_sabores_que_o_tamanho_permite(self, client_como, usuario_comum, db_conn):
        sabor, tamanho = _criar_produto_pronto(db_conn)  # qtd_sabores=1
        outro_sabor = db_conn.execute(
            "INSERT INTO sabores (nome, ativo) VALUES (%s, %s) RETURNING *", ("Marguerita", True)
        ).fetchone()
        db_conn.execute(
            "INSERT INTO preco_pizza (sabor_id, tamanho_id, preco) VALUES (%s, %s, %s)",
            (outro_sabor["id"], tamanho["id"], 40.0),
        )

        c = client_como(usuario_comum)
        pedido_id = c.post("/order/pedido").json()["id"]

        payload = {
            "tamanho_id": tamanho["id"],
            "sabor_ids": [sabor["id"], outro_sabor["id"]],  # tamanho só aceita 1
            "quantidade": 1,
        }
        response = c.post(f"/order/pedidos/adicionar-item/{pedido_id}", json=payload)

        assert response.status_code == 400

    def test_pedido_inexistente_retorna_404(self, client_como, usuario_comum, db_conn):
        sabor, tamanho = _criar_produto_pronto(db_conn)
        c = client_como(usuario_comum)

        payload = {"tamanho_id": tamanho["id"], "sabor_ids": [sabor["id"]], "quantidade": 1}
        response = c.post("/order/pedidos/adicionar-item/99999", json=payload)

        assert response.status_code == 404


class TestAutorizacaoPedido:

    def test_outro_usuario_nao_pode_mexer_no_pedido_alheio(self, client_como, usuario_comum, db_conn):
        # dono cria o pedido
        dono = usuario_comum
        c_dono = client_como(dono)
        pedido_id = c_dono.post("/order/pedido").json()["id"]

        # um segundo usuário, comum, tenta cancelar o pedido do outro
        intruso = db_conn.execute(
            "INSERT INTO usuarios (nome, email, senha, ativo, adm) VALUES (%s, %s, %s, %s, %s) RETURNING *",
            ("Intruso", "intruso@teste.com", "x", True, False),
        ).fetchone()

        c_intruso = client_como(intruso)
        response = c_intruso.put(f"/order/pedido/cancelar/{pedido_id}")

        assert response.status_code == 401

    def test_admin_pode_cancelar_pedido_de_qualquer_usuario(self, client_como, usuario_comum, admin_usuario):
        c_dono = client_como(usuario_comum)
        pedido_id = c_dono.post("/order/pedido").json()["id"]

        c_admin = client_como(admin_usuario)
        response = c_admin.put(f"/order/pedido/cancelar/{pedido_id}")

        assert response.status_code == 200
        assert response.json()["mensagem"].startswith("Pedido numero")

    def test_dono_pode_cancelar_o_proprio_pedido(self, client_como, usuario_comum):
        c = client_como(usuario_comum)
        pedido_id = c.post("/order/pedido").json()["id"]

        response = c.put(f"/order/pedido/cancelar/{pedido_id}")

        assert response.status_code == 200

    def test_cancelar_pedido_inexistente_retorna_404(self, client_como, usuario_comum):
        c = client_como(usuario_comum)
        response = c.put("/order/pedido/cancelar/99999")

        assert response.status_code == 404


class TestRemoverItem:

    def test_remover_item_recalcula_preco_do_pedido(self, client_como, usuario_comum, db_conn):
        sabor, tamanho = _criar_produto_pronto(db_conn, preco=40.0)
        c = client_como(usuario_comum)
        pedido_id = c.post("/order/pedido").json()["id"]

        payload = {"tamanho_id": tamanho["id"], "sabor_ids": [sabor["id"]], "quantidade": 1}
        item_id = c.post(
            f"/order/pedidos/adicionar-item/{pedido_id}", json=payload
        ).json()["item_id"]

        response = c.delete(f"/order/pedidos/remover-item/{item_id}")

        assert response.status_code == 200
        assert response.json()["itens_pedido"] == 0
        assert response.json()["pedido"]["preco"] == 0