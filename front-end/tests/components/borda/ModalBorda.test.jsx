import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ModalBorda } from "../../../src/components/borda/ModalBorda";

vi.mock("../../../src/api/auth", () => ({
  criar_adicionais: vi.fn(),
  salvar_preco_adicional: vi.fn(),
}));

import * as api from "../../../src/api/auth";

const TAMANHOS = [{ id: 10, nome: "Grande" }, { id: 11, nome: "Média" }];

beforeEach(() => {
  vi.clearAllMocks();
  api.criar_adicionais.mockResolvedValue({ id: 99 });
  api.salvar_preco_adicional.mockResolvedValue({});
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

describe("ModalBorda - criação", () => {
  it("mostra o título 'Nova Borda' e o campo de nome vazio e habilitado", () => {
    render(<ModalBorda borda={null} tamanhos={TAMANHOS} onSalvo={vi.fn()} onCancelar={vi.fn()} />);
    expect(screen.getByText("Nova Borda")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Catupiry/).value).toBe("");
    expect(screen.getByPlaceholderText(/Catupiry/)).not.toBeDisabled();
  });

  it("salvar sem nome mostra alerta e não chama a API", () => {
    render(<ModalBorda borda={null} tamanhos={TAMANHOS} onSalvo={vi.fn()} onCancelar={vi.fn()} />);

    fireEvent.click(screen.getByText("Salvar"));

    expect(window.alert).toHaveBeenCalledWith("Informe o nome da borda.");
    expect(api.criar_adicionais).not.toHaveBeenCalled();
  });

  it("salvar cria a borda e os preços preenchidos, ignorando os vazios", async () => {
    const onSalvo = vi.fn();
    render(<ModalBorda borda={null} tamanhos={TAMANHOS} onSalvo={onSalvo} onCancelar={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/Catupiry/), { target: { value: "Catupiry" } });
    fireEvent.change(screen.getAllByPlaceholderText("0,00")[0], { target: { value: "10" } });
    // deixa o preço da Média em branco de propósito

    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => expect(api.criar_adicionais).toHaveBeenCalledWith("Catupiry"));
    await waitFor(() => expect(api.salvar_preco_adicional).toHaveBeenCalledWith(99, 10, 10));
    expect(api.salvar_preco_adicional).toHaveBeenCalledTimes(1);
    expect(onSalvo).toHaveBeenCalled();
  });

  it("cancelar chama onCancelar", () => {
    const onCancelar = vi.fn();
    render(<ModalBorda borda={null} tamanhos={TAMANHOS} onSalvo={vi.fn()} onCancelar={onCancelar} />);

    fireEvent.click(screen.getByText("Cancelar"));

    expect(onCancelar).toHaveBeenCalled();
  });

  it("erro ao salvar mostra alerta", async () => {
    api.criar_adicionais.mockRejectedValue(new Error("falhou"));
    render(<ModalBorda borda={null} tamanhos={TAMANHOS} onSalvo={vi.fn()} onCancelar={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/Catupiry/), { target: { value: "Catupiry" } });
    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Erro ao salvar borda."));
  });
});

describe("ModalBorda - edição", () => {
  const BORDA = { id: 5, nome: "Catupiry", precos: [{ tamanho_id: 10, preco: 10 }] };

  it("nome vem preenchido e desabilitado (não dá pra editar o nome de uma borda existente)", () => {
    render(<ModalBorda borda={BORDA} tamanhos={TAMANHOS} onSalvo={vi.fn()} onCancelar={vi.fn()} />);

    expect(screen.getByText("Editar Borda")).toBeInTheDocument();
    const inputNome = screen.getByPlaceholderText(/Catupiry/);
    expect(inputNome.value).toBe("Catupiry");
    expect(inputNome).toBeDisabled();
  });

  it("preços existentes vêm preenchidos por tamanho", () => {
    render(<ModalBorda borda={BORDA} tamanhos={TAMANHOS} onSalvo={vi.fn()} onCancelar={vi.fn()} />);

    const precos = screen.getAllByPlaceholderText("0,00");
    expect(precos[0].value).toBe("10");
    expect(precos[1].value).toBe("");
  });

  it("salvar edição usa o id da borda existente sem recriar o adicional", async () => {
    render(<ModalBorda borda={BORDA} tamanhos={TAMANHOS} onSalvo={vi.fn()} onCancelar={vi.fn()} />);

    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => expect(api.salvar_preco_adicional).toHaveBeenCalledWith(5, 10, 10));
    expect(api.criar_adicionais).not.toHaveBeenCalled();
  });
});
