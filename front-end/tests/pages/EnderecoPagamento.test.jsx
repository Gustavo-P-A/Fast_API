import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { EnderecoPagamento } from "../../src/pages/EnderecoPagamento";
import { CartContext } from "../../src/contexts/CartContext";

vi.mock("../../src/api/auth", () => ({
  endereco: vi.fn(),
  editar_endereco: vi.fn(),
  criar_endereco: vi.fn(),
  delete_endereco: vi.fn(),
}));

import * as api from "../../src/api/auth";

const ENDERECOS = [
  { id: 1, rua: "Rua das Flores", numero: "10", bairro: "Centro", cidade: "Cianorte", estado: "PR" },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.endereco.mockResolvedValue(ENDERECOS);
  api.criar_endereco.mockResolvedValue({});
  api.editar_endereco.mockResolvedValue({});
  api.delete_endereco.mockResolvedValue({});
});

function renderPagina(vazio = false) {
  return render(
    <MemoryRouter>
      <CartContext.Provider value={{ vazio }}>
        <EnderecoPagamento />
      </CartContext.Provider>
    </MemoryRouter>
  );
}

describe("EnderecoPagamento", () => {
  it("busca e lista os endereços salvos", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText(/Rua das Flores/)).toBeInTheDocument());
    expect(screen.getByText(/Centro - Cianorte\/PR/)).toBeInTheDocument();
  });

  it("lista as opções de pagamento", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText(/Rua das Flores/)).toBeInTheDocument());

    expect(screen.getByText("Pix")).toBeInTheDocument();
    expect(screen.getByText("Cartão de crédito")).toBeInTheDocument();
    expect(screen.getByText("Dinheiro")).toBeInTheDocument();
  });

  it("botão Continuar começa desabilitado sem endereço e pagamento escolhidos", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText(/Rua das Flores/)).toBeInTheDocument());

    expect(screen.getByText("Continuar")).toBeDisabled();
  });

  it("selecionar endereço e forma de pagamento habilita o botão Continuar", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText(/Rua das Flores/)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Rua das Flores/));
    fireEvent.click(screen.getByText("Pix"));

    expect(screen.getByText("Continuar")).not.toBeDisabled();
  });

  it("abrir 'Adicionar endereço' mostra o formulário", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText(/Rua das Flores/)).toBeInTheDocument());

    fireEvent.click(screen.getByText("+ Adicionar endereço"));

    expect(screen.getByPlaceholderText("CEP")).toBeInTheDocument();
  });

  it("salvar novo endereço com campos válidos chama a API e recarrega a lista", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText(/Rua das Flores/)).toBeInTheDocument());
    fireEvent.click(screen.getByText("+ Adicionar endereço"));

    fireEvent.change(screen.getByPlaceholderText("CEP"), { target: { value: "8720000" } });
    fireEvent.change(screen.getByPlaceholderText("Rua"), { target: { value: "Rua Nova" } });
    fireEvent.change(screen.getByPlaceholderText("Número"), { target: { value: "20" } });
    fireEvent.change(screen.getByPlaceholderText("Bairro"), { target: { value: "Jardim" } });
    fireEvent.click(screen.getByText("Salvar Endereço"));

    await waitFor(() => expect(api.criar_endereco).toHaveBeenCalled());
    expect(api.endereco).toHaveBeenCalledTimes(2); // 1 na carga inicial + 1 depois de salvar
  });

  it("salvar endereço sem CEP mostra erro de validação e não chama a API", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText(/Rua das Flores/)).toBeInTheDocument());
    fireEvent.click(screen.getByText("+ Adicionar endereço"));

    fireEvent.click(screen.getByText("Salvar Endereço"));

    expect(screen.getByText("Adicione o CEP")).toBeInTheDocument();
    expect(api.criar_endereco).not.toHaveBeenCalled();
  });

  it("editar um endereço existente troca pro formulário preenchido", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText(/Rua das Flores/)).toBeInTheDocument());

    fireEvent.click(screen.getByText("Editar"));

    expect(screen.getByDisplayValue("Rua das Flores")).toBeInTheDocument();
  });

  it("excluir endereço chama delete_endereco com o id certo", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText(/Rua das Flores/)).toBeInTheDocument());

    fireEvent.click(screen.getByText("Excluir"));

    await waitFor(() => expect(api.delete_endereco).toHaveBeenCalledWith(1));
  });

  it("carrinho vazio redireciona pro carrinho em vez de carregar a página", async () => {
    renderPagina(true);

    await waitFor(() => expect(api.endereco).not.toHaveBeenCalled());
  });
});
