import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ModalBebida } from "../../../src/components/bebida/ModalBebida";

vi.mock("../../../src/api/auth", () => ({
  listar_categoria: vi.fn(),
  listar_grade: vi.fn(),
  criar_item_simples: vi.fn(),
  editar_item_simples: vi.fn(),
  upload_imagem: vi.fn(),
  buscar_item_simples: vi.fn(),
}));

import * as api from "../../../src/api/auth";

const CATEGORIAS = [{ id: 1, nome: "Refrigerantes" }];
const GRADES = [{ id: 1, nome: "Destaques", posicao: 1 }];

beforeEach(() => {
  vi.clearAllMocks();
  api.listar_categoria.mockResolvedValue(CATEGORIAS);
  api.listar_grade.mockResolvedValue(GRADES);
  api.criar_item_simples.mockResolvedValue({});
  api.editar_item_simples.mockResolvedValue({});
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

function renderNova() {
  render(
    <MemoryRouter initialEntries={["/admin/nova-bebida"]}>
      <Routes>
        <Route
          path="/admin/nova-bebida"
          element={<ModalBebida tipo="BEBIDA" titulo="Bebida" rotaVoltar="/admin/bebidas" placeholderNome="Ex.: Coca-Cola" placeholderDescricao="desc" iconePreview="🥤" />}
        />
        <Route path="/admin/bebidas" element={<div>Lista de bebidas</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function renderEditando(id = "5") {
  render(
    <MemoryRouter initialEntries={[`/admin/nova-bebida/${id}`]}>
      <Routes>
        <Route
          path="/admin/nova-bebida/:id"
          element={<ModalBebida tipo="BEBIDA" titulo="Bebida" rotaVoltar="/admin/bebidas" placeholderNome="Ex.: Coca-Cola" placeholderDescricao="desc" iconePreview="🥤" />}
        />
        <Route path="/admin/bebidas" element={<div>Lista de bebidas</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ModalBebida - criação", () => {
  it("busca categorias e grades (bebida precisa de grade)", async () => {
    renderNova();
    await waitFor(() => expect(api.listar_categoria).toHaveBeenCalled());
    expect(api.listar_grade).toHaveBeenCalled();
    expect(screen.getByText("Cadastro de Nova Bebida")).toBeInTheDocument();
  });

  it("salvar sem preencher nada mostra os 3 erros de validação", async () => {
    renderNova();
    await waitFor(() => expect(screen.getByText("Selecione uma categoria")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Salvar Bebida"));

    expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Categoria é obrigatória")).toBeInTheDocument();
    expect(screen.getByText("Grade é obrigatória")).toBeInTheDocument();
    expect(screen.getByText("Preço é obrigatório")).toBeInTheDocument();
    expect(api.criar_item_simples).not.toHaveBeenCalled();
  });

  it("preencher tudo e salvar cria o item e navega de volta", async () => {
    renderNova();
    await waitFor(() => expect(screen.getByText("Refrigerantes")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("Ex.: Coca-Cola"), { target: { value: "Coca-Cola" } });
    fireEvent.change(screen.getByDisplayValue("Selecione uma categoria"), { target: { value: "1" } });
    fireEvent.change(screen.getByDisplayValue("Selecione..."), { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("0,00"), { target: { value: "8,50" } });

    fireEvent.click(screen.getByText("Salvar Bebida"));

    await waitFor(() => expect(api.criar_item_simples).toHaveBeenCalledWith(expect.objectContaining({
      tipo: "BEBIDA", nome: "Coca-Cola", categoria_id: 1, grade_id: 1, preco: 8.5,
    })));
    await waitFor(() => expect(screen.getByText("Lista de bebidas")).toBeInTheDocument());
  });

  it("pré-visualização mostra o preço formatado enquanto digita", async () => {
    renderNova();
    await waitFor(() => expect(screen.getByText("Refrigerantes")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("0,00"), { target: { value: "8,5" } });

    expect(screen.getByText("R$ 8.50")).toBeInTheDocument();
  });

  it("erro ao salvar mostra alerta", async () => {
    api.criar_item_simples.mockRejectedValue(new Error("falhou"));
    renderNova();
    await waitFor(() => expect(screen.getByText("Refrigerantes")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("Ex.: Coca-Cola"), { target: { value: "Coca-Cola" } });
    fireEvent.change(screen.getByDisplayValue("Selecione uma categoria"), { target: { value: "1" } });
    fireEvent.change(screen.getByDisplayValue("Selecione..."), { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("0,00"), { target: { value: "8" } });
    fireEvent.click(screen.getByText("Salvar Bebida"));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Erro ao salvar bebida."));
  });
});

describe("ModalBebida - edição", () => {
  const ITEM = { id: 5, nome: "Coca-Cola", categoria_id: 1, grade_id: 1, preco: 8, descricao: "Gelada", ativo: true, imagem_url: null };

  it("busca o item pelo id da URL e preenche o formulário", async () => {
    api.buscar_item_simples.mockResolvedValue(ITEM);
    renderEditando();

    await waitFor(() => expect(api.buscar_item_simples).toHaveBeenCalledWith("5"));
    await waitFor(() => expect(screen.getByDisplayValue("Coca-Cola")).toBeInTheDocument());
    expect(screen.getByText("Editar Bebida")).toBeInTheDocument();
  });

  it("salvar edição chama editar_item_simples com o id certo", async () => {
    api.buscar_item_simples.mockResolvedValue(ITEM);
    renderEditando();
    await waitFor(() => expect(screen.getByDisplayValue("Coca-Cola")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Salvar Bebida"));

    await waitFor(() => expect(api.editar_item_simples).toHaveBeenCalledWith("5", expect.objectContaining({ nome: "Coca-Cola" })));
  });

  it("erro ao buscar o item mostra alerta", async () => {
    api.buscar_item_simples.mockRejectedValue(new Error("404"));
    renderEditando();

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Erro ao carregar item."));
  });
});
