import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminClientes } from "../../../src/pages/Admin/Clientes";

vi.mock("../../../src/api/auth", () => ({
  listar_clientes_admin: vi.fn(),
  pedidos_do_cliente: vi.fn(),
}));

import * as api from "../../../src/api/auth";

const CLIENTES = [
  { id: 1, nome: "Maria Silva", email: "maria@teste.com", total_pedidos: 3, gasto_total: 120.5, ativo: true },
  { id: 2, nome: "João Souza", email: "joao@teste.com", total_pedidos: 1, gasto_total: 40, ativo: false },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.listar_clientes_admin.mockResolvedValue(CLIENTES);
  api.pedidos_do_cliente.mockResolvedValue([]);
});

async function renderPagina() {
  render(<AdminClientes />);
  await waitFor(() => expect(screen.getByText("Maria Silva")).toBeInTheDocument());
}

describe("AdminClientes", () => {
  it("carrega e lista os clientes com seus totais", async () => {
    await renderPagina();

    expect(screen.getByText("maria@teste.com")).toBeInTheDocument();
    expect(screen.getByText("João Souza")).toBeInTheDocument();
    expect(screen.getByText("2 cliente(s)")).toBeInTheDocument();
  });

  it("mostra os cards de resumo calculados a partir da lista", async () => {
    await renderPagina();

    expect(screen.getByText("2")).toBeInTheDocument(); // total de clientes
    expect(screen.getByText("R$ 160.50")).toBeInTheDocument(); // faturamento total (120.5 + 40)
  });

  it("filtra por nome ou e-mail", async () => {
    await renderPagina();

    fireEvent.change(screen.getByPlaceholderText("Buscar por nome ou e-mail..."), {
      target: { value: "joao@" },
    });

    expect(screen.queryByText("Maria Silva")).not.toBeInTheDocument();
    expect(screen.getByText("João Souza")).toBeInTheDocument();
    expect(screen.getByText("1 cliente(s)")).toBeInTheDocument();
  });

  it("botão Limpar reseta a busca", async () => {
    await renderPagina();
    const input = screen.getByPlaceholderText("Buscar por nome ou e-mail...");
    fireEvent.change(input, { target: { value: "joao" } });

    fireEvent.click(screen.getByText("Limpar"));

    expect(input.value).toBe("");
    expect(screen.getByText("2 cliente(s)")).toBeInTheDocument();
  });

  it("Ver Pedidos busca e expande os pedidos daquele cliente", async () => {
    api.pedidos_do_cliente.mockResolvedValue([
      { id: 55, status: "ENTREGUE", formato_de_pagamento: "Pix", preco: 45.9 },
    ]);
    await renderPagina();

    fireEvent.click(screen.getAllByText("Ver Pedidos")[0]);

    expect(api.pedidos_do_cliente).toHaveBeenCalledWith(1);
    await waitFor(() => expect(screen.getByText("#55")).toBeInTheDocument());
    expect(screen.getByText("Pedidos de Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("R$ 45.90")).toBeInTheDocument();
  });

  it("clicar de novo em Fechar recolhe os pedidos", async () => {
    await renderPagina();

    fireEvent.click(screen.getAllByText("Ver Pedidos")[0]);
    await waitFor(() => expect(screen.getByText("Fechar")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Fechar"));

    expect(screen.queryByText("Pedidos de Maria Silva")).not.toBeInTheDocument();
  });

  it("cliente sem nenhum pedido mostra mensagem de vazio", async () => {
    api.pedidos_do_cliente.mockResolvedValue([]);
    await renderPagina();

    fireEvent.click(screen.getAllByText("Ver Pedidos")[0]);

    await waitFor(() => expect(screen.getByText("Nenhum pedido encontrado.")).toBeInTheDocument());
  });
});
