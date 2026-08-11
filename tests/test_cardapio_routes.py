"""
Testes das rotas públicas do cardápio (cardapio_routes.py).

Todas as rotas aqui são públicas (sem verificar_token/verificar_adm),
então usamos o fixture 'client' só pela conveniência de já vir com
pegar_conexao trocado pela conexão de teste -- a sobrescrita de
verificar_adm no fixture simplesmente não é usada por essas rotas.
"""


def _criar_categoria(db_conn, nome="Pizzas"):
    return db_conn.execute("INSERT INTO categoria (nome) VALUES (%s) RETURNING *", (nome,)).fetchone()


def _criar_grade(db_conn, nome="Grade 1", posicao=1):
    return db_conn.execute(
        "INSERT INTO grade (nome, posicao) VALUES (%s, %s) RETURNING *", (nome, posicao)
    ).fetchone()


def _criar_tamanho(db_conn, nome="Grande", qtd_sabores=2, qtd_bordas=2):
    return db_conn.execute(
        "INSERT INTO tamanhos (nome, qtd_sabores, qtd_bordas) VALUES (%s, %s, %s) RETURNING *",
        (nome, qtd_sabores, qtd_bordas),
    ).fetchone()


def _criar_sabor(db_conn, nome="Calabresa", ativo=True, disponivel_cardapio_normal=True, **kw):
    return db_conn.execute(
        """
        INSERT INTO sabores (nome, ativo, disponivel_cardapio_normal, disponivel_monte_sua_pizza,
                              permite_borda, permite_ingrediente)
        VALUES (%s, %s, %s, %s, %s, %s) RETURNING *
        """,
        (
            nome, ativo, disponivel_cardapio_normal,
            kw.get("disponivel_monte_sua_pizza", False),
            kw.get("permite_borda", True), kw.get("permite_ingrediente", True),
        ),
    ).fetchone()


def _criar_preco(db_conn, sabor_id, tamanho_id, preco=40.0):
    return db_conn.execute(
        "INSERT INTO preco_pizza (sabor_id, tamanho_id, preco) VALUES (%s, %s, %s) RETURNING *",
        (sabor_id, tamanho_id, preco),
    ).fetchone()


class TestItensSimplesPublico:

    def test_lista_apenas_ativos_do_tipo_pedido(self, client, db_conn):
        db_conn.execute(
            "INSERT INTO itens_simples (tipo, nome, preco, ativo) VALUES (%s, %s, %s, %s)",
            ("BEBIDA", "Coca-Cola", 8.0, True),
        )
        db_conn.execute(
            "INSERT INTO itens_simples (tipo, nome, preco, ativo) VALUES (%s, %s, %s, %s)",
            ("BEBIDA", "Guaraná Inativo", 8.0, False),
        )
        db_conn.execute(
            "INSERT INTO itens_simples (tipo, nome, preco, ativo) VALUES (%s, %s, %s, %s)",
            ("INGREDIENTE", "Cebola", 2.0, True),
        )

        response = client.get("/cardapio/itens-simples", params={"tipo": "BEBIDA"})

        assert response.status_code == 200
        nomes = [i["nome"] for i in response.json()]
        assert nomes == ["Coca-Cola"]


class TestSaboresPublico:

    def test_lista_apenas_sabores_ativos_e_disponiveis_no_cardapio_normal(self, client, db_conn):
        _criar_sabor(db_conn, "Calabresa")
        _criar_sabor(db_conn, "Inativo", ativo=False)
        _criar_sabor(db_conn, "Fora do cardápio normal", disponivel_cardapio_normal=False)

        response = client.get("/cardapio/sabores")

        assert response.status_code == 200
        nomes = [s["nome"] for s in response.json()]
        assert nomes == ["Calabresa"]

    def test_visualizacao_de_sabor_traz_precos_por_tamanho(self, client, db_conn):
        sabor = _criar_sabor(db_conn, "Calabresa")
        tamanho = _criar_tamanho(db_conn)
        _criar_preco(db_conn, sabor["id"], tamanho["id"], preco=42.5)

        response = client.get(f"/cardapio/sabores/{sabor['id']}")

        assert response.status_code == 200
        corpo = response.json()
        assert corpo["nome"] == "Calabresa"
        assert len(corpo["preco_float"]) == 1
        assert corpo["preco_float"][0]["preco"] == 42.5
        assert corpo["preco_float"][0]["tamanho_rel"]["id"] == tamanho["id"]

    def test_sabor_inexistente_retorna_404(self, client):
        response = client.get("/cardapio/sabores/99999")
        assert response.status_code == 404


