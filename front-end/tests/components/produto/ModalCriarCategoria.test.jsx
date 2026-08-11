import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ModalCriarCategoria } from "../../../src/components/produto/ModalCriarCategoria";

vi.mock("../../../src/api/auth", () => ({
  criar_categoria: vi.fn(),
  editar_categoria: vi.fn(),
}));

import * as api from "../../../src/api/auth";

beforeEach(() => {
  vi.clearAllMocks();
  api.criar_categoria.mockResolvedValue({});
  api.editar_categoria.mockResolvedValue({});
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

describe("ModalCriarCategoria - criação", () => {
  it("mostra 'Nova Categoria' com campo vazio", () => {
    render(<ModalCriarCategoria categoriaEditando={null} onCriado={vi.fn()} onCancelar={vi.fn()} />);
    expect(screen.getByText("Nova Categoria")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex: Salgados").value).toBe("");
  });

  it("salvar sem nome mostra alerta e não chama a API", () => {
    render(<ModalCriarCategoria categoriaEditando={null} onCriado={vi.fn()} onCancelar={vi.fn()} />);
    fireEvent.click(screen.getByText("Criar"));
    expect(window.alert).toHaveBeenCalledWith("Informe o nome da categoria.");
    expect(api.criar_categoria).not.toHaveBeenCalled();
  });

  it("salvar com nome cria a categoria e chama onCriado", async () => {
    const onCriado = vi.fn();
    render(<ModalCriarCategoria categoriaEditando={null} onCriado={onCriado} onCancelar={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Ex: Salgados"), { target: { value: "Sobremesas" } });
    fireEvent.click(screen.getByText("Criar"));

    await waitFor(() => expect(api.criar_categoria).toHaveBeenCalledWith("Sobremesas"));
    expect(onCriado).toHaveBeenCalled();
  });

  it("cancelar chama onCancelar", () => {
    const onCancelar = vi.fn();
    render(<ModalCriarCategoria categoriaEditando={null} onCriado={vi.fn()} onCancelar={onCancelar} />);
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onCancelar).toHaveBeenCalled();
  });

  it("erro ao criar mostra alerta específico", async () => {
    api.criar_categoria.mockRejectedValue(new Error("falhou"));
    render(<ModalCriarCategoria categoriaEditando={null} onCriado={vi.fn()} onCancelar={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Ex: Salgados"), { target: { value: "Sobremesas" } });
    fireEvent.click(screen.getByText("Criar"));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Erro ao criar categoria."));
  });
});

describe("ModalCriarCategoria - edição", () => {
  const CATEGORIA = { id: 3, nome: "Pizzas Salgadas" };

  it("mostra 'Editar Categoria' com o nome preenchido", () => {
    render(<ModalCriarCategoria categoriaEditando={CATEGORIA} onCriado={vi.fn()} onCancelar={vi.fn()} />);
    expect(screen.getByText("Editar Categoria")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Pizzas Salgadas")).toBeInTheDocument();
  });

  it("salvar chama editar_categoria com o id certo", async () => {
    render(<ModalCriarCategoria categoriaEditando={CATEGORIA} onCriado={vi.fn()} onCancelar={vi.fn()} />);

    fireEvent.change(screen.getByDisplayValue("Pizzas Salgadas"), { target: { value: "Pizzas Especiais" } });
    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => expect(api.editar_categoria).toHaveBeenCalledWith(3, "Pizzas Especiais"));
    expect(api.criar_categoria).not.toHaveBeenCalled();
  });

  it("erro ao editar mostra alerta específico", async () => {
    api.editar_categoria.mockRejectedValue(new Error("falhou"));
    render(<ModalCriarCategoria categoriaEditando={CATEGORIA} onCriado={vi.fn()} onCancelar={vi.fn()} />);

    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Erro ao editar categoria."));
  });
});
