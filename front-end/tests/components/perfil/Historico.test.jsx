import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Historico } from "../../../src/components/perfil/Historico";

vi.mock("../../../src/api/auth", () => ({
  meus_pedidos: vi.fn(),
}));

import * as api from "../../../src/api/auth";

function pedido(overrides) {
  return {
    id: 1,
    status: "ENTREGUE",
    formato_de_pagamento: "Pix",
    preco: 45.9,
    created_at: "2026-01-10T18:00:00",
    endereco_rel: null,
    itens: [
      {
        id: 1, quantidade: 1, observacoes: null,
        sabores_rel: [{ sabor_rel: { nome: "Calabresa" } }],
        tamanho_rel: { nome: "Grande" },
        adicionais_rel: [], ingredientes_rel: [],
      },
    ],
    bebidas_rel: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Historico", () => {
  it("busca e lista os pedidos finalizados, mais recente primeiro", async () => {
    api.meus_pedidos.mockResolvedValue([
      pedido({ id: 1, created_at: "2026-01-10T18:00:00" }),
      pedido({ id: 2, created_at: "2026-01-15T18:00:00" }),
    ]);
    render(<Historico />);

    await waitFor(() => expect(screen.getByText("Pedido #2")).toBeInTheDocument());
    const ids = screen.getAllByText(/Pedido #/).map(el => el.textContent);
    expect(ids).toEqual(["Pedido #2", "Pedido #1"]);
  });

  it("carrinho aberto (PENDENTE sem forma de pagamento) não entra no histórico", async () => {
    api.meus_pedidos.mockResolvedValue([
      pedido({ id: 1, status: "PENDENTE", formato_de_pagamento: null }),
      pedido({ id: 2, status: "ENTREGUE" }),
    ]);
    render(<Historico />);

    await waitFor(() => expect(screen.getByText("Pedido #2")).toBeInTheDocument());
    expect(screen.queryByText("Pedido #1")).not.toBeInTheDocument();
  });

  it("pedido em preparo (PENDENTE mas já com pagamento) aparece como 'Em andamento'", async () => {
    api.meus_pedidos.mockResolvedValue([pedido({ status: "PENDENTE", formato_de_pagamento: "Pix" })]);
    render(<Historico />);

    await waitFor(() => expect(screen.getByText("Em andamento")).toBeInTheDocument());
  });

  it("sem pedidos mostra mensagem de vazio", async () => {
    api.meus_pedidos.mockResolvedValue([]);
    render(<Historico />);

    await waitFor(() => expect(screen.getByText("Você ainda não fez nenhum pedido.")).toBeInTheDocument());
  });

  it("erro ao carregar mostra mensagem alternativa", async () => {
    api.meus_pedidos.mockRejectedValue(new Error("falhou"));
    render(<Historico />);

    await waitFor(() => expect(screen.getByText("Não foi possível carregar seus pedidos.")).toBeInTheDocument());
  });

  it("clicar no pedido expande os detalhes; clicar de novo recolhe", async () => {
    api.meus_pedidos.mockResolvedValue([pedido()]);
    render(<Historico />);
    await waitFor(() => expect(screen.getByText("Pedido #1")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Pedido #1"));
    expect(screen.getByText("Pix")).toBeInTheDocument();
    expect(screen.getByText(/Grande — Calabresa/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Pedido #1"));
    expect(screen.queryByText("Pix")).not.toBeInTheDocument();
  });

  it("mostra adicionais e ingredientes extras do item quando expandido", async () => {
    api.meus_pedidos.mockResolvedValue([
      pedido({
        itens: [{
          id: 1, quantidade: 1, observacoes: "sem cebola",
          sabores_rel: [{ sabor_rel: { nome: "Calabresa" } }],
          tamanho_rel: { nome: "Grande" },
          adicionais_rel: [{ preco_adicional_rel: { adicional_rel: { nome: "Catupiry" } } }],
          ingredientes_rel: [{ quantidade: 2, item_simples_rel: { nome: "Bacon" } }],
        }],
      }),
    ]);
    render(<Historico />);
    await waitFor(() => expect(screen.getByText("Pedido #1")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Pedido #1"));

    expect(screen.getByText(/Catupiry/)).toBeInTheDocument();
    expect(screen.getByText(/2x Bacon/)).toBeInTheDocument();
    expect(screen.getByText("Obs: sem cebola")).toBeInTheDocument();
  });

  it("mostra bebidas do pedido quando expandido", async () => {
    api.meus_pedidos.mockResolvedValue([
      pedido({ itens: [], bebidas_rel: [{ quantidade: 2, item_simples_rel: { nome: "Coca-Cola" } }] }),
    ]);
    render(<Historico />);
    await waitFor(() => expect(screen.getByText("Pedido #1")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Pedido #1"));

    expect(screen.getByText("2x Coca-Cola")).toBeInTheDocument();
  });

  it("resumo mostra '+N item(ns)' quando há mais de um item/bebida", async () => {
    api.meus_pedidos.mockResolvedValue([
      pedido({ bebidas_rel: [{ quantidade: 1, item_simples_rel: { nome: "Coca-Cola" } }] }),
    ]);
    render(<Historico />);

    await waitFor(() => expect(screen.getByText(/Calabresa \+ 1 item\(ns\)/)).toBeInTheDocument());
  });
});
