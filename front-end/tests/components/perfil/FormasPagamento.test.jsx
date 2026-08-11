import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormasPagamento } from "../../../src/components/perfil/FormasPagamento";

vi.mock("../../../src/api/auth", () => ({
  listar_formas_pagamento: vi.fn(),
  criar_forma_pagamento: vi.fn(),
  editar_forma_pagamento: vi.fn(),
  definir_forma_pagamento_padrao: vi.fn(),
  deletar_forma_pagamento: vi.fn(),
}));

import * as api from "../../../src/api/auth";

const CARTAO = { id: 1, tipo: "CREDITO", bandeira: "Visa", final_numero: "1234", nome_impresso: "FULANO", validade: "12/30", padrao: true };
const CARTAO_2 = { id: 2, tipo: "DEBITO", bandeira: "Mastercard", final_numero: "5678", nome_impresso: "FULANO", validade: "01/28", padrao: false };

beforeEach(() => {
  vi.clearAllMocks();
  api.listar_formas_pagamento.mockResolvedValue([CARTAO]);
  api.criar_forma_pagamento.mockResolvedValue({});
  api.editar_forma_pagamento.mockResolvedValue({});
  api.definir_forma_pagamento_padrao.mockResolvedValue({});
  api.deletar_forma_pagamento.mockResolvedValue({});
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

async function renderCarregado() {
  render(<FormasPagamento />);
  await waitFor(() => expect(screen.getByText("Cartão de Crédito")).toBeInTheDocument());
}

describe("FormasPagamento (perfil)", () => {
  it("lista os cartões com o badge de padrão", async () => {
    await renderCarregado();
    expect(screen.getByText("Padrão")).toBeInTheDocument();
    expect(screen.getByText(/Visa •••• 1234/)).toBeInTheDocument();
  });

  it("cartão que não é padrão mostra botão de definir como padrão", async () => {
    api.listar_formas_pagamento.mockResolvedValue([CARTAO, CARTAO_2]);
    await renderCarregado();

    fireEvent.click(screen.getByText("Definir como padrão"));

    await waitFor(() => expect(api.definir_forma_pagamento_padrao).toHaveBeenCalledWith(2));
  });

  it("sem cartões cadastrados mostra mensagem de vazio", async () => {
    api.listar_formas_pagamento.mockResolvedValue([]);
    render(<FormasPagamento />);
    await waitFor(() => expect(screen.getByText("Nenhuma forma de pagamento cadastrada ainda.")).toBeInTheDocument());
  });

  it("digitar número de cartão Visa detecta a bandeira automaticamente", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("+ Adicionar forma de pagamento"));

    fireEvent.change(screen.getByPlaceholderText("0000 0000 0000 0000"), { target: { value: "4111111111111234" } });
    fireEvent.change(screen.getByPlaceholderText("Como está no cartão"), { target: { value: "Fulano" } });
    fireEvent.change(screen.getByPlaceholderText("MM/AA"), { target: { value: "1230" } });
    fireEvent.change(screen.getByPlaceholderText("123"), { target: { value: "123" } });
    fireEvent.click(screen.getByText("Salvar forma de pagamento"));

    await waitFor(() => expect(api.criar_forma_pagamento).toHaveBeenCalledWith(
      expect.objectContaining({ bandeira: "Visa" })
    ));
  });

  it("número é agrupado em blocos de 4 dígitos ao digitar", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("+ Adicionar forma de pagamento"));

    const inputNumero = screen.getByPlaceholderText("0000 0000 0000 0000");
    fireEvent.change(inputNumero, { target: { value: "4111111111111234" } });

    expect(inputNumero.value).toBe("4111 1111 1111 1234");
  });

  it("validade ganha a barra automaticamente após o mês", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("+ Adicionar forma de pagamento"));

    const inputValidade = screen.getByPlaceholderText("MM/AA");
    fireEvent.change(inputValidade, { target: { value: "1230" } });

    expect(inputValidade.value).toBe("12/30");
  });

  it("vale-alimentação não exige validade nem CVV", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("+ Adicionar forma de pagamento"));
    fireEvent.click(screen.getByText("Vale-Alimentação"));

    expect(screen.queryByPlaceholderText("MM/AA")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("123")).not.toBeInTheDocument();
  });

  it("salvar cartão sem CVV mostra erro de validação", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("+ Adicionar forma de pagamento"));

    fireEvent.change(screen.getByPlaceholderText("0000 0000 0000 0000"), { target: { value: "4111111111111234" } });
    fireEvent.change(screen.getByPlaceholderText("Como está no cartão"), { target: { value: "Fulano" } });
    fireEvent.change(screen.getByPlaceholderText("MM/AA"), { target: { value: "1230" } });
    fireEvent.click(screen.getByText("Salvar forma de pagamento"));

    expect(screen.getByText("CVV inválido")).toBeInTheDocument();
    expect(api.criar_forma_pagamento).not.toHaveBeenCalled();
  });

  it("salvar com dados válidos envia o nome em maiúsculas e só os dígitos do número", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("+ Adicionar forma de pagamento"));

    fireEvent.change(screen.getByPlaceholderText("0000 0000 0000 0000"), { target: { value: "4111111111111234" } });
    fireEvent.change(screen.getByPlaceholderText("Como está no cartão"), { target: { value: "fulano" } });
    fireEvent.change(screen.getByPlaceholderText("MM/AA"), { target: { value: "1230" } });
    fireEvent.change(screen.getByPlaceholderText("123"), { target: { value: "123" } });
    fireEvent.click(screen.getByText("Salvar forma de pagamento"));

    await waitFor(() => expect(api.criar_forma_pagamento).toHaveBeenCalledWith({
      tipo: "CREDITO", bandeira: "Visa", nome_impresso: "FULANO",
      numero: "4111111111111234", validade: "12/30", padrao: false,
    }));
  });

  it("editar um cartão existente preenche o formulário e chama editar_forma_pagamento", async () => {
    await renderCarregado();

    fireEvent.click(screen.getByText(/Editar/));

    expect(screen.getByDisplayValue("FULANO")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("123"), { target: { value: "999" } });
    fireEvent.click(screen.getByText("Salvar alterações"));

    await waitFor(() => expect(api.editar_forma_pagamento).toHaveBeenCalledWith(1, expect.objectContaining({ nome_impresso: "FULANO" })));
  });

  it("remover forma de pagamento chama a API", async () => {
    await renderCarregado();

    fireEvent.click(screen.getByText(/Remover/));

    await waitFor(() => expect(api.deletar_forma_pagamento).toHaveBeenCalledWith(1));
  });

  it("erro ao carregar mostra alerta", async () => {
    api.listar_formas_pagamento.mockRejectedValue(new Error("falhou"));
    render(<FormasPagamento />);

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Erro ao carregar formas de pagamento."));
  });
});
