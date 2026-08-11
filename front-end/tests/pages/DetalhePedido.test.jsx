import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { DetalhePedido } from "../../src/pages/DetalhePedido";

vi.mock("../../src/api/auth.js", () => ({
  pedido_por_id: vi.fn(),
}));

import * as api from "../../src/api/auth.js";

const PEDIDO = {
  id: 42,
  status: "EM PREPARO",
  created_at: "2026-01-15T18:30:00",
  preco: 55.9,
  formato_de_pagamento: "Pix",
  endereco_rel: { rua: "Rua das Flores", numero: "10", complemento: null, bairro: "Centro", cidade: "Cianorte", estado: "PR", cep: "87200-000" },
  itens: [
    {
      id: 1,
      quantidade: 1,
      observacoes: null,
      sabores_rel: [{ sabor_rel: { nome: "Calabresa", imagem_url: null } }],
      tamanho_rel: { nome: "Grande", qtd_bordas: 2 },
      adicionais_rel: [],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  api.pedido_por_id.mockResolvedValue(PEDIDO);
});

function renderPagina(id = "42") {
  return render(
    <MemoryRouter initialEntries={[`/meus-pedidos/${id}`]}>
      <Routes>
        <Route path="/meus-pedidos/:id" element={<DetalhePedido />} />
        <Route path="/meus-pedidos" element={<div>Lista de pedidos</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("DetalhePedido", () => {
  it("mostra 'Carregando' antes do pedido chegar", async () => {
    renderPagina();
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Pedido #42")).toBeInTheDocument());
  });

  it("busca o pedido pelo id da URL e mostra os dados", async () => {
    renderPagina();

    await waitFor(() => expect(screen.getByText("Pedido #42")).toBeInTheDocument());
    expect(api.pedido_por_id).toHaveBeenCalledWith("42");
    expect(screen.getByText("Calabresa")).toBeInTheDocument();
    expect(screen.getByText("Tamanho: Grande")).toBeInTheDocument();
    expect(screen.getByText("Pix")).toBeInTheDocument();
  });

  it("mostra o endereço de entrega formatado", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText("Pedido #42")).toBeInTheDocument());

    expect(screen.getByText(/Rua das Flores, 10/)).toBeInTheDocument();
  });

  it("sem endereço vinculado mostra mensagem alternativa", async () => {
    api.pedido_por_id.mockResolvedValue({ ...PEDIDO, endereco_rel: null });
    renderPagina();

    await waitFor(() => expect(screen.getByText("Pedido #42")).toBeInTheDocument());
    expect(screen.getByText("Endereço não informado.")).toBeInTheDocument();
  });

  it("mostra o total formatado em reais", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText("Pedido #42")).toBeInTheDocument());

    expect(screen.getByText(/R\$\s*55,90/)).toBeInTheDocument();
  });

  it("pedido cancelado mostra a timeline de cancelado", async () => {
    api.pedido_por_id.mockResolvedValue({ ...PEDIDO, status: "CANCELADO" });
    renderPagina();

    await waitFor(() => expect(screen.getByText("Pedido cancelado")).toBeInTheDocument());
  });

  it("erro ao buscar redireciona pra lista de pedidos", async () => {
    api.pedido_por_id.mockRejectedValue(new Error("404"));
    renderPagina();

    await waitFor(() => expect(screen.getByText("Lista de pedidos")).toBeInTheDocument());
  });
});
