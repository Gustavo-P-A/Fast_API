import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminPedidos } from "../../../src/pages/Admin/Pedidos";

vi.mock("../../../src/api/auth", () => ({
  listar_pedidos_admin: vi.fn(),
  mudar_status_pedido: vi.fn(),
}));

import * as api from "../../../src/api/auth";

const PEDIDOS = [
  { id: 1, cliente_nome: "Maria", cliente_email: "maria@teste.com", total_itens: 2, formato_de_pagamento: "Pix", preco: 45.9, status: "PENDENTE" },
  { id: 2, cliente_nome: "João", cliente_email: "joao@teste.com", total_itens: 1, formato_de_pagamento: "Dinheiro", preco: 20, status: "ENTREGUE" },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.listar_pedidos_admin.mockResolvedValue(PEDIDOS);
  api.mudar_status_pedido.mockResolvedValue({ mensagem: "ok" });
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

async function renderPagina() {
  render(<AdminPedidos />);
  await waitFor(() => expect(screen.getByText("Maria")).toBeInTheDocument());
}

describe("AdminPedidos", () => {
  it("lista os pedidos com dados do cliente", async () => {
    await renderPagina();

    expect(screen.getByText("maria@teste.com")).toBeInTheDocument();
    expect(screen.getByText("2 item(s)")).toBeInTheDocument();
    expect(screen.getByText("R$ 45.90")).toBeInTheDocument();
  });

  it("clicar no card de status filtra e busca de novo na API", async () => {
    await renderPagina();

    fireEvent.click(screen.getByRole("button", { name: /^\d+ENTREGUE$/ }));

    await waitFor(() => expect(api.listar_pedidos_admin).toHaveBeenLastCalledWith("ENTREGUE"));
  });

  it("clicar de novo no mesmo card de status remove o filtro", async () => {
    await renderPagina();
    const cardEntregue = screen.getByRole("button", { name: /^\d+ENTREGUE$/ });

    fireEvent.click(cardEntregue);
    await waitFor(() => expect(api.listar_pedidos_admin).toHaveBeenLastCalledWith("ENTREGUE"));

    fireEvent.click(cardEntregue);
    await waitFor(() => expect(api.listar_pedidos_admin).toHaveBeenLastCalledWith(""));
  });

  it("botão de avançar status mostra o próximo da fila e chama a API", async () => {
    await renderPagina();

    // pedido 1 está PENDENTE -> próximo é CONFIRMADO
    fireEvent.click(screen.getByText("→ CONFIRMADO"));

    await waitFor(() => expect(api.mudar_status_pedido).toHaveBeenCalledWith(1, "CONFIRMADO"));
  });

  it("pedido ENTREGUE não mostra botão de avançar nem cancelar", async () => {
    await renderPagina();

    // a linha do João (ENTREGUE) não deve ter nenhum botão de ação
    const linhaJoao = screen.getByText("João").closest("tr");
    expect(linhaJoao.querySelector(".ped-btn-primary")).not.toBeInTheDocument();
    expect(linhaJoao.querySelector(".ped-btn-delete")).not.toBeInTheDocument();
  });

  it("botão Cancelar chama a API com status CANCELADO", async () => {
    await renderPagina();

    fireEvent.click(screen.getByText("Cancelar"));

    await waitFor(() => expect(api.mudar_status_pedido).toHaveBeenCalledWith(1, "CANCELADO"));
  });

  it("erro ao mudar status mostra o alerta com a mensagem da API", async () => {
    api.mudar_status_pedido.mockRejectedValue({ response: { data: { detail: "Não é possível cancelar." } } });
    await renderPagina();

    fireEvent.click(screen.getByText("Cancelar"));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Não é possível cancelar."));
  });

  it("filtro por select também dispara nova busca", async () => {
    await renderPagina();

    fireEvent.change(screen.getByDisplayValue("Todos os status"), { target: { value: "CANCELADO" } });

    await waitFor(() => expect(api.listar_pedidos_admin).toHaveBeenLastCalledWith("CANCELADO"));
  });
});
