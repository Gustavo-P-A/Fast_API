"""
Testes diretos das funções de cálculo de preço (calculos.py).

Diferente dos demais arquivos, aqui chamamos as funções puras direto
com `db_conn`, sem passar pela API -- é regra de negócio (fórmula de
preço) que vale testar isolada, sem depender do formato de request/response
das rotas. A cobertura via test_order_routes.py testa o caminho feliz
"por fora"; aqui cobrimos as fórmulas com mais casos de borda (rateio
de 2+ adicionais, ingredientes, pedido sem itens etc).
"""
from calculos import preco_item, recalcular_preco_pedido, qtd_sabores_efetiva


def _criar_tamanho(db_conn, nome="Grande", qtd_sabores=2, qtd_bordas=2):
    return db_conn.execute(
        "INSERT INTO tamanhos (nome, qtd_sabores, qtd_bordas) VALUES (%s, %s, %s) RETURNING *",
        (nome, qtd_sabores, qtd_bordas),
    ).fetchone()


def _criar_sabor(db_conn, nome="Calabresa"):
    return db_conn.execute("INSERT INTO sabores (nome) VALUES (%s) RETURNING *", (nome,)).fetchone()


def _criar_preco_sabor(db_conn, sabor_id, tamanho_id, preco):
    db_conn.execute(
        "INSERT INTO preco_pizza (sabor_id, tamanho_id, preco) VALUES (%s, %s, %s)",
        (sabor_id, tamanho_id, preco),
    )


def _criar_usuario_e_pedido(db_conn, email="calc@teste.com"):
    usuario = db_conn.execute(
        "INSERT INTO usuarios (nome, email, senha) VALUES (%s, %s, %s) RETURNING *",
        ("Cliente Calc", email, "hash-fake"),
    ).fetchone()
    pedido = db_conn.execute(
        "INSERT INTO pedidos (usuario_id, status, preco) VALUES (%s, %s, %s) RETURNING *",
        (usuario["id"], "PENDENTE", 0.0),
    ).fetchone()
    return usuario, pedido


def _criar_item_pedido(db_conn, pedido_id, tamanho_id, sabor_ids, quantidade=1):
    item = db_conn.execute(
        "INSERT INTO itens_pedido (pedido_id, tamanho_id, quantidade) VALUES (%s, %s, %s) RETURNING *",
        (pedido_id, tamanho_id, quantidade),
    ).fetchone()
    for sabor_id in sabor_ids:
        db_conn.execute(
            "INSERT INTO item_pedido_sabor (item_pedido_id, sabor_id) VALUES (%s, %s)",
            (item["id"], sabor_id),
        )
    return item


