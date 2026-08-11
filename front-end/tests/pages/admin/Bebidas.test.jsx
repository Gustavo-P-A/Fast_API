import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdminBebidas } from "../../../src/pages/Admin/Bebidas";

vi.mock("../../../src/api/auth", () => ({
  listar_item_simples: vi.fn(),
  toggle_status_item_simples: vi.fn(),
  deletar_item_simples: vi.fn(),
  listar_categoria: vi.fn(),
}));

import * as api from "../../../src/api/auth";

const CATEGORIAS = [{ id: 1, nome: "Refrigerantes" }];
const BEBIDAS = [
  { id: 1, nome: "Coca-Cola", preco: 8, ativo: true, categoria_id: 1, imagem_url: null },
  { id: 2, nome: "Suco Inativo", preco: 6, ativo: false, categoria_id: 1, imagem_url: null },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.listar_item_simples.mockResolvedValue(BEBIDAS);
  api.listar_categoria.mockResolvedValue(CATEGORIAS);
  api.toggle_status_item_simples.mockResolvedValue({ ativo: false });
  api.deletar_item_simples.mockResolvedValue({});
  vi.spyOn(window, "alert").mockImplementation(() => {});
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

async function renderPagina() {
  render(<MemoryRouter><AdminBebidas /></MemoryRouter>);
  await waitFor(() => expect(screen.getByText("Coca-Cola")).toBeInTheDocument());
}

describe("AdminBebidas", () => {
  it("busca bebidas e categorias, lista com o resumo", async () => {
    await renderPagina();

    expect(api.listar_item_simples).toHaveBeenCalledWith("BEBIDA");
    expect(screen.getByText("2 bebida(s)")).toBeInTheDocument();
    expect(screen.getByText("1 ativas")).toBeInTheDocument();
    expect(screen.getByText("1 inativas")).toBeInTheDocument();
  });

  it("filtra por nome", async () => {
    await renderPagina();
    fireEvent.change(screen.getByPlaceholderText("Buscar por nome..."), { target: { value: "suco" } });

    expect(screen.queryByText("Coca-Cola")).not.toBeInTheDocument();
    expect(screen.getByText("Suco Inativo")).toBeInTheDocument();
  });

  it("filtra por status", async () => {
    await renderPagina();
    fireEvent.change(screen.getByDisplayValue("Todos"), { target: { value: "inativo" } });

    expect(screen.queryByText("Coca-Cola")).not.toBeInTheDocument();
    expect(screen.getByText("Suco Inativo")).toBeInTheDocument();
  });

  it("botão Limpar reseta os filtros", async () => {
    await renderPagina();
    fireEvent.change(screen.getByPlaceholderText("Buscar por nome..."), { target: { value: "suco" } });

    fireEvent.click(screen.getByText("Limpar"));

    expect(screen.getByText("2 bebida(s)")).toBeInTheDocument();
  });

  it("toggle de status chama a API e atualiza a linha", async () => {
    await renderPagina();

    fireEvent.click(screen.getByText("Ativo"));

    await waitFor(() => expect(api.toggle_status_item_simples).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.getAllByText("Inativo")).toHaveLength(2));
  });

  it("excluir pede confirmação e remove da lista", async () => {
    await renderPagina();

    fireEvent.click(screen.getAllByText("Excluir")[0]);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(api.deletar_item_simples).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText("Coca-Cola")).not.toBeInTheDocument());
  });

  it("excluir cancelado não chama a API", async () => {
    window.confirm.mockReturnValue(false);
    await renderPagina();

    fireEvent.click(screen.getAllByText("Excluir")[0]);

    expect(api.deletar_item_simples).not.toHaveBeenCalled();
  });
});
