import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Carrinho } from "../../src/pages/Carrinho";
import { CartContext } from "../../src/contexts/CartContext";

function renderCarrinho(valorContexto) {
  render(
    <MemoryRouter>
      <CartContext.Provider value={valorContexto}>
        <Carrinho />
      </CartContext.Provider>
    </MemoryRouter>
  );
}

const CONTEXTO_VAZIO = {
  itens: [], bebidas: [], removerItem: vi.fn(), alterarQtdBebida: vi.fn(),
  removerBebida: vi.fn(), total: 0, vazio: true,
};

const ITEM = {
  id: "item-1",
  sabor_nomes: ["Calabresa"],
  tamanho_nome: "Grande",
  bordas: [],
  ingredientes: [],
  preco_sabor: 40,
  qtd_bordas: 2,
};

const BEBIDA = { item_simples_id: 5, nome: "Coca-Cola", preco: 8, quantidade: 2 };

describe("Carrinho - vazio", () => {
  it("mostra mensagem de carrinho vazio e botão pro cardápio", () => {
    renderCarrinho(CONTEXTO_VAZIO);
    expect(screen.getByText("Seu carrinho está vazio.")).toBeInTheDocument();
    expect(screen.getByText("Ver cardápio")).toBeInTheDocument();
  });
});

describe("Carrinho - com itens", () => {
  it("lista pizzas com nome, tamanho e preço calculado", () => {
    renderCarrinho({ ...CONTEXTO_VAZIO, itens: [ITEM], vazio: false, total: 40 });

    expect(screen.getByText("Calabresa")).toBeInTheDocument();
    expect(screen.getByText("Tamanho: Grande")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 40,00").length).toBeGreaterThan(0);
  });

  it("mostra borda e ingredientes quando existem", () => {
    const item = {
      ...ITEM,
      bordas: [{ nome: "Catupiry", partes: 2, adicional_id: 1 }],
      ingredientes: [{ nome: "Bacon", quantidade: 2 }],
    };
    renderCarrinho({ ...CONTEXTO_VAZIO, itens: [item], vazio: false, total: 40 });

    expect(screen.getByText(/Catupiry/)).toBeInTheDocument();
    expect(screen.getByText(/Bacon x2/)).toBeInTheDocument();
  });

  it("botão Remover chama removerItem com o id do item", () => {
    const removerItem = vi.fn();
    renderCarrinho({ ...CONTEXTO_VAZIO, itens: [ITEM], vazio: false, total: 40, removerItem });

    fireEvent.click(screen.getByText("Remover"));

    expect(removerItem).toHaveBeenCalledWith("item-1");
  });

  it("lista bebidas com contador de quantidade", () => {
    renderCarrinho({ ...CONTEXTO_VAZIO, bebidas: [BEBIDA], vazio: false, total: 16 });

    expect(screen.getByText("Coca-Cola")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("+ e − de bebida chamam alterarQtdBebida com o delta certo", () => {
    const alterarQtdBebida = vi.fn();
    renderCarrinho({ ...CONTEXTO_VAZIO, bebidas: [BEBIDA], vazio: false, total: 16, alterarQtdBebida });

    fireEvent.click(screen.getByText("+"));
    fireEvent.click(screen.getByText("−"));

    expect(alterarQtdBebida).toHaveBeenCalledWith(5, 1);
    expect(alterarQtdBebida).toHaveBeenCalledWith(5, -1);
  });

  it("remover bebida chama removerBebida com o item_simples_id", () => {
    const removerBebida = vi.fn();
    renderCarrinho({ ...CONTEXTO_VAZIO, bebidas: [BEBIDA], vazio: false, total: 16, removerBebida });

    fireEvent.click(screen.getByText("Remover"));

    expect(removerBebida).toHaveBeenCalledWith(5);
  });

  it("mostra o total formatado", () => {
    renderCarrinho({ ...CONTEXTO_VAZIO, itens: [ITEM], vazio: false, total: 123.4 });
    expect(screen.getByText("R$ 123,40")).toBeInTheDocument();
  });

  it("botão continuar leva pra tela de endereço/pagamento", () => {
    renderCarrinho({ ...CONTEXTO_VAZIO, itens: [ITEM], vazio: false, total: 40 });
    expect(screen.getByText("Continuar para entrega")).toBeInTheDocument();
  });
});
