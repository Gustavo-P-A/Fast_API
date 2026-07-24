"""
Testes das rotas de Monte Sua Pizza (monte_pizza_routes.py).

Cobre o ciclo completo: criar produto -> importar sabores automático
-> adicionar sabor manual -> sincronizar (remover indisponíveis) ->
remover individual -> qtd_sabores_efetiva() com e sem override ->
regras de "sabor só entra se ativo + disponivel_monte_sua_pizza +
tiver preço cadastrado pro tamanho".
"""


def _criar_base(db_conn, qtd_sabores=2, qtd_bordas=2):
    """Categoria + grade + tamanho prontos pra criar um Monte Sua Pizza."""
    categoria = db_conn.execute(
        "INSERT INTO categoria (nome) VALUES (%s) RETURNING *", ("Monte Sua Pizza",)
    ).fetchone()
    grade = db_conn.execute(
        "INSERT INTO grade (nome, posicao) VALUES (%s, %s) RETURNING *", ("Grade MSP", 1)
    ).fetchone()
    tamanho = db_conn.execute(
        "INSERT INTO tamanhos (nome, qtd_sabores, qtd_bordas) VALUES (%s, %s, %s) RETURNING *",
        ("Grande", qtd_sabores, qtd_bordas),
    ).fetchone()
    return categoria, grade, tamanho


def _criar_sabor(db_conn, nome, tamanho_id, preco=40.0, ativo=True,
                  disponivel_monte_sua_pizza=True):
    """Cria um Sabor e, se preco não for None, cadastra o PrecoPizza
    dele para o tamanho passado -- é isso que a rota checa para
    considerar o sabor 'candidato' ao Monte Sua Pizza."""
    sabor = db_conn.execute(
        "INSERT INTO sabores (nome, ativo, disponivel_monte_sua_pizza) VALUES (%s, %s, %s) RETURNING *",
        (nome, ativo, disponivel_monte_sua_pizza),
    ).fetchone()

    if preco is not None:
        db_conn.execute(
            "INSERT INTO preco_pizza (sabor_id, tamanho_id, preco) VALUES (%s, %s, %s)",
            (sabor["id"], tamanho_id, preco),
        )

    return sabor


def _criar_produto_monte_pizza(client, tamanho_id, categoria_id=None, grade_id=None,
                                qtd_sabores_override=None):
    payload = {
        "nome": "Monte Sua Pizza Grande",
        "tamanho_id": tamanho_id,
        "categoria_id": categoria_id,
        "grade_id": grade_id,
        "ativo": True,
        "qtd_sabores_override": qtd_sabores_override,
        "permite_borda": True,
        "permite_ingrediente": True,
    }
    response = client.post("/admin/monte-pizza/", json=payload)
    assert response.status_code == 200, response.text
    return response.json()["id"]


class TestCriarMontePizza:

    def test_cria_com_sucesso(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn)

        payload = {
            "nome": "Monte Sua Pizza",
            "tamanho_id": tamanho["id"],
            "categoria_id": categoria["id"],
            "grade_id": grade["id"],
            "ativo": True,
            "permite_borda": True,
            "permite_ingrediente": True,
        }
        response = client.post("/admin/monte-pizza/", json=payload)

        assert response.status_code == 200
        assert response.json()["mensagem"] == "Monte Sua Pizza criado com sucesso"
        assert "id" in response.json()

    def test_rejeita_tamanho_inexistente(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn)

        payload = {
            "nome": "Monte Sua Pizza",
            "tamanho_id": 99999,
            "categoria_id": categoria["id"],
            "grade_id": grade["id"],
        }
        response = client.post("/admin/monte-pizza/", json=payload)

        assert response.status_code == 404

    def test_rejeita_sem_nome(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn)

        payload = {"tamanho_id": tamanho["id"]}  # sem "nome"
        response = client.post("/admin/monte-pizza/", json=payload)

        assert response.status_code == 422


