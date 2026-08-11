import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminIngredientes } from "../../../src/pages/Admin/Ingredientes";

vi.mock("../../../src/api/auth", () => ({
  listar_item_simples: vi.fn(),
  toggle_status_item_simples: vi.fn(),
  deletar_item_simples: vi.fn(),
}));

vi.mock("../../../src/components/Ingrediente/ModalIngrediente", () => ({
  ModalIngrediente: ({ ingrediente, onSalvo, onCancelar }) => (
    <div>
      <span>Modal {ingrediente ? `editar ${ingrediente.nome}` : "novo ingrediente"}</span>
      <button onClick={onSalvo}>Salvar (mock)</button>
      <button onClick={onCancelar}>Fechar (mock)</button>
    </div>
  ),
}));

import * as api from "../../../src/api/auth";

const INGREDIENTES = [
  { id: 1, nome: "Bacon Extra", preco: 6, ativo: true },
  { id: 2, nome: "Cebola Inativa", preco: 2, ativo: false },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.listar_item_simples.mockResolvedValue(INGREDIENTES);
  api.toggle_status_item_simples.mockResolvedValue({ ativo: false });
  api.deletar_item_simples.mockResolvedValue({});
  vi.spyOn(window, "alert").mockImplementation(() => {});
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

async function renderPagina() {
  render(<AdminIngredientes />);
  await waitFor(() => expect(screen.getByText("Bacon Extra")).toBeInTheDocument());
}

describe("AdminIngredientes", () => {
  it("busca ingredientes e lista com o resumo", async () => {
    await renderPagina();

    expect(api.listar_item_simples).toHaveBeenCalledWith("INGREDIENTE");
    expect(screen.getByText("2 ingrediente(s)")).toBeInTheDocument();
    expect(screen.getByText("1 ativos")).toBeInTheDocument();
    expect(screen.getByText("1 inativos")).toBeInTheDocument();
  });

  it("filtra por nome e por status", async () => {
    await renderPagina();
    fireEvent.change(screen.getByPlaceholderText("Buscar por nome..."), { target: { value: "cebola" } });
    expect(screen.getByText("Cebola Inativa")).toBeInTheDocument();
    expect(screen.queryByText("Bacon Extra")).not.toBeInTheDocument();
  });

  it("+ Novo Adicional abre o modal em modo criação", async () => {
    await renderPagina();
    fireEvent.click(screen.getByText("+ Novo Adicional"));
    expect(screen.getByText("Modal novo ingrediente")).toBeInTheDocument();
  });

  it("Editar abre o modal com o ingrediente escolhido", async () => {
    await renderPagina();
    fireEvent.click(screen.getAllByText("Editar")[0]);
    expect(screen.getByText("Modal editar Bacon Extra")).toBeInTheDocument();
  });

  it("salvar no modal fecha e recarrega a lista", async () => {
    await renderPagina();
    fireEvent.click(screen.getByText("+ Novo Adicional"));

    fireEvent.click(screen.getByText("Salvar (mock)"));

    await waitFor(() => expect(api.listar_item_simples).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/Modal/)).not.toBeInTheDocument();
  });

  it("toggle de status chama a API", async () => {
    await renderPagina();
    fireEvent.click(screen.getByText("Ativo"));
    await waitFor(() => expect(api.toggle_status_item_simples).toHaveBeenCalledWith(1));
  });

  it("excluir pede confirmação e chama a API", async () => {
    await renderPagina();
    fireEvent.click(screen.getAllByText("Excluir")[0]);
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(api.deletar_item_simples).toHaveBeenCalledWith(1));
  });
});
