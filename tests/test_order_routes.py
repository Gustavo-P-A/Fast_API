"""
Testes das rotas de pedido (order_routes.py).

Cobre o fluxo principal: criar pedido -> adicionar item -> conferir
preço calculado -> cancelar/remover -> regras de "só o dono ou admin
pode mexer".
"""
from models import Categoria, Grade, Tamanhos, Sabores, PrecoPizza


def _criar_produto_pronto(db_session, qtd_bordas=2, preco=40.0):
    """Helper: monta uma categoria + grade + tamanho + sabor com preço,
    prontos pra virar item de pedido."""
    categoria = Categoria(nome="Pizzas Salgadas")
    grade = Grade(nome="Grade Padrão", posicao=1)
    tamanho = Tamanhos(nome="Grande", qtd_sabores=1, qtd_bordas=qtd_bordas)
    db_session.add_all([categoria, grade, tamanho])
    db_session.commit()

    sabor = Sabores(nome="Calabresa", categoria_id=categoria.id, ativo=True)
    db_session.add(sabor)
    db_session.commit()

    preco_pizza = PrecoPizza(sabor_id=sabor.id, tamanho_id=tamanho.id, preco=preco)
    db_session.add(preco_pizza)
    db_session.commit()

    db_session.refresh(sabor)
    db_session.refresh(tamanho)
    return sabor, tamanho


class TestCriarPedido:

    def test_cria_pedido_para_usuario_logado(self, client_como, usuario_comum):
        c = client_como(usuario_comum)
        response = c.post("/order/pedido")

        assert response.status_code == 200
        assert response.json()["mensagem"] == "pedido criado com sucesso"
        assert "id" in response.json()


class TestAdicionarItem:

    def test_adiciona_item_e_calcula_preco(self, client_como, usuario_comum, db_session):
        sabor, tamanho = _criar_produto_pronto(db_session, preco=40.0)
        c = client_como(usuario_comum)

        pedido_id = c.post("/order/pedido").json()["id"]

        payload = {
            "tamanho_id": tamanho.id,
            "sabor_ids": [sabor.id],
            "quantidade": 1,
            "observacoes": "sem cebola",
        }
        response = c.post(f"/order/pedidos/adicionar-item/{pedido_id}", json=payload)

        assert response.status_code == 200
        assert response.json()["preco_pedido"] == 40.0

    def test_quantidade_multiplica_o_preco(self, client_como, usuario_comum, db_session):
        sabor, tamanho = _criar_produto_pronto(db_session, preco=40.0)
        c = client_como(usuario_comum)
        pedido_id = c.post("/order/pedido").json()["id"]

        payload = {
            "tamanho_id": tamanho.id,
            "sabor_ids": [sabor.id],
            "quantidade": 3,
        }
        response = c.post(f"/order/pedidos/adicionar-item/{pedido_id}", json=payload)

        assert response.json()["preco_pedido"] == 120.0

    def test_rejeita_sabor_indisponivel_no_tamanho(self, client_como, usuario_comum, db_session):
        """O sabor tem preço só pro tamanho 'Grande'; tentar usar num
        tamanho sem preço cadastrado deve ser bloqueado (400), não
        deixar passar com preço 0 silenciosamente."""
        sabor, tamanho_grande = _criar_produto_pronto(db_session, preco=40.0)
        tamanho_pequeno = Tamanhos(nome="Pequena", qtd_sabores=1, qtd_bordas=0)
        db_session.add(tamanho_pequeno)
        db_session.commit()

        c = client_como(usuario_comum)
        pedido_id = c.post("/order/pedido").json()["id"]

        payload = {
            "tamanho_id": tamanho_pequeno.id,
            "sabor_ids": [sabor.id],
            "quantidade": 1,
        }
        response = c.post(f"/order/pedidos/adicionar-item/{pedido_id}", json=payload)

        assert response.status_code == 400

    def test_rejeita_mais_sabores_que_o_tamanho_permite(self, client_como, usuario_comum, db_session):
        sabor, tamanho = _criar_produto_pronto(db_session)  # qtd_sabores=1
        outro_sabor = Sabores(nome="Marguerita", ativo=True)
        db_session.add(outro_sabor)
        db_session.commit()
        PrecoPizza(sabor_id=outro_sabor.id, tamanho_id=tamanho.id, preco=40.0)
        db_session.add(PrecoPizza(sabor_id=outro_sabor.id, tamanho_id=tamanho.id, preco=40.0))
        db_session.commit()

        c = client_como(usuario_comum)
        pedido_id = c.post("/order/pedido").json()["id"]

        payload = {
            "tamanho_id": tamanho.id,
            "sabor_ids": [sabor.id, outro_sabor.id],  # tamanho só aceita 1
            "quantidade": 1,
        }
        response = c.post(f"/order/pedidos/adicionar-item/{pedido_id}", json=payload)

        assert response.status_code == 400

    def test_pedido_inexistente_retorna_404(self, client_como, usuario_comum, db_session):
        sabor, tamanho = _criar_produto_pronto(db_session)
        c = client_como(usuario_comum)

        payload = {"tamanho_id": tamanho.id, "sabor_ids": [sabor.id], "quantidade": 1}
        response = c.post("/order/pedidos/adicionar-item/99999", json=payload)

        assert response.status_code == 404


class TestAutorizacaoPedido:

    def test_outro_usuario_nao_pode_mexer_no_pedido_alheio(self, client_como, usuario_comum, db_session):
        # dono cria o pedido
        dono = usuario_comum
        c_dono = client_como(dono)
        pedido_id = c_dono.post("/order/pedido").json()["id"]

        # um segundo usuário, comum, tenta cancelar o pedido do outro
        from models import Usuario
        intruso = Usuario(nome="Intruso", email="intruso@teste.com", senha="x", ativo=True, adm=False)
        db_session.add(intruso)
        db_session.commit()
        db_session.refresh(intruso)

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

    def test_remover_item_recalcula_preco_do_pedido(self, client_como, usuario_comum, db_session):
        sabor, tamanho = _criar_produto_pronto(db_session, preco=40.0)
        c = client_como(usuario_comum)
        pedido_id = c.post("/order/pedido").json()["id"]

        payload = {"tamanho_id": tamanho.id, "sabor_ids": [sabor.id], "quantidade": 1}
        item_id = c.post(
            f"/order/pedidos/adicionar-item/{pedido_id}", json=payload
        ).json()["item_id"]

        response = c.delete(f"/order/pedidos/remover-item/{item_id}")

        assert response.status_code == 200
        assert response.json()["itens_pedido"] == 0
        assert response.json()["pedido"]["preco"] == 0