class TestPrecoItem:

    def test_pizza_um_sabor_sem_adicional_nem_ingrediente(self, db_conn):
        tamanho = _criar_tamanho(db_conn)
        sabor = _criar_sabor(db_conn)
        _criar_preco_sabor(db_conn, sabor["id"], tamanho["id"], 40.0)
        _, pedido = _criar_usuario_e_pedido(db_conn)
        item = _criar_item_pedido(db_conn, pedido["id"], tamanho["id"], [sabor["id"]])

        assert preco_item(db_conn, item["id"]) == 40.0

    def test_meio_a_meio_cobra_o_maior_preco_entre_os_sabores(self, db_conn):
        tamanho = _criar_tamanho(db_conn)
        barato = _criar_sabor(db_conn, "Calabresa")
        caro = _criar_sabor(db_conn, "Camarão")
        _criar_preco_sabor(db_conn, barato["id"], tamanho["id"], 40.0)
        _criar_preco_sabor(db_conn, caro["id"], tamanho["id"], 65.0)
        _, pedido = _criar_usuario_e_pedido(db_conn)
        item = _criar_item_pedido(db_conn, pedido["id"], tamanho["id"], [barato["id"], caro["id"]])

        assert preco_item(db_conn, item["id"]) == 65.0

    def test_quantidade_multiplica_o_total(self, db_conn):
        tamanho = _criar_tamanho(db_conn)
        sabor = _criar_sabor(db_conn)
        _criar_preco_sabor(db_conn, sabor["id"], tamanho["id"], 40.0)
        _, pedido = _criar_usuario_e_pedido(db_conn)
        item = _criar_item_pedido(db_conn, pedido["id"], tamanho["id"], [sabor["id"]], quantidade=3)

        assert preco_item(db_conn, item["id"]) == 120.0

    def test_um_unico_adicional_cobra_preco_cheio(self, db_conn):
        tamanho = _criar_tamanho(db_conn, qtd_bordas=2)
        sabor = _criar_sabor(db_conn)
        _criar_preco_sabor(db_conn, sabor["id"], tamanho["id"], 40.0)
        adicional = db_conn.execute("INSERT INTO adicionais (nome) VALUES (%s) RETURNING *", ("Catupiry",)).fetchone()
        preco_add = db_conn.execute(
            "INSERT INTO preco_adicional (adicional_id, tamanho_id, preco) VALUES (%s, %s, %s) RETURNING *",
            (adicional["id"], tamanho["id"], 10.0),
        ).fetchone()
        _, pedido = _criar_usuario_e_pedido(db_conn)
        item = _criar_item_pedido(db_conn, pedido["id"], tamanho["id"], [sabor["id"]])
        db_conn.execute(
            "INSERT INTO item_adicionais (item_pedido_id, preco_adicional_id, partes) VALUES (%s, %s, %s)",
            (item["id"], preco_add["id"], 2),
        )

        assert preco_item(db_conn, item["id"]) == 50.0

    def test_dois_adicionais_sao_rateados_pelas_partes_sobre_qtd_bordas(self, db_conn):
        # qtd_bordas=4, dois adicionais com 2 partes cada -> cada um custa preco * 2/4
        tamanho = _criar_tamanho(db_conn, qtd_bordas=4)
        sabor = _criar_sabor(db_conn)
        _criar_preco_sabor(db_conn, sabor["id"], tamanho["id"], 40.0)
        adicional_a = db_conn.execute("INSERT INTO adicionais (nome) VALUES (%s) RETURNING *", ("Catupiry",)).fetchone()
        adicional_b = db_conn.execute("INSERT INTO adicionais (nome) VALUES (%s) RETURNING *", ("Cheddar",)).fetchone()
        preco_a = db_conn.execute(
            "INSERT INTO preco_adicional (adicional_id, tamanho_id, preco) VALUES (%s, %s, %s) RETURNING *",
            (adicional_a["id"], tamanho["id"], 8.0),
        ).fetchone()
        preco_b = db_conn.execute(
            "INSERT INTO preco_adicional (adicional_id, tamanho_id, preco) VALUES (%s, %s, %s) RETURNING *",
            (adicional_b["id"], tamanho["id"], 12.0),
        ).fetchone()
        _, pedido = _criar_usuario_e_pedido(db_conn)
        item = _criar_item_pedido(db_conn, pedido["id"], tamanho["id"], [sabor["id"]])
        db_conn.execute(
            "INSERT INTO item_adicionais (item_pedido_id, preco_adicional_id, partes) VALUES (%s, %s, %s)",
            (item["id"], preco_a["id"], 2),
        )
        db_conn.execute(
            "INSERT INTO item_adicionais (item_pedido_id, preco_adicional_id, partes) VALUES (%s, %s, %s)",
            (item["id"], preco_b["id"], 2),
        )

        # 40 (pizza) + 8*(2/4) + 12*(2/4) = 40 + 4 + 6 = 50
        assert preco_item(db_conn, item["id"]) == 50.0

    def test_soma_preco_dos_ingredientes_extras(self, db_conn):
        tamanho = _criar_tamanho(db_conn)
        sabor = _criar_sabor(db_conn)
        _criar_preco_sabor(db_conn, sabor["id"], tamanho["id"], 40.0)
        ingrediente = db_conn.execute(
            "INSERT INTO itens_simples (tipo, nome, preco) VALUES (%s, %s, %s) RETURNING *",
            ("INGREDIENTE", "Bacon Extra", 6.0),
        ).fetchone()
        _, pedido = _criar_usuario_e_pedido(db_conn)
        item = _criar_item_pedido(db_conn, pedido["id"], tamanho["id"], [sabor["id"]])
        db_conn.execute(
            "INSERT INTO item_pedido_ingrediente (item_pedido_id, item_simples_id, quantidade) VALUES (%s, %s, %s)",
            (item["id"], ingrediente["id"], 2),
        )

        # 40 + 6*2 = 52
        assert preco_item(db_conn, item["id"]) == 52.0

    def test_sabor_sem_preco_cadastrado_no_tamanho_conta_como_zero(self, db_conn):
        tamanho = _criar_tamanho(db_conn)
        sabor = _criar_sabor(db_conn)
        _, pedido = _criar_usuario_e_pedido(db_conn)
        item = _criar_item_pedido(db_conn, pedido["id"], tamanho["id"], [sabor["id"]])

        assert preco_item(db_conn, item["id"]) == 0.0

    def test_item_inexistente_retorna_zero(self, db_conn):
        assert preco_item(db_conn, 99999) == 0.0


