import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Enderecos } from "../../../src/components/perfil/Enderecos";

vi.mock("../../../src/api/auth", () => ({
  endereco: vi.fn(),
  criar_endereco: vi.fn(),
  editar_endereco: vi.fn(),
  delete_endereco: vi.fn(),
}));

import * as api from "../../../src/api/auth";

const ENDERECO = { id: 1, rua: "Rua das Flores", numero: "10", complemento: null, bairro: "Centro", cidade: "Cianorte", estado: "PR", cep: "87200000" };

beforeEach(() => {
  vi.clearAllMocks();
  api.endereco.mockResolvedValue([ENDERECO]);
  api.criar_endereco.mockResolvedValue({});
  api.editar_endereco.mockResolvedValue({});
  api.delete_endereco.mockResolvedValue({});
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

async function renderCarregado() {
  render(<Enderecos />);
  await waitFor(() => expect(screen.getByText(/Rua das Flores/)).toBeInTheDocument());
}

describe("Enderecos (perfil)", () => {
  it("lista os endereços cadastrados formatados", async () => {
    await renderCarregado();
    expect(screen.getByText(/Centro · Cianorte\/PR · CEP 87200000/)).toBeInTheDocument();
  });

  it("sem endereços mostra mensagem de vazio", async () => {
    api.endereco.mockResolvedValue([]);
    render(<Enderecos />);
    await waitFor(() => expect(screen.getByText("Nenhum endereço cadastrado ainda.")).toBeInTheDocument());
  });

  it("abrir novo endereço mostra formulário vazio", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("+ Adicionar endereço"));
    expect(screen.getByText("Novo endereço")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nome da rua").value).toBe("");
  });

  it("digitar CEP formata automaticamente", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("+ Adicionar endereço"));

    const inputCep = screen.getByPlaceholderText("00000-000");
    fireEvent.change(inputCep, { target: { value: "87200000" } });

    expect(inputCep.value).toBe("87200-000");
  });

  it("salvar sem campos obrigatórios mostra os erros e não chama a API", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("+ Adicionar endereço"));

    fireEvent.click(screen.getByText("Salvar endereço"));

    expect(screen.getByText("Informe a rua")).toBeInTheDocument();
    expect(screen.getByText("Informe o número")).toBeInTheDocument();
    expect(screen.getByText("CEP inválido")).toBeInTheDocument();
    expect(api.criar_endereco).not.toHaveBeenCalled();
  });

  it("salvar endereço novo com dados válidos chama a API e recarrega a lista", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("+ Adicionar endereço"));

    fireEvent.change(screen.getByPlaceholderText("Nome da rua"), { target: { value: "Rua Nova" } });
    fireEvent.change(screen.getByPlaceholderText("Nº"), { target: { value: "20" } });
    fireEvent.change(screen.getByPlaceholderText("Bairro"), { target: { value: "Jardim" } });
    fireEvent.change(screen.getByPlaceholderText("Cidade"), { target: { value: "Cianorte" } });
    fireEvent.change(screen.getByDisplayValue("Selecione..."), { target: { value: "PR" } });
    fireEvent.change(screen.getByPlaceholderText("00000-000"), { target: { value: "87200000" } });

    fireEvent.click(screen.getByText("Salvar endereço"));

    await waitFor(() => expect(api.criar_endereco).toHaveBeenCalledWith({
      rua: "Rua Nova", numero: "20", complemento: null, bairro: "Jardim",
      cidade: "Cianorte", estado: "PR", cep: "87200000",
    }));
  });

  it("editar um endereço existente preenche o formulário e envia via editar_endereco", async () => {
    await renderCarregado();

    fireEvent.click(screen.getByText(/Editar/));

    expect(screen.getByDisplayValue("Rua das Flores")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Salvar alterações"));

    await waitFor(() => expect(api.editar_endereco).toHaveBeenCalledWith(1, expect.objectContaining({ rua: "Rua das Flores" })));
  });

  it("remover endereço chama a API e some da lista", async () => {
    await renderCarregado();

    fireEvent.click(screen.getByText(/Remover/));

    await waitFor(() => expect(api.delete_endereco).toHaveBeenCalledWith(1));
  });

  it("erro ao salvar mostra a mensagem da API", async () => {
    api.criar_endereco.mockRejectedValue({ response: { data: { detail: "CEP inválido pro serviço de entrega" } } });
    await renderCarregado();
    fireEvent.click(screen.getByText("+ Adicionar endereço"));
    fireEvent.change(screen.getByPlaceholderText("Nome da rua"), { target: { value: "Rua Nova" } });
    fireEvent.change(screen.getByPlaceholderText("Nº"), { target: { value: "20" } });
    fireEvent.change(screen.getByPlaceholderText("Bairro"), { target: { value: "Jardim" } });
    fireEvent.change(screen.getByPlaceholderText("Cidade"), { target: { value: "Cianorte" } });
    fireEvent.change(screen.getByDisplayValue("Selecione..."), { target: { value: "PR" } });
    fireEvent.change(screen.getByPlaceholderText("00000-000"), { target: { value: "87200000" } });

    fireEvent.click(screen.getByText("Salvar endereço"));

    await waitFor(() => expect(screen.getByText("CEP inválido pro serviço de entrega")).toBeInTheDocument());
  });
});