class TestQtdSaboresEfetiva:
    """Cobre a regra de negócio mais sutil do módulo: qtd_sabores_efetiva()
    usa o override do produto se ele existir, senão cai pro valor do
    tamanho relacionado."""

    def test_usa_qtd_do_tamanho_quando_sem_override(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn, qtd_sabores=3)
        produto_id = _criar_produto_monte_pizza(
            client, tamanho["id"], categoria["id"], grade["id"], qtd_sabores_override=None
        )

        response = client.get(f"/admin/monte-pizza/{produto_id}")

        assert response.json()["qtd_sabores_efetiva"] == 3

    def test_usa_override_quando_definido(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn, qtd_sabores=3)
        produto_id = _criar_produto_monte_pizza(
            client, tamanho["id"], categoria["id"], grade["id"], qtd_sabores_override=1
        )

        response = client.get(f"/admin/monte-pizza/{produto_id}")

        assert response.json()["qtd_sabores_efetiva"] == 1

    def test_rejeita_override_menor_que_1(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn)

        payload = {
            "nome": "Monte Sua Pizza",
            "tamanho_id": tamanho["id"],
            "qtd_sabores_override": 0,
        }
        response = client.post("/admin/monte-pizza/", json=payload)

        assert response.status_code == 422


class TestImportarSaboresAutomatico:

    def test_importa_apenas_sabores_elegiveis(self, client, db_conn):
        """5 cenários num teste só: sabor válido, sabor sem preço pro
        tamanho, sabor inativo, sabor com disponivel_monte_sua_pizza=False,
        e sabor com preço só noutro tamanho -- só o primeiro deve entrar."""
        categoria, grade, tamanho = _criar_base(db_conn)
        outro_tamanho = db_conn.execute(
            "INSERT INTO tamanhos (nome, qtd_sabores, qtd_bordas) VALUES (%s, %s, %s) RETURNING *",
            ("Pequena", 1, 0),
        ).fetchone()

        elegivel = _criar_sabor(db_conn, "Calabresa", tamanho["id"], preco=40.0)
        _criar_sabor(db_conn, "Sem Preço", tamanho["id"], preco=None)
        _criar_sabor(db_conn, "Inativo", tamanho["id"], preco=40.0, ativo=False)
        _criar_sabor(db_conn, "Fora do MSP", tamanho["id"], preco=40.0,
                     disponivel_monte_sua_pizza=False)
        _criar_sabor(db_conn, "Preço em Outro Tamanho", outro_tamanho["id"], preco=40.0)

        produto_id = _criar_produto_monte_pizza(client, tamanho["id"], categoria["id"], grade["id"])

        response = client.post(f"/admin/monte-pizza/{produto_id}/sabores/importar-automatico")

        assert response.status_code == 200
        assert response.json()["mensagem"] == "1 sabor(es) importado(s) com sucesso"

        detalhe = client.get(f"/admin/monte-pizza/{produto_id}").json()
        nomes = [s["nome"] for s in detalhe["sabores"]]
        assert nomes == ["Calabresa"]
        assert elegivel["id"] == detalhe["sabores"][0]["id"]

    def test_nao_duplica_sabor_ja_vinculado(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn)
        sabor = _criar_sabor(db_conn, "Calabresa", tamanho["id"], preco=40.0)
        produto_id = _criar_produto_monte_pizza(client, tamanho["id"], categoria["id"], grade["id"])

        primeira = client.post(f"/admin/monte-pizza/{produto_id}/sabores/importar-automatico")
        segunda = client.post(f"/admin/monte-pizza/{produto_id}/sabores/importar-automatico")

        assert primeira.json()["mensagem"] == "1 sabor(es) importado(s) com sucesso"
        assert segunda.json()["mensagem"] == "0 sabor(es) importado(s) com sucesso"

        vinculos = db_conn.execute(
            "SELECT COUNT(*) AS total FROM monte_pizza_sabor WHERE produto_monte_pizza_id = %s AND sabor_id = %s",
            (produto_id, sabor["id"]),
        ).fetchone()
        assert vinculos["total"] == 1

    def test_produto_inexistente_retorna_404(self, client):
        response = client.post("/admin/monte-pizza/99999/sabores/importar-automatico")
        assert response.status_code == 404


