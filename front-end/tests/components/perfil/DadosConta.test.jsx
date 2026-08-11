import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DadosConta } from "../../../src/components/perfil/DadosConta";

vi.mock("../../../src/api/auth", () => ({
  me: vi.fn(),
  atualizar_meus_dados: vi.fn(),
}));

import * as api from "../../../src/api/auth";

const USUARIO = { nome: "Fulano da Silva", email: "fulano@teste.com", cpf: "12345678901", telefone: "44999998888" };

beforeEach(() => {
  vi.clearAllMocks();
  api.me.mockResolvedValue(USUARIO);
});

async function renderCarregado() {
  render(<DadosConta />);
  await waitFor(() => expect(screen.getByText("Fulano da Silva")).toBeInTheDocument());
}

describe("DadosConta", () => {
  it("busca e mostra os dados formatados (CPF e telefone)", async () => {
    await renderCarregado();

    expect(screen.getByText("fulano@teste.com")).toBeInTheDocument();
    expect(screen.getByText("123.456.789-01")).toBeInTheDocument();
    expect(screen.getByText("(44) 99999-8888")).toBeInTheDocument();
  });

  it("sem CPF/telefone cadastrados mostra 'Não informado'", async () => {
    api.me.mockResolvedValue({ ...USUARIO, cpf: null, telefone: null });
    await renderCarregado();

    expect(screen.getAllByText("Não informado")).toHaveLength(2);
  });

  it("erro ao carregar mostra mensagem alternativa", async () => {
    api.me.mockRejectedValue(new Error("falhou"));
    render(<DadosConta />);

    await waitFor(() => expect(screen.getByText("Não foi possível carregar seus dados.")).toBeInTheDocument());
  });

  it("Editar dados abre o formulário preenchido", async () => {
    await renderCarregado();

    fireEvent.click(screen.getByText("Editar dados"));

    expect(screen.getByDisplayValue("Fulano da Silva")).toBeInTheDocument();
    expect(screen.getByDisplayValue("123.456.789-01")).toBeInTheDocument();
  });

  it("digitar CPF formata automaticamente enquanto o usuário digita", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("Editar dados"));

    const inputCpf = screen.getByPlaceholderText("000.000.000-00");
    fireEvent.change(inputCpf, { target: { value: "98765432100" } });

    expect(inputCpf.value).toBe("987.654.321-00");
  });

  it("salvar sem nome mostra erro de validação e não chama a API", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("Editar dados"));

    fireEvent.change(screen.getByDisplayValue("Fulano da Silva"), { target: { value: "" } });
    fireEvent.click(screen.getByText("Salvar alterações"));

    expect(screen.getByText("Informe seu nome completo")).toBeInTheDocument();
    expect(api.atualizar_meus_dados).not.toHaveBeenCalled();
  });

  it("salvar com e-mail inválido mostra erro de validação", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("Editar dados"));

    fireEvent.change(screen.getByDisplayValue("fulano@teste.com"), { target: { value: "nao-e-email" } });
    fireEvent.click(screen.getByText("Salvar alterações"));

    expect(screen.getByText("Informe um e-mail válido")).toBeInTheDocument();
  });

  it("salvar com dados válidos envia só dígitos de CPF/telefone e mostra sucesso", async () => {
    api.atualizar_meus_dados.mockResolvedValue({ ...USUARIO, nome: "Novo Nome" });
    await renderCarregado();
    fireEvent.click(screen.getByText("Editar dados"));

    fireEvent.change(screen.getByDisplayValue("Fulano da Silva"), { target: { value: "Novo Nome" } });
    fireEvent.click(screen.getByText("Salvar alterações"));

    await waitFor(() => expect(api.atualizar_meus_dados).toHaveBeenCalledWith({
      nome: "Novo Nome", email: "fulano@teste.com", cpf: "12345678901", telefone: "44999998888",
    }));
    expect(screen.getByText("Seus dados foram atualizados com sucesso.")).toBeInTheDocument();
  });

  it("cancelar edição descarta as alterações não salvas", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("Editar dados"));
    fireEvent.change(screen.getByDisplayValue("Fulano da Silva"), { target: { value: "Rascunho" } });

    fireEvent.click(screen.getByText("Cancelar"));

    expect(screen.getByText("Fulano da Silva")).toBeInTheDocument();
    expect(screen.queryByText("Rascunho")).not.toBeInTheDocument();
  });

  it("erro da API ao salvar mostra a mensagem retornada pelo backend", async () => {
    api.atualizar_meus_dados.mockRejectedValue({ response: { data: { detail: "E-mail já cadastrado" } } });
    await renderCarregado();
    fireEvent.click(screen.getByText("Editar dados"));

    fireEvent.click(screen.getByText("Salvar alterações"));

    await waitFor(() => expect(screen.getByText("E-mail já cadastrado")).toBeInTheDocument());
  });
});
