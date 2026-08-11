import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdminProdutos } from "../../../src/pages/Admin/Produtos";

vi.mock("../../../src/api/auth", () => ({
  listar_todos_produtos: vi.fn(),
  listar_categoria: vi.fn(),
  deletar_sabor: vi.fn(),
  toggle_status_produto: vi.fn(),
  listar_monte_pizza: vi.fn(),
  deletar_monte_pizza: vi.fn(),
  toggle_status_monte_pizza: vi.fn(),
}));

import * as api from "../../../src/api/auth";

const CATEGORIAS = [{ id: 1, nome: "Pizzas Salgadas" }];
const PRODUTOS = [
  { id: 10, nome: "Calabresa", descricao: "Molho e calabresa", ativo: true, categoria_id: 1, imagem_url: null },
  { id: 11, nome: "Marguerita", descricao: "Molho e muçarela", ativo: false, categoria_id: 1, imagem_url: null },
];
const MONTE_PIZZAS = [
  { id: 1, nome: "MSP Grande", tamanho_nome: "Grande", qtd_sabores_efetiva: 2, qtd_sabores_override: null, sabores: [{ id: 1 }], ativo: true },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.listar_todos_produtos.mockResolvedValue(PRODUTOS);
  api.listar_categoria.mockResolvedValue(CATEGORIAS);
  api.listar_monte_pizza.mockResolvedValue(MONTE_PIZZAS);
  api.deletar_sabor.mockResolvedValue({ mensagem: "ok" });
  api.deletar_monte_pizza.mockResolvedValue({ mensagem: "ok" });
  api.toggle_status_produto.mockResolvedValue({ ativo: false });
  api.toggle_status_monte_pizza.mockResolvedValue({ ativo: false });
  vi.spyOn(window, "alert").mockImplementation(() => {});
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

async function renderPagina() {
  render(
    <MemoryRouter>
      <AdminProdutos />
    </MemoryRouter>
  );
  await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());
}

describe("AdminProdutos - aba Pizzas", () => {
  it("lista as pizzas com o resumo de ativos/inativos", async () => {
    await renderPagina();

    expect(screen.getByText("2 produto(s)")).toBeInTheDocument();
    expect(screen.getByText("1 ativos")).toBeInTheDocument();
    expect(screen.getByText("1 inativos")).toBeInTheDocument();
  });

  it("filtra por nome", async () => {
    await renderPagina();

    fireEvent.change(screen.getByPlaceholderText("Buscar por nome..."), { target: { value: "margue" } });

    expect(screen.queryByText("Calabresa")).not.toBeInTheDocument();
    expect(screen.getByText("Marguerita")).toBeInTheDocument();
  });

  it("toggle de status chama a API e atualiza o botão", async () => {
    await renderPagina();

    fireEvent.click(screen.getByText("Ativo"));

    await waitFor(() => expect(api.toggle_status_produto).toHaveBeenCalledWith(10));
    await waitFor(() => expect(screen.getAllByText("Inativo")).toHaveLength(2));
  });

  it("excluir pede confirmação e, se confirmado, chama a API e remove da lista", async () => {
    await renderPagina();

    fireEvent.click(screen.getAllByText("Excluir")[0]);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(api.deletar_sabor).toHaveBeenCalledWith(10));
    await waitFor(() => expect(screen.queryByText("Calabresa")).not.toBeInTheDocument());
  });

  it("excluir cancelado não chama a API", async () => {
    window.confirm.mockReturnValue(false);
    await renderPagina();

    fireEvent.click(screen.getAllByText("Excluir")[0]);

    expect(api.deletar_sabor).not.toHaveBeenCalled();
    expect(screen.getByText("Calabresa")).toBeInTheDocument();
  });
});

describe("AdminProdutos - aba Monte Sua Pizza", () => {
  it("troca de aba busca e lista os Monte Sua Pizza", async () => {
    await renderPagina();

    fireEvent.click(screen.getByText("Monte Sua Pizza"));

    await waitFor(() => expect(screen.getByText("MSP Grande")).toBeInTheDocument());
    expect(screen.getByText("Grande")).toBeInTheDocument();
    expect(api.listar_monte_pizza).toHaveBeenCalled();
  });

  it("mostra se a quantidade de sabores é customizada ou padrão do tamanho", async () => {
    await renderPagina();
    fireEvent.click(screen.getByText("Monte Sua Pizza"));
    await waitFor(() => expect(screen.getByText("MSP Grande")).toBeInTheDocument());

    expect(screen.getByText(/padrão do tamanho/)).toBeInTheDocument();
  });
});