class TestAdicionarSaboresManual:

    def test_adiciona_sabores_validos(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn)
        s1 = _criar_sabor(db_conn, "Calabresa", tamanho["id"], preco=40.0)
        s2 = _criar_sabor(db_conn, "Marguerita", tamanho["id"], preco=45.0)
        produto_id = _criar_produto_monte_pizza(client, tamanho["id"], categoria["id"], grade["id"])

        response = client.post(
            f"/admin/monte-pizza/{produto_id}/sabores/adicionar",
            json={"sabor_ids": [s1["id"], s2["id"]]},
        )

        assert response.status_code == 200
        assert "2 sabor(es) adicionado(s) com sucesso" in response.json()["mensagem"]

    def test_ignora_sabor_indisponivel_mas_adiciona_os_validos(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn)
        valido = _criar_sabor(db_conn, "Calabresa", tamanho["id"], preco=40.0)
        invalido = _criar_sabor(db_conn, "Inativo", tamanho["id"], preco=40.0, ativo=False)
        produto_id = _criar_produto_monte_pizza(client, tamanho["id"], categoria["id"], grade["id"])

        response = client.post(
            f"/admin/monte-pizza/{produto_id}/sabores/adicionar",
            json={"sabor_ids": [valido["id"], invalido["id"]]},
        )

        corpo = response.json()
        assert "1 sabor(es) adicionado(s)" in corpo["mensagem"]
        assert "1 ignorado(s)" in corpo["mensagem"]

    def test_rejeita_lista_vazia_de_sabores(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn)
        produto_id = _criar_produto_monte_pizza(client, tamanho["id"], categoria["id"], grade["id"])

        response = client.post(
            f"/admin/monte-pizza/{produto_id}/sabores/adicionar",
            json={"sabor_ids": []},
        )

        # MonteSuaPizzaSaborSchema exige min_length=1
        assert response.status_code == 422


class TestSincronizarSabores:

    def test_remove_sabor_que_ficou_indisponivel(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn)
        sabor = _criar_sabor(db_conn, "Calabresa", tamanho["id"], preco=40.0)
        produto_id = _criar_produto_monte_pizza(client, tamanho["id"], categoria["id"], grade["id"])
        client.post(f"/admin/monte-pizza/{produto_id}/sabores/importar-automatico")

        # sabor deixa de estar disponível para monte-sua-pizza depois de importado
        db_conn.execute("UPDATE sabores SET disponivel_monte_sua_pizza = %s WHERE id = %s", (False, sabor["id"]))

        response = client.post(f"/admin/monte-pizza/{produto_id}/sabores/sincronizar")

        assert response.status_code == 200
        assert "1 sabor(es) removido(s)" in response.json()["mensagem"]
        detalhe = client.get(f"/admin/monte-pizza/{produto_id}").json()
        assert detalhe["sabores"] == []

    def test_mantem_sabor_ainda_disponivel(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn)
        _criar_sabor(db_conn, "Calabresa", tamanho["id"], preco=40.0)
        produto_id = _criar_produto_monte_pizza(client, tamanho["id"], categoria["id"], grade["id"])
        client.post(f"/admin/monte-pizza/{produto_id}/sabores/importar-automatico")

        response = client.post(f"/admin/monte-pizza/{produto_id}/sabores/sincronizar")

        assert "0 sabor(es) removido(s)" in response.json()["mensagem"]
        detalhe = client.get(f"/admin/monte-pizza/{produto_id}").json()
        assert len(detalhe["sabores"]) == 1


