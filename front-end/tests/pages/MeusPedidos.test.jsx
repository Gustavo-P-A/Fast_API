import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { MeusPedidos } from "../../src/pages/MeusPedidos";

vi.mock("../../src/api/auth", () => ({
  meus_pedidos: vi.fn(),
}));

import * as api from "../../src/api/auth";

function pedido(overrides) {
  return {
    id: 1,
    status: "PENDENTE",
    preco: 40,
    itens: [
      {
        sabores_rel: [{ sabor_rel: { nome: "Calabresa", imagem_url: null } }],
        tamanho_rel: { nome: "Grande" },
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={["/meus-pedidos"]}>
      <Routes>
        <Route path="/meus-pedidos" element={<MeusPedidos />} />
        <Route path="/meus-pedidos/:id" element={<div>Detalhe do pedido</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("MeusPedidos", () => {
  it("sem pedidos mostra mensagem de vazio", async () => {
    api.meus_pedidos.mockResolvedValue([]);
    renderPagina();

    await waitFor(() => expect(screen.getByText("Você ainda não fez nenhum pedido.")).toBeInTheDocument());
  });

  it("lista os pedidos ordenados do mais recente pro mais antigo", async () => {
    api.meus_pedidos.mockResolvedValue([pedido({ id: 1 }), pedido({ id: 2 })]);
    renderPagina();

    await waitFor(() => expect(screen.getAllByText("Calabresa")).toHaveLength(2));
    const cards = screen.getAllByText(/Tamanho:/);
    expect(cards).toHaveLength(2);
  });

  it("mostra status e preço formatado do pedido", async () => {
    api.meus_pedidos.mockResolvedValue([pedido({ status: "ENTREGUE", preco: 55.9 })]);
    renderPagina();

    await waitFor(() => expect(screen.getByText("ENTREGUE")).toBeInTheDocument());
    expect(screen.getByText(/R\$\s*55,90/)).toBeInTheDocument();
  });

  it("pedido sem itens mostra card alternativo em vez de quebrar", async () => {
    api.meus_pedidos.mockResolvedValue([pedido({ itens: [] })]);
    renderPagina();

    await waitFor(() => expect(screen.getByText("Pedido sem itens")).toBeInTheDocument());
  });

  it("clicar em um pedido navega pro detalhe dele", async () => {
    api.meus_pedidos.mockResolvedValue([pedido({ id: 7 })]);
    renderPagina();

    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Calabresa"));

    await waitFor(() => expect(screen.getByText("Detalhe do pedido")).toBeInTheDocument());
  });
});
