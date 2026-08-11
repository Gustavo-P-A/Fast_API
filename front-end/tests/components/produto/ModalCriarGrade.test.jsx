import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ModalCriarGrade } from "../../../src/components/produto/ModalCriarGrade";

vi.mock("../../../src/api/auth", () => ({
  criar_grade: vi.fn(),
  editar_grade: vi.fn(),
}));

import * as api from "../../../src/api/auth";

beforeEach(() => {
  vi.clearAllMocks();
  api.criar_grade.mockResolvedValue({});
  api.editar_grade.mockResolvedValue({});
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

describe("ModalCriarGrade - criação", () => {
  it("mostra 'Nova Grade' com campos vazios", () => {
    render(<ModalCriarGrade gradeEditando={null} onCriado={vi.fn()} onCancelar={vi.fn()} />);
    expect(screen.getByText("Nova Grade")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex: Pizza Salgada").value).toBe("");
  });

  it("salvar sem nome ou posição mostra alerta", () => {
    render(<ModalCriarGrade gradeEditando={null} onCriado={vi.fn()} onCancelar={vi.fn()} />);
    fireEvent.click(screen.getByText("Criar"));
    expect(window.alert).toHaveBeenCalledWith("Preencha todos os campos.");
    expect(api.criar_grade).not.toHaveBeenCalled();
  });

  it("salvar com nome e posição cria a grade com a posição como número", async () => {
    const onCriado = vi.fn();
    render(<ModalCriarGrade gradeEditando={null} onCriado={onCriado} onCancelar={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Ex: Pizza Salgada"), { target: { value: "Destaques" } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: 1/), { target: { value: "0" } });
    fireEvent.click(screen.getByText("Criar"));

    await waitFor(() => expect(api.criar_grade).toHaveBeenCalledWith("Destaques", 0));
    expect(onCriado).toHaveBeenCalled();
  });

  it("posição 0 (topo/promoções) é aceita -- não é tratada como campo vazio", async () => {
    render(<ModalCriarGrade gradeEditando={null} onCriado={vi.fn()} onCancelar={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Ex: Pizza Salgada"), { target: { value: "Promoções" } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: 1/), { target: { value: "0" } });
    fireEvent.click(screen.getByText("Criar"));

    await waitFor(() => expect(api.criar_grade).toHaveBeenCalled());
    expect(window.alert).not.toHaveBeenCalledWith("Preencha todos os campos.");
  });

  it("erro ao criar mostra alerta específico", async () => {
    api.criar_grade.mockRejectedValue(new Error("falhou"));
    render(<ModalCriarGrade gradeEditando={null} onCriado={vi.fn()} onCancelar={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Ex: Pizza Salgada"), { target: { value: "Destaques" } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: 1/), { target: { value: "1" } });
    fireEvent.click(screen.getByText("Criar"));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Erro ao criar grade."));
  });
});

describe("ModalCriarGrade - edição", () => {
  const GRADE = { id: 4, nome: "Destaques", posicao: 1 };

  it("mostra 'Editar Grade' com os campos preenchidos", () => {
    render(<ModalCriarGrade gradeEditando={GRADE} onCriado={vi.fn()} onCancelar={vi.fn()} />);
    expect(screen.getByText("Editar Grade")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Destaques")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
  });

  it("salvar chama editar_grade com o id certo", async () => {
    render(<ModalCriarGrade gradeEditando={GRADE} onCriado={vi.fn()} onCancelar={vi.fn()} />);

    fireEvent.change(screen.getByDisplayValue("1"), { target: { value: "2" } });
    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => expect(api.editar_grade).toHaveBeenCalledWith(4, "Destaques", 2));
    expect(api.criar_grade).not.toHaveBeenCalled();
  });
});
