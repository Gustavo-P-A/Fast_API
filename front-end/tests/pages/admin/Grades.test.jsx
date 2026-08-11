import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { AdminGrades } from "../../../src/pages/Admin/Grades";

vi.mock("../../../src/api/auth", () => ({
  listar_todos_produtos: vi.fn(),
  listar_categoria: vi.fn(),
  listar_grade: vi.fn(),
  listar_produtos_por_grade: vi.fn(),
  mover_produtos_grade: vi.fn(),
  listar_monte_pizza: vi.fn(),
  listar_item_simples: vi.fn(),
}));

import * as api from "../../../src/api/auth";

const CATEGORIAS = [{ id: 1, nome: "Pizzas Salgadas" }];
const GRADES = [
  { id: 1, nome: "Segunda", posicao: 2 },
  { id: 2, nome: "Primeira", posicao: 1 },
];
const PRODUTOS = [
  { id: 10, nome: "Calabresa", ativo: true, categoria_id: 1, imagem_url: null },
  { id: 11, nome: "Marguerita Inativa", ativo: false, categoria_id: 1, imagem_url: null },
];
const PREVIEW = [];

function mockRespostasPadrao() {
  api.listar_todos_produtos.mockResolvedValue(PRODUTOS);
  api.listar_categoria.mockResolvedValue(CATEGORIAS);
  api.listar_grade.mockResolvedValue(GRADES);
  api.listar_produtos_por_grade.mockResolvedValue(PREVIEW);
  api.listar_monte_pizza.mockResolvedValue([]);
  api.listar_item_simples.mockResolvedValue([]);
  api.mover_produtos_grade.mockResolvedValue({ mensagem: "ok" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRespostasPadrao();
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

async function renderPagina() {
  render(<AdminGrades />);
  await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());
}

describe("AdminGrades", () => {
  it("busca tudo em paralelo e lista os produtos", async () => {
    await renderPagina();

    expect(screen.getByText("Calabresa")).toBeInTheDocument();
    expect(screen.getByText("Marguerita Inativa")).toBeInTheDocument();
    expect(screen.getByText("2 produto(s)")).toBeInTheDocument();
  });

  it("ordena as grades por posição antes de listar no seletor de destino", async () => {
    await renderPagina();

    // seleciona um produto pra abrir a barra de movimentação com o <select> de grades
    fireEvent.click(screen.getAllByRole("checkbox")[1]);

    const selects = screen.getAllByRole("combobox");
    const selectGradeDestino = selects[selects.length - 1];
    const opcoes = within(selectGradeDestino).getAllByRole("option").map(o => o.textContent);

    expect(opcoes).toEqual([
      "Mover para grade...",
      "Primeira — Pos. 1",
      "Segunda — Pos. 2",
    ]);
  });

  it("filtro por nome esconde produtos que não combinam", async () => {
    await renderPagina();

    fireEvent.change(screen.getByPlaceholderText("Buscar por nome..."), {
      target: { value: "marguerita" },
    });

    expect(screen.queryByText("Calabresa")).not.toBeInTheDocument();
    expect(screen.getByText("Marguerita Inativa")).toBeInTheDocument();
    expect(screen.getByText("1 produto(s)")).toBeInTheDocument();
  });

  it("filtro por status ativo/inativo funciona", async () => {
    await renderPagina();

    const selects = screen.getAllByRole("combobox");
    const selectStatus = selects.find(s => within(s).queryByText("Ativos"));
    fireEvent.change(selectStatus, { target: { value: "inativo" } });

    expect(screen.queryByText("Calabresa")).not.toBeInTheDocument();
    expect(screen.getByText("Marguerita Inativa")).toBeInTheDocument();
  });

  it("botão Limpar restaura todos os filtros", async () => {
    await renderPagina();

    const inputNome = screen.getByPlaceholderText("Buscar por nome...");
    fireEvent.change(inputNome, { target: { value: "marguerita" } });
    expect(screen.getByText("1 produto(s)")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Limpar"));

    expect(inputNome.value).toBe("");
    expect(screen.getByText("2 produto(s)")).toBeInTheDocument();
  });

  it("barra de movimentação só aparece com algo selecionado", async () => {
    await renderPagina();

    expect(screen.queryByText(/produto\(s\) selecionado\(s\)/)).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("checkbox")[1]);

    expect(screen.getByText("1 produto(s) selecionado(s)")).toBeInTheDocument();
  });

  it("selecionar todos marca todos os produtos filtrados", async () => {
    await renderPagina();

    fireEvent.click(screen.getAllByRole("checkbox")[0]);

    expect(screen.getByText("2 produto(s) selecionado(s)")).toBeInTheDocument();
  });

  it("mover sem escolher grade destino mostra alerta e não chama a API", async () => {
    await renderPagina();
    fireEvent.click(screen.getAllByRole("checkbox")[1]);

    fireEvent.click(screen.getByText("Confirmar"));

    expect(window.alert).toHaveBeenCalledWith("Selecione a grade destino.");
    expect(api.mover_produtos_grade).not.toHaveBeenCalled();
  });

  it("move os selecionados pra grade escolhida e limpa a seleção", async () => {
    await renderPagina();
    fireEvent.click(screen.getAllByRole("checkbox")[1]); // seleciona "Calabresa" (sabor, id 10)

    const selects = screen.getAllByRole("combobox");
    const selectGradeDestino = selects[selects.length - 1];
    fireEvent.change(selectGradeDestino, { target: { value: "2" } });

    fireEvent.click(screen.getByText("Confirmar"));

    await waitFor(() => expect(api.mover_produtos_grade).toHaveBeenCalledWith([10], 2, [], []));
    await waitFor(() => expect(screen.queryByText(/produto\(s\) selecionado\(s\)/)).not.toBeInTheDocument());
  });
});