class TestMontePizzaPublico:

    def test_detalhe_traz_apenas_sabores_ativos_e_com_preco_no_tamanho(self, client, db_conn):
        categoria = _criar_categoria(db_conn)
        grade = _criar_grade(db_conn)
        tamanho = _criar_tamanho(db_conn, qtd_sabores=2)
        produto = db_conn.execute(
            """
            INSERT INTO produto_monte_pizza (nome, tamanho_id, categoria_id, grade_id, ativo)
            VALUES (%s, %s, %s, %s, %s) RETURNING *
            """,
            ("MSP Grande", tamanho["id"], categoria["id"], grade["id"], True),
        ).fetchone()

        com_preco = _criar_sabor(db_conn, "Calabresa")
        _criar_preco(db_conn, com_preco["id"], tamanho["id"], 40.0)
        sem_preco = _criar_sabor(db_conn, "Sem Preço Aqui")
        inativo = _criar_sabor(db_conn, "Inativo", ativo=False)
        _criar_preco(db_conn, inativo["id"], tamanho["id"], 40.0)

        for s in (com_preco, sem_preco, inativo):
            db_conn.execute(
                "INSERT INTO monte_pizza_sabor (produto_monte_pizza_id, sabor_id) VALUES (%s, %s)",
                (produto["id"], s["id"]),
            )

        response = client.get(f"/cardapio/monte-pizza/{produto['id']}")

        assert response.status_code == 200
        nomes = [s["nome"] for s in response.json()["sabores"]]
        assert nomes == ["Calabresa"]

    def test_produto_inativo_retorna_404(self, client, db_conn):
        categoria = _criar_categoria(db_conn)
        grade = _criar_grade(db_conn)
        tamanho = _criar_tamanho(db_conn)
        produto = db_conn.execute(
            """
            INSERT INTO produto_monte_pizza (nome, tamanho_id, categoria_id, grade_id, ativo)
            VALUES (%s, %s, %s, %s, %s) RETURNING *
            """,
            ("MSP Inativo", tamanho["id"], categoria["id"], grade["id"], False),
        ).fetchone()

        response = client.get(f"/cardapio/monte-pizza/{produto['id']}")

        assert response.status_code == 404

    def test_produto_inexistente_retorna_404(self, client):
        response = client.get("/cardapio/monte-pizza/99999")
        assert response.status_code == 404

    def test_listagem_traz_apenas_ativos(self, client, db_conn):
        categoria = _criar_categoria(db_conn)
        grade = _criar_grade(db_conn)
        tamanho = _criar_tamanho(db_conn)
        db_conn.execute(
            "INSERT INTO produto_monte_pizza (nome, tamanho_id, categoria_id, grade_id, ativo) VALUES (%s,%s,%s,%s,%s)",
            ("Ativo", tamanho["id"], categoria["id"], grade["id"], True),
        )
        db_conn.execute(
            "INSERT INTO produto_monte_pizza (nome, tamanho_id, categoria_id, grade_id, ativo) VALUES (%s,%s,%s,%s,%s)",
            ("Inativo", tamanho["id"], categoria["id"], grade["id"], False),
        )

        response = client.get("/cardapio/monte-pizza")

        nomes = [p["nome"] for p in response.json()]
        assert nomes == ["Ativo"]


class TestListasSimples:

    def test_adicionais(self, client, db_conn):
        db_conn.execute("INSERT INTO adicionais (nome) VALUES (%s)", ("Borda Catupiry",))
        response = client.get("/cardapio/adicionais")
        assert response.status_code == 200
        assert response.json()[0]["nome"] == "Borda Catupiry"

    def test_tamanhos(self, client, db_conn):
        _criar_tamanho(db_conn, nome="Média", qtd_sabores=2, qtd_bordas=1)
        response = client.get("/cardapio/tamanhos")
        assert response.status_code == 200
        assert response.json()[0]["nome"] == "Média"

    def test_precos(self, client, db_conn):
        sabor = _criar_sabor(db_conn)
        tamanho = _criar_tamanho(db_conn)
        _criar_preco(db_conn, sabor["id"], tamanho["id"], 55.0)

        response = client.get("/cardapio/precos")

        assert response.status_code == 200
        assert response.json()[0]["preco"] == 55.0
        assert response.json()[0]["sabor_rel"]["nome"] == "Calabresa"

    def test_preco_adicional_filtra_por_tamanho(self, client, db_conn):
        adicional = db_conn.execute(
            "INSERT INTO adicionais (nome) VALUES (%s) RETURNING *", ("Borda",)
        ).fetchone()
        tamanho1 = _criar_tamanho(db_conn, nome="Pequena")
        tamanho2 = _criar_tamanho(db_conn, nome="Grande")
        db_conn.execute(
            "INSERT INTO preco_adicional (adicional_id, tamanho_id, preco) VALUES (%s, %s, %s)",
            (adicional["id"], tamanho1["id"], 5.0),
        )
        db_conn.execute(
            "INSERT INTO preco_adicional (adicional_id, tamanho_id, preco) VALUES (%s, %s, %s)",
            (adicional["id"], tamanho2["id"], 10.0),
        )

        response = client.get("/cardapio/preco_adicional", params={"tamanho_id": tamanho2["id"]})

        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["preco"] == 10.0


class TestGradesPublicas:

    def test_agrupa_sabores_monte_pizza_e_bebidas_por_grade_ordenado_por_posicao(self, client, db_conn):
        categoria = _criar_categoria(db_conn)
        grade_2 = _criar_grade(db_conn, "Segunda", posicao=2)
        grade_1 = _criar_grade(db_conn, "Primeira", posicao=1)
        tamanho = _criar_tamanho(db_conn)

        sabor = _criar_sabor(db_conn, "Calabresa")
        db_conn.execute(
            "INSERT INTO grade_sabores (grade_id, sabores_id) VALUES (%s, %s)",
            (grade_1["id"], sabor["id"]),
        )
        db_conn.execute(
            "INSERT INTO itens_simples (tipo, nome, preco, ativo, grade_id) VALUES (%s,%s,%s,%s,%s)",
            ("BEBIDA", "Coca-Cola", 8.0, True, grade_2["id"]),
        )

        response = client.get("/cardapio/grades")

        assert response.status_code == 200
        corpo = response.json()
        # ordenado por posicao: Primeira (1) antes de Segunda (2)
        assert [g["grade_nome"] for g in corpo] == ["Primeira", "Segunda"]
        assert corpo[0]["produtos"][0]["tipo"] == "sabor"
        assert corpo[1]["produtos"][0]["tipo"] == "bebida"

    def test_grade_sem_nenhum_produto_nao_aparece(self, client, db_conn):
        _criar_grade(db_conn, "Vazia", posicao=1)

        response = client.get("/cardapio/grades")

        assert response.json() == []
