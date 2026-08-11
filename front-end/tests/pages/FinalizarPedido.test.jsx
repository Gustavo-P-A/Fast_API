import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FinalizarPedido } from "../../src/pages/FinalizarPedido";
import { CartContext } from "../../src/contexts/CartContext";

vi.mock("../../src/api/auth", () => ({
  criar_pedido: vi.fn(),
  pedido_adicionais: vi.fn(),
  adicionar_adicional: vi.fn(),
  adicionar_ingrediente: vi.fn(),
  adicionar_bebida_pedido: vi.fn(),
  finalizar_pedido_id: vi.fn(),
}));

import * as api from "../../src/api/auth";

const ITEM = {
  id: "item-1",
  tamanho_id: 10,
  sabor_ids: [1],
  sabor_nomes: ["Calabresa"],
  tamanho_nome: "Grande",
  bordas: [],
  ingredientes: [],
  preco_sabor: 40,
  qtd_bordas: 2,
};

const ENDERECO = { id: 1, rua: "Rua das Flores", numero: "10", bairro: "Centro", cidade: "Cianorte", estado: "PR", cep: "87200-000" };

const STATE_VALIDO = { endereco: ENDERECO, pagamento: "Pix" };

function renderPagina({ state = STATE_VALIDO, contexto = {} } = {}) {
  const limparCarrinho = vi.fn();
  const valorContexto = {
    itens: [ITEM], bebidas: [], total: 40, vazio: false, limparCarrinho, ...contexto,
  };
  render(
    <MemoryRouter initialEntries={[{ pathname: "/finalizar-pedido", state }]}>
      <CartContext.Provider value={valorContexto}>
        <FinalizarPedido />
      </CartContext.Provider>
    </MemoryRouter>
  );
  return { limparCarrinho };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.criar_pedido.mockResolvedValue({ id: 99 });
  api.pedido_adicionais.mockResolvedValue({ item_id: 1 });
  api.adicionar_adicional.mockResolvedValue({});
  api.adicionar_ingrediente.mockResolvedValue({});
  api.adicionar_bebida_pedido.mockResolvedValue({});
  api.finalizar_pedido_id.mockResolvedValue({});
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

describe("FinalizarPedido", () => {
  it("mostra o resumo do item, endereço e forma de pagamento", () => {
    renderPagina();

    expect(screen.getByText("Calabresa")).toBeInTheDocument();
    expect(screen.getByText("Tamanho: Grande")).toBeInTheDocument();
    expect(screen.getByText(/Rua das Flores, 10/)).toBeInTheDocument();
    expect(screen.getByText("Pix")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 40,00").length).toBeGreaterThan(0);
  });

  it("finalizar envia o pedido: cria, adiciona itens, bebidas e finaliza", async () => {
    const { limparCarrinho } = renderPagina();

    fireEvent.click(screen.getByText("Finalizar e Enviar Pedido"));

    await waitFor(() => expect(api.finalizar_pedido_id).toHaveBeenCalledWith(99, 1, "Pix"));
    expect(api.criar_pedido).toHaveBeenCalled();
    expect(api.pedido_adicionais).toHaveBeenCalledWith(99, { tamanho_id: 10, sabor_ids: [1] });
    expect(limparCarrinho).toHaveBeenCalled();
  });

  it("envia bordas e ingredientes do item antes de finalizar", async () => {
    const itemComExtras = {
      ...ITEM,
      bordas: [{ adicional_id: 5, tamanho_id: 10, partes: 2, nome: "Catupiry" }],
      ingredientes: [{ item_simples_id: 7, quantidade: 2, nome: "Bacon" }],
    };
    renderPagina({ contexto: { itens: [itemComExtras] } });

    fireEvent.click(screen.getByText("Finalizar e Enviar Pedido"));

    await waitFor(() => expect(api.adicionar_adicional).toHaveBeenCalledWith(99, 1, 5, 10, 2));
    expect(api.adicionar_ingrediente).toHaveBeenCalledWith(99, 1, 7, 2);
  });

  it("envia as bebidas do carrinho", async () => {
    renderPagina({ contexto: { bebidas: [{ item_simples_id: 3, quantidade: 2, nome: "Coca-Cola", preco: 8 }] } });

    fireEvent.click(screen.getByText("Finalizar e Enviar Pedido"));

    await waitFor(() => expect(api.adicionar_bebida_pedido).toHaveBeenCalledWith(99, 3, 2));
  });

  it("erro no meio do envio mostra alerta e não limpa o carrinho", async () => {
    api.pedido_adicionais.mockRejectedValue(new Error("falhou"));
    const { limparCarrinho } = renderPagina();

    fireEvent.click(screen.getByText("Finalizar e Enviar Pedido"));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Erro ao enviar pedido. Tente novamente."));
    expect(limparCarrinho).not.toHaveBeenCalled();
  });

  it("carrinho vazio não renderiza a revisão do pedido", () => {
    renderPagina({ contexto: { vazio: true } });
    expect(screen.queryByText("Revise seu pedido")).not.toBeInTheDocument();
  });

  it("sem endereço/pagamento no state não renderiza a revisão do pedido", () => {
    renderPagina({ state: {} });
    expect(screen.queryByText("Revise seu pedido")).not.toBeInTheDocument();
  });
});
