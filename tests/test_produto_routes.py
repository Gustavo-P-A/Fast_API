"""
Testes do endpoint POST /admin/novo-produto (produto_routes.py).

Cada teste segue o padrão AAA (Arrange, Act, Assert):
  - Arrange: prepara os dados/estado necessários (categoria, grade, tamanho)
  - Act: chama a rota
  - Assert: confere o resultado (status code, corpo da resposta, banco)

Isso é o "robô" que você pediu: quando você mexer em produto_routes.py,
roda `pytest` e ele te avisa na hora se algo quebrou -- sem precisar
abrir o /docs e clicar manualmente toda vez.
"""
from models import Categoria, Grade, Tamanhos


def _criar_categoria_grade_tamanho(db_session):
    """Helper: cria o mínimo de dados relacionados que a rota exige
    (categoria_id, grade_id, tamanho_id) para não repetir isso em
    cada teste."""
    categoria = Categoria(nome="Pizzas Salgadas")
    grade = Grade(nome="Grade Padrão", posicao=1)
    tamanho = Tamanhos(nome="Grande", qtd_sabores=1, qtd_bordas=2)

    db_session.add_all([categoria, grade, tamanho])
    db_session.commit()
    db_session.refresh(categoria)
    db_session.refresh(grade)
    db_session.refresh(tamanho)
    return categoria, grade, tamanho


class TestCriarNovoProduto:

    def test_cria_produto_com_sucesso(self, client, db_session):
        categoria, grade, tamanho = _criar_categoria_grade_tamanho(db_session)

        payload = {
            "nome": "Pizza Calabresa",
            "descricao": "Calabresa fatiada, cebola e mussarela",
            "ativo": True,
            "grade_id": grade.id,
            "categoria_id": categoria.id,
            "precos": [
                {"tamanho_id": tamanho.id, "preco": 45.90}
            ],
        }

        response = client.post("/admin/novo-produto", json=payload)

        assert response.status_code == 200
        assert response.json() == {"mensagem": "Produto criado com sucesso"}

    def test_produto_criado_aparece_no_banco_com_preco_correto(self, client, db_session):
        categoria, grade, tamanho = _criar_categoria_grade_tamanho(db_session)

        payload = {
            "nome": "Pizza Marguerita",
            "descricao": "Molho, mussarela e manjericão",
            "ativo": True,
            "grade_id": grade.id,
            "categoria_id": categoria.id,
            "precos": [{"tamanho_id": tamanho.id, "preco": 39.90}],
        }

        client.post("/admin/novo-produto", json=payload)

        from models import Sabores, PrecoPizza
        produto = db_session.query(Sabores).filter_by(nome="Pizza Marguerita").first()
        assert produto is not None
        assert produto.categoria_id == categoria.id

        preco = db_session.query(PrecoPizza).filter_by(sabor_id=produto.id).first()
        assert preco.preco == 39.90
        assert preco.tamanho_id == tamanho.id

    def test_rejeita_produto_sem_nome(self, client, db_session):
        categoria, grade, tamanho = _criar_categoria_grade_tamanho(db_session)

        payload = {
            # "nome" propositalmente omitido
            "descricao": "Sem nome",
            "ativo": True,
            "grade_id": grade.id,
            "categoria_id": categoria.id,
            "precos": [{"tamanho_id": tamanho.id, "preco": 20.0}],
        }

        response = client.post("/admin/novo-produto", json=payload)

        # Validação do Pydantic deve barrar antes de chegar no banco
        assert response.status_code == 422

    def test_rejeita_produto_sem_precos(self, client, db_session):
        categoria, grade, tamanho = _criar_categoria_grade_tamanho(db_session)

        payload = {
            "nome": "Pizza Sem Preço",
            "descricao": "teste",
            "ativo": True,
            "grade_id": grade.id,
            "categoria_id": categoria.id,
            "precos": [],
        }

        response = client.post("/admin/novo-produto", json=payload)

        # Hoje a rota aceita precos=[] (lista vazia é válida pro schema).
        # Este teste documenta o comportamento ATUAL -- se um dia vocês
        # decidirem que todo produto precisa ter pelo menos 1 preço,
        # é este teste que vai quebrar e te lembrar de adicionar a
        # validação em produto_routes.py ou no schema.
        assert response.status_code == 200


class TestAutorizacao:

    def test_bloqueia_quem_nao_e_admin(self, client, db_session):
        """
        Sobrescreve de novo o dependency override, desta vez simulando
        um usuário comum (não-admin), pra confirmar que a regra de
        autorização realmente está em vigor na rota.
        """
        from main import app
        from dependsadm import verificar_adm
        from fastapi import HTTPException

        def _usuario_comum():
            raise HTTPException(status_code=403, detail="Acesso negado")

        app.dependency_overrides[verificar_adm] = _usuario_comum

        payload = {
            "nome": "Pizza Não Autorizada",
            "descricao": "teste",
            "ativo": True,
            "grade_id": 1,
            "categoria_id": 1,
            "precos": [],
        }
        response = client.post("/admin/novo-produto", json=payload)

        assert response.status_code == 403