class TestRemoverSaborIndividual:

    def test_remove_vinculo_existente(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn)
        sabor = _criar_sabor(db_conn, "Calabresa", tamanho["id"], preco=40.0)
        produto_id = _criar_produto_monte_pizza(client, tamanho["id"], categoria["id"], grade["id"])
        client.post(f"/admin/monte-pizza/{produto_id}/sabores/importar-automatico")

        response = client.delete(f"/admin/monte-pizza/{produto_id}/sabores/{sabor['id']}")

        assert response.status_code == 200
        detalhe = client.get(f"/admin/monte-pizza/{produto_id}").json()
        assert detalhe["sabores"] == []

    def test_vinculo_inexistente_retorna_404(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn)
        produto_id = _criar_produto_monte_pizza(client, tamanho["id"], categoria["id"], grade["id"])

        response = client.delete(f"/admin/monte-pizza/{produto_id}/sabores/99999")

        assert response.status_code == 404


class TestTogglaEEditarEDeletar:

    def test_toggle_status_inverte_ativo(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn)
        produto_id = _criar_produto_monte_pizza(client, tamanho["id"], categoria["id"], grade["id"])

        primeira = client.patch(f"/admin/monte-pizza/{produto_id}/status")
        segunda = client.patch(f"/admin/monte-pizza/{produto_id}/status")

        assert primeira.json()["ativo"] is False  # começou True, virou False
        assert segunda.json()["ativo"] is True    # virou True de novo

    def test_editar_atualiza_campos(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn, qtd_sabores=2)
        produto_id = _criar_produto_monte_pizza(client, tamanho["id"], categoria["id"], grade["id"])

        payload = {
            "nome": "Monte Sua Pizza Editado",
            "tamanho_id": tamanho["id"],
            "categoria_id": categoria["id"],
            "grade_id": grade["id"],
            "ativo": False,
            "qtd_sabores_override": 1,
            "permite_borda": False,
            "permite_ingrediente": False,
        }
        response = client.put(f"/admin/monte-pizza/{produto_id}", json=payload)
        assert response.status_code == 200

        detalhe = client.get(f"/admin/monte-pizza/{produto_id}").json()
        assert detalhe["nome"] == "Monte Sua Pizza Editado"
        assert detalhe["ativo"] is False
        assert detalhe["qtd_sabores_efetiva"] == 1
        assert detalhe["permite_borda"] is False

    def test_deletar_remove_produto_e_vinculos_em_cascata(self, client, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn)
        sabor = _criar_sabor(db_conn, "Calabresa", tamanho["id"], preco=40.0)
        produto_id = _criar_produto_monte_pizza(client, tamanho["id"], categoria["id"], grade["id"])
        client.post(f"/admin/monte-pizza/{produto_id}/sabores/importar-automatico")

        response = client.delete(f"/admin/monte-pizza/{produto_id}")

        assert response.status_code == 200
        assert client.get(f"/admin/monte-pizza/{produto_id}").status_code == 404
        # ON DELETE CASCADE em monte_pizza_sabor (sql/schema.sql) -- o
        # vínculo não deve sobrar órfão
        restantes = db_conn.execute(
            "SELECT COUNT(*) AS total FROM monte_pizza_sabor WHERE produto_monte_pizza_id = %s",
            (produto_id,),
        ).fetchone()
        assert restantes["total"] == 0


class TestAutorizacao:

    def test_bloqueia_quem_nao_e_admin(self, client_como, usuario_comum, db_conn):
        categoria, grade, tamanho = _criar_base(db_conn)

        c = client_como(usuario_comum)
        payload = {"nome": "Monte Sua Pizza", "tamanho_id": tamanho["id"]}
        response = c.post("/admin/monte-pizza/", json=payload)

        # verificar_adm não está sobrescrito no client_como (só
        # verificar_token) -- então a checagem real de "é admin?"
        # roda de verdade e barra o usuário comum
        assert response.status_code in (401, 403)
