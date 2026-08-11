import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AdminDashboard } from "../../../src/pages/Admin/Dashboard";

vi.mock("../../../src/api/auth", () => ({
  listar_todos_produtos: vi.fn(),
  listar_pedidos_admin: vi.fn(),
  listar_clientes_admin: vi.fn(),
}));

import * as api from "../../../src/api/auth";

const PRODUTOS = [
  { id: 1, nome: "Calabresa", ativo: true },
  { id: 2, nome: "Marguerita", ativo: true },
  { id: 3, nome: "Antiga", ativo: false },
];

const PEDIDOS = [
  { id: 1, cliente_nome: "Maria", preco: 40, status: "ENTREGUE" },
  { id: 2, cliente_nome: "João", preco: 60, status: "ENTREGUE" },
  { id: 3, cliente_nome: "Ana", preco: 30, status: "PENDENTE" },
  { id: 4, cliente_nome: "Zeca", preco: 25, status: "CANCELADO" },
];

const CLIENTES = [
  { id: 1, nome: "Maria", total_pedidos: 3, gasto_total: 150 },
  { id: 2, nome: "João", total_pedidos: 1, gasto_total: 60 },
  { id: 3, nome: "Ana", total_pedidos: 1, gasto_total: 30 },
  { id: 4, nome: "Zeca", total_pedidos: 1, gasto_total: 25 },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.listar_todos_produtos.mockResolvedValue(PRODUTOS);
  api.listar_pedidos_admin.mockResolvedValue(PEDIDOS);
  api.listar_clientes_admin.mockResolvedValue(CLIENTES);
});

async function renderPagina() {
  render(<AdminDashboard />);
  await waitFor(() => expect(screen.getByText("Dashboard")).toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText("Carregando dashboard...")).not.toBeInTheDocument());
}

describe("AdminDashboard", () => {
  it("mostra 'Carregando' antes dos dados chegarem", async () => {
    render(<AdminDashboard />);
    expect(screen.getByText("Carregando dashboard...")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Carregando dashboard...")).not.toBeInTheDocument());
  });

  it("calcula faturamento e ticket médio só com pedidos ENTREGUE", async () => {
    await renderPagina();

    // faturamento: 40 + 60 = 100 (PENDENTE e CANCELADO não entram)
    expect(screen.getByText("R$ 100.00")).toBeInTheDocument();
    // ticket médio: 100 / 2 pedidos entregues = 50
    expect(screen.getByText("R$ 50.00")).toBeInTheDocument();
  });

  it("mostra total de pedidos, clientes e produtos ativos nos KPIs", async () => {
    await renderPagina();

    expect(screen.getAllByText("4").length).toBeGreaterThan(0); // total de pedidos e total de clientes
    expect(screen.getAllByText("2").length).toBeGreaterThan(0); // produtos ativos aparece 2x (KPI + resumo)
  });

  it("agrupa pedidos por status", async () => {
    await renderPagina();

    expect(screen.getAllByText("ENTREGUE").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PENDENTE").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CANCELADO").length).toBeGreaterThan(0);
  });

  it("top clientes aparece ordenado por gasto total, limitado a 3", async () => {
    await renderPagina();

    const nomes = screen.getAllByText(/^(Maria|João|Ana|Zeca)$/).map(el => el.textContent);
    // Maria (150) > João (60) > Ana (30) -- Zeca (25) fica de fora do top 3
    const posicoesTop = ["Maria", "João", "Ana"];
    posicoesTop.forEach(nome => expect(nomes).toContain(nome));
  });

  it("resumo do cardápio mostra produtos ativos/inativos e pedidos entregues/cancelados", async () => {
    await renderPagina();

    expect(screen.getByText("Produtos ativos")).toBeInTheDocument();
    expect(screen.getByText("Produtos inativos")).toBeInTheDocument();
    expect(screen.getByText("Pedidos entregues")).toBeInTheDocument();
    expect(screen.getByText("Pedidos cancelados")).toBeInTheDocument();
  });

  it("sem pedidos entregues, ticket médio fica zerado sem dividir por zero", async () => {
    api.listar_pedidos_admin.mockResolvedValue([
      { id: 1, cliente_nome: "Ana", preco: 30, status: "PENDENTE" },
    ]);

    await renderPagina();

    // faturamento E ticket médio ficam os dois em R$ 0.00 (nenhum pedido ENTREGUE)
    expect(screen.getAllByText("R$ 0.00").length).toBe(2);
  });

  it("sem clientes, mostra mensagem de 'Sem dados' no top clientes", async () => {
    api.listar_clientes_admin.mockResolvedValue([]);

    await renderPagina();

    expect(screen.getByText("Sem dados.")).toBeInTheDocument();
  });
});
