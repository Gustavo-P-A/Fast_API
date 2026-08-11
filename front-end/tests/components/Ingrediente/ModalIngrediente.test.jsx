import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ModalIngrediente } from "../../../src/components/Ingrediente/ModalIngrediente";

vi.mock("../../../src/api/auth", () => ({
  criar_item_simples: vi.fn(),
  editar_item_simples: vi.fn(),
}));

import * as api from "../../../src/api/auth";

beforeEach(() => {
  vi.clearAllMocks();
  api.criar_item_simples.mockResolvedValue({});
  api.editar_item_simples.mockResolvedValue({});
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

describe("ModalIngrediente - criação", () => {
  it("mostra 'Novo Ingrediente' com campos vazios", () => {
    render(<ModalIngrediente ingrediente={null} onSalvo={vi.fn()} onCancelar={vi.fn()} />);
    expect(screen.getByText("Novo Ingrediente")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Mussarela/).value).toBe("");
  });

  it("salvar sem nome mostra alerta", () => {
    render(<ModalIngrediente ingrediente={null} onSalvo={vi.fn()} onCancelar={vi.fn()} />);
    fireEvent.click(screen.getByText("Salvar"));
    expect(window.alert).toHaveBeenCalledWith("Informe o nome do ingrediente.");
    expect(api.criar_item_simples).not.toHaveBeenCalled();
  });

  it("salvar sem preço mostra alerta", () => {
    render(<ModalIngrediente ingrediente={null} onSalvo={vi.fn()} onCancelar={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Mussarela/), { target: { value: "Bacon" } });
    fireEvent.click(screen.getByText("Salvar"));
    expect(window.alert).toHaveBeenCalledWith("Informe o preço.");
  });

  it("salvar com dados válidos cria o item com tipo INGREDIENTE", async () => {
    const onSalvo = vi.fn();
    render(<ModalIngrediente ingrediente={null} onSalvo={onSalvo} onCancelar={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/Mussarela/), { target: { value: "Bacon" } });
    fireEvent.change(screen.getByPlaceholderText("0,00"), { target: { value: "6.5" } });
    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => expect(api.criar_item_simples).toHaveBeenCalledWith({
      tipo: "INGREDIENTE", nome: "Bacon", categoria_id: null, grade_id: null,
      preco: 6.5, descricao: null, ativo: true, imagem_url: null,
    }));
    expect(onSalvo).toHaveBeenCalled();
  });

  it("erro ao salvar mostra alerta", async () => {
    api.criar_item_simples.mockRejectedValue(new Error("falhou"));
    render(<ModalIngrediente ingrediente={null} onSalvo={vi.fn()} onCancelar={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/Mussarela/), { target: { value: "Bacon" } });
    fireEvent.change(screen.getByPlaceholderText("0,00"), { target: { value: "6" } });
    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Erro ao salvar ingrediente."));
  });
});

describe("ModalIngrediente - edição", () => {
  const INGREDIENTE = { id: 3, nome: "Bacon Extra", preco: 6, ativo: false };

  it("campos vêm preenchidos com os dados do ingrediente", () => {
    render(<ModalIngrediente ingrediente={INGREDIENTE} onSalvo={vi.fn()} onCancelar={vi.fn()} />);
    expect(screen.getByText("Editar Ingrediente")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bacon Extra")).toBeInTheDocument();
    expect(screen.getByDisplayValue("6")).toBeInTheDocument();
  });

  it("salvar edição chama editar_item_simples preservando o status ativo atual", async () => {
    render(<ModalIngrediente ingrediente={INGREDIENTE} onSalvo={vi.fn()} onCancelar={vi.fn()} />);

    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => expect(api.editar_item_simples).toHaveBeenCalledWith(3, expect.objectContaining({ ativo: false })));
    expect(api.criar_item_simples).not.toHaveBeenCalled();
  });
});
