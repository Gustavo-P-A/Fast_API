import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminBordas } from "../../../src/pages/Admin/Bordas";

vi.mock("../../../src/api/auth", () => ({
  listar_adicionais: vi.fn(),
  listar_tamanho: vi.fn(),
  toggle_status_adicional: vi.fn(),
  deletar_adicional: vi.fn(),
}));

vi.mock("../../../src/components/borda/ModalBorda", () => ({
  ModalBorda: ({ borda, onSalvo, onCancelar }) => (
    <div>
      <span>Modal {borda ? `editar ${borda.nome}` : "nova borda"}</span>
      <button onClick={onSalvo}>Salvar (mock)</button>
      <button onClick={onCancelar}>Fechar (mock)</button>
    </div>
  ),
}));

import * as api from "../../../src/api/auth";

const BORDAS = [
  { id: 1, nome: "Catupiry", ativo: true, precos: [{ id: 1, tamanho_nome: "Grande", preco: 10 }] },
  { id: 2, nome: "Cheddar", ativo: false, precos: [] },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.listar_adicionais.mockResolvedValue(BORDAS);
  api.listar_tamanho.mockResolvedValue([{ id: 10, nome: "Grande" }]);
  api.toggle_status_adicional.mockResolvedValue({ ativo: false });
  api.deletar_adicional.mockResolvedValue({});
  vi.spyOn(window, "alert").mockImplementation(() => {});
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

async function renderPagina() {
  render(<AdminBordas />);
  await waitFor(() => expect(screen.getByText("Catupiry")).toBeInTheDocument());
}

describe("AdminBordas", () => {
  it("lista as bordas com os preços por tamanho", async () => {
    await renderPagina();
    expect(screen.getByText(/Grande: R\$ 10.00/)).toBeInTheDocument();
  });

  it("borda sem preço cadastrado mostra aviso", async () => {
    await renderPagina();
    expect(screen.getByText("Sem preço definido")).toBeInTheDocument();
  });

  it("+ Nova Borda abre o modal em modo criação", async () => {
    await renderPagina();
    fireEvent.click(screen.getByText("+ Nova Borda"));
    expect(screen.getByText("Modal nova borda")).toBeInTheDocument();
  });

  it("Editar abre o modal já com a borda escolhida", async () => {
    await renderPagina();
    fireEvent.click(screen.getAllByText("Editar")[0]);
    expect(screen.getByText("Modal editar Catupiry")).toBeInTheDocument();
  });

  it("salvar no modal fecha e recarrega a lista", async () => {
    await renderPagina();
    fireEvent.click(screen.getByText("+ Nova Borda"));

    fireEvent.click(screen.getByText("Salvar (mock)"));

    await waitFor(() => expect(api.listar_adicionais).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/Modal/)).not.toBeInTheDocument();
  });

  it("toggle de status chama a API", async () => {
    await renderPagina();
    fireEvent.click(screen.getByText("Ativo"));
    await waitFor(() => expect(api.toggle_status_adicional).toHaveBeenCalledWith(1));
  });

  it("excluir pede confirmação e chama a API", async () => {
    await renderPagina();
    fireEvent.click(screen.getAllByText("Excluir")[0]);
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(api.deletar_adicional).toHaveBeenCalledWith(1));
  });
});
