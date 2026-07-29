"""
Cálculos que antes eram métodos dos models SQLAlchemy (ItemPedido.preco_base
/ soma_add / soma_ingredientes / preco_total, Pedidos.calcular_preco,
ProdutoMonteSuaPizza.qtd_sabores_efetiva). Sem ORM não tem mais
`self.sabores_rel`, `self.tamanho_rel` etc. andando sozinho — cada um desses
vira uma busca explícita no banco.

Ficam num módulo à parte (não em database.py) porque são regra de negócio
em cima do acesso ao banco, não a infraestrutura de acesso em si.
Toda vez que um pedido muda (item, adicional, ingrediente ou bebida
adicionado/removido), a rota chama recalcular_preco_pedido no final —
igual o código antigo chamava pedido.calcular_preco().
"""
from database import fetch_one, fetch_all, execute


def preco_item(conn, item_pedido_id: int) -> float:
    """Equivalente a ItemPedido.preco_total() do models.py antigo."""
    item = fetch_one(
        conn,
        "SELECT tamanho_id, quantidade FROM itens_pedido WHERE id = %s",
        (item_pedido_id,),
    )
    if not item:
        return 0.0

    tamanho = fetch_one(
        conn, "SELECT qtd_bordas FROM tamanhos WHERE id = %s", (item["tamanho_id"],)
    )
    qtd_bordas = (tamanho["qtd_bordas"] if tamanho else 0) or 1

    # preco_base: maior preço entre os sabores do item, pro tamanho do item
    # (equivalente a: next(p for p in ips.sabor_rel.preco_float if p.tamanho_id == self.tamanho_id))
    precos_sabores = fetch_all(
        conn,
        """
        SELECT pp.preco
        FROM item_pedido_sabor ips
        JOIN preco_pizza pp
          ON pp.sabor_id = ips.sabor_id AND pp.tamanho_id = %s
        WHERE ips.item_pedido_id = %s
        """,
        (item["tamanho_id"], item_pedido_id),
    )
    preco_base = max((r["preco"] for r in precos_sabores), default=0.0)

    # soma_add: com 1 adicional só, cobra o preço cheio; com 2+, rateia
    # proporcionalmente pelas "partes" de cada um sobre qtd_bordas do tamanho
    adicionais = fetch_all(
        conn,
        """
        SELECT pa.preco, iad.partes
        FROM item_adicionais iad
        JOIN preco_adicional pa ON pa.id = iad.preco_adicional_id
        WHERE iad.item_pedido_id = %s
        """,
        (item_pedido_id,),
    )
    if not adicionais:
        soma_add = 0.0
    elif len(adicionais) == 1:
        soma_add = adicionais[0]["preco"]
    else:
        soma_add = sum(a["preco"] * (a["partes"] / qtd_bordas) for a in adicionais)

    # soma_ingredientes
    ingredientes = fetch_all(
        conn,
        """
        SELECT isi.preco, ipi.quantidade
        FROM item_pedido_ingrediente ipi
        JOIN itens_simples isi ON isi.id = ipi.item_simples_id
        WHERE ipi.item_pedido_id = %s
        """,
        (item_pedido_id,),
    )
    soma_ingredientes = sum(r["preco"] * r["quantidade"] for r in ingredientes)

    return (preco_base + soma_add + soma_ingredientes) * item["quantidade"]


def recalcular_preco_pedido(conn, pedido_id: int) -> float:
    """Equivalente a Pedidos.calcular_preco() do models.py antigo — soma o
    preço de todos os itens (pizzas) + todas as bebidas do pedido, salva em
    pedidos.preco e devolve o total. Chame depois de qualquer alteração no
    pedido (item, adicional, ingrediente ou bebida)."""
    itens = fetch_all(conn, "SELECT id FROM itens_pedido WHERE pedido_id = %s", (pedido_id,))
    total = sum(preco_item(conn, item["id"]) for item in itens)

    bebidas = fetch_all(
        conn,
        """
        SELECT isi.preco, ipb.quantidade
        FROM item_pedido_bebida ipb
        JOIN itens_simples isi ON isi.id = ipb.item_simples_id
        WHERE ipb.pedido_id = %s
        """,
        (pedido_id,),
    )
    total += sum(b["preco"] * b["quantidade"] for b in bebidas)

    execute(conn, "UPDATE pedidos SET preco = %s WHERE id = %s", (total, pedido_id))
    return total


def qtd_sabores_efetiva(conn, produto_monte_pizza_id: int) -> int:
    """Equivalente a ProdutoMonteSuaPizza.qtd_sabores_efetiva() do
    models.py antigo."""
    row = fetch_one(
        conn,
        """
        SELECT p.qtd_sabores_override, t.qtd_sabores
        FROM produto_monte_pizza p
        JOIN tamanhos t ON t.id = p.tamanho_id
        WHERE p.id = %s
        """,
        (produto_monte_pizza_id,),
    )
    if not row:
        return 0
    return row["qtd_sabores_override"] if row["qtd_sabores_override"] else row["qtd_sabores"]