class TestRecalcularPrecoPedido:

    def test_soma_itens_e_bebidas_e_salva_no_pedido(self, db_conn):
        tamanho = _criar_tamanho(db_conn)
        sabor = _criar_sabor(db_conn)
        _criar_preco_sabor(db_conn, sabor["id"], tamanho["id"], 40.0)
        bebida = db_conn.execute(
            "INSERT INTO itens_simples (tipo, nome, preco) VALUES (%s, %s, %s) RETURNING *",
            ("BEBIDA", "Coca-Cola", 8.0),
        ).fetchone()
        _, pedido = _criar_usuario_e_pedido(db_conn)
        _criar_item_pedido(db_conn, pedido["id"], tamanho["id"], [sabor["id"]])
        db_conn.execute(
            "INSERT INTO item_pedido_bebida (pedido_id, item_simples_id, quantidade) VALUES (%s, %s, %s)",
            (pedido["id"], bebida["id"], 2),
        )

        total = recalcular_preco_pedido(db_conn, pedido["id"])

        assert total == 56.0  # 40 + 8*2
        salvo = db_conn.execute("SELECT preco FROM pedidos WHERE id = %s", (pedido["id"],)).fetchone()
        assert salvo["preco"] == 56.0

    def test_pedido_sem_itens_nem_bebidas_zera_o_preco(self, db_conn):
        _, pedido = _criar_usuario_e_pedido(db_conn)
        db_conn.execute("UPDATE pedidos SET preco = %s WHERE id = %s", (99.0, pedido["id"]))

        total = recalcular_preco_pedido(db_conn, pedido["id"])

        assert total == 0.0
        assert db_conn.execute("SELECT preco FROM pedidos WHERE id = %s", (pedido["id"],)).fetchone()["preco"] == 0.0

    def test_soma_multiplos_itens(self, db_conn):
        tamanho = _criar_tamanho(db_conn)
        sabor = _criar_sabor(db_conn)
        _criar_preco_sabor(db_conn, sabor["id"], tamanho["id"], 40.0)
        _, pedido = _criar_usuario_e_pedido(db_conn)
        _criar_item_pedido(db_conn, pedido["id"], tamanho["id"], [sabor["id"]])
        _criar_item_pedido(db_conn, pedido["id"], tamanho["id"], [sabor["id"]], quantidade=2)

        total = recalcular_preco_pedido(db_conn, pedido["id"])

        assert total == 120.0  # 40 + (40*2)


class TestQtdSaboresEfetiva:

    def test_usa_qtd_do_tamanho_quando_sem_override(self, db_conn):
        tamanho = _criar_tamanho(db_conn, qtd_sabores=3)
        produto = db_conn.execute(
            "INSERT INTO produto_monte_pizza (nome, tamanho_id) VALUES (%s, %s) RETURNING *",
            ("MSP", tamanho["id"]),
        ).fetchone()

        assert qtd_sabores_efetiva(db_conn, produto["id"]) == 3

    def test_usa_override_quando_definido(self, db_conn):
        tamanho = _criar_tamanho(db_conn, qtd_sabores=3)
        produto = db_conn.execute(
            "INSERT INTO produto_monte_pizza (nome, tamanho_id, qtd_sabores_override) VALUES (%s, %s, %s) RETURNING *",
            ("MSP", tamanho["id"], 5),
        ).fetchone()

        assert qtd_sabores_efetiva(db_conn, produto["id"]) == 5

    def test_produto_inexistente_retorna_zero(self, db_conn):
        assert qtd_sabores_efetiva(db_conn, 99999) == 0
