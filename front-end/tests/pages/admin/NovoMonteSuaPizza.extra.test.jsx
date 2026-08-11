import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { NovoMonteSuaPizza } from "../../../src/pages/Admin/NovoMonteSuaPizza";

vi.mock("../../../src/api/auth", () => ({
  listar_categoria: vi.fn(),
  listar_grade: vi.fn(),
  listar_tamanho: vi.fn(),
  upload_imagem: vi.fn(),
  criar_monte_pizza: vi.fn(),
  editar_monte_pizza: vi.fn(),
  buscar_monte_pizza: vi.fn(),
  importar_sabores_monte_pizza: vi.fn(),
  adicionar_sabores_monte_pizza: vi.fn(),
  remover_sabor_monte_pizza: vi.fn(),
  listar_todos_produtos: vi.fn(),
  excluir_categoria: vi.fn(),
  excluir_grade: vi.fn(),
}));

vi.mock("../../../src/components/produto/ModalCriarCategoria", () => ({
  ModalCriarCategoria: ({ categoriaEditando, onCriado, onCancelar }) => (
    <div>
      <span>ModalCategoria {categoriaEditando ? `editando ${categoriaEditando.nome}` : "nova"}</span>
      <button onClick={onCriado}>Confirmar categoria (mock)</button>
      <button onClick={onCancelar}>Cancelar categoria (mock)</button>
    </div>
  ),
}));

vi.mock("../../../src/components/produto/ModalCriarGrade.jsx", () => ({
  ModalCriarGrade: ({ gradeEditando, onCriado, onCancelar }) => (
    <div>
      <span>ModalGrade {gradeEditando ? `editando ${gradeEditando.nome}` : "nova"}</span>
      <button onClick={onCriado}>Confirmar grade (mock)</button>
      <button onClick={onCancelar}>Cancelar grade (mock)</button>
    </div>
  ),
}));

import * as api from "../../../src/api/auth";

const CATEGORIAS = [{ id: 1, nome: "Pizzas Salgadas" }];
const GRADES = [{ id: 1, nome: "Grade Padrão", posicao: 1 }];
const TAMANHOS = [{ id: 10, nome: "Grande", qtd_sabores: 2 }];

function renderPaginaEditando(id = "5") {
  return render(
    <MemoryRouter initialEntries={[`/admin/novo-monte-pizza/${id}`]}>
      <Routes>
        <Route path="/admin/novo-monte-pizza/:id" element={<NovoMonteSuaPizza />} />
        <Route path="/admin/produtos" element={<div>Lista de produtos</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.listar_categoria.mockResolvedValue(CATEGORIAS);
  api.listar_grade.mockResolvedValue(GRADES);
  api.listar_tamanho.mockResolvedValue(TAMANHOS);
  api.listar_todos_produtos.mockResolvedValue([]);
  api.buscar_monte_pizza.mockResolvedValue({
    nome: "MSP", descricao: "", ativo: true, tamanho_id: 10,
    categoria_id: 1, grade_id: 1, sabores: [],
  });
  api.excluir_categoria.mockResolvedValue({});
  api.excluir_grade.mockResolvedValue({});
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

async function renderCarregado() {
  renderPaginaEditando();
  await waitFor(() => expect(screen.getByDisplayValue("MSP")).toBeInTheDocument());
}

describe("NovoMonteSuaPizza - navegação", () => {
  it("botão '← Voltar' leva pra lista de produtos", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("← Voltar"));
    await waitFor(() => expect(screen.getByText("Lista de produtos")).toBeInTheDocument());
  });
});

describe("NovoMonteSuaPizza - categoria", () => {
  it("'+ Criar novo' da categoria abre o modal em modo criação", async () => {
    await renderCarregado();
    fireEvent.click(screen.getAllByText("+ Criar novo")[0]);
    expect(screen.getByText("ModalCategoria nova")).toBeInTheDocument();
  });

  it("Editar categoria abre o modal com a categoria selecionada", async () => {
    await renderCarregado();
    fireEvent.click(screen.getAllByText("Editar")[0]);
    expect(screen.getByText("ModalCategoria editando Pizzas Salgadas")).toBeInTheDocument();
  });

  it("confirmar no modal recarrega categorias/grades e fecha o modal", async () => {
    await renderCarregado();
    fireEvent.click(screen.getAllByText("+ Criar novo")[0]);

    fireEvent.click(screen.getByText("Confirmar categoria (mock)"));

    await waitFor(() => expect(api.listar_categoria).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/ModalCategoria/)).not.toBeInTheDocument();
  });

  it("excluir categoria pede confirmação e chama a API", async () => {
    await renderCarregado();

    fireEvent.click(screen.getAllByText("Excluir")[0]);

    expect(window.confirm).toHaveBeenCalledWith('Excluir a categoria "Pizzas Salgadas"?');
    await waitFor(() => expect(api.excluir_categoria).toHaveBeenCalledWith(1));
  });

  it("excluir categoria cancelado não chama a API", async () => {
    window.confirm.mockReturnValue(false);
    await renderCarregado();

    fireEvent.click(screen.getAllByText("Excluir")[0]);

    expect(api.excluir_categoria).not.toHaveBeenCalled();
  });

  it("erro ao excluir categoria em uso mostra a mensagem da API", async () => {
    api.excluir_categoria.mockRejectedValue({ response: { data: { detail: "Categoria em uso por sabores." } } });
    await renderCarregado();

    fireEvent.click(screen.getAllByText("Excluir")[0]);

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Categoria em uso por sabores."));
  });
});

describe("NovoMonteSuaPizza - grade", () => {
  it("'+ Criar novo' da grade abre o modal em modo criação", async () => {
    await renderCarregado();
    fireEvent.click(screen.getAllByText("+ Criar novo")[1]);
    expect(screen.getByText("ModalGrade nova")).toBeInTheDocument();
  });

  it("Editar grade abre o modal com a grade selecionada", async () => {
    await renderCarregado();
    fireEvent.click(screen.getAllByText("Editar")[1]);
    expect(screen.getByText("ModalGrade editando Grade Padrão")).toBeInTheDocument();
  });

  it("excluir grade pede confirmação e chama a API", async () => {
    await renderCarregado();

    fireEvent.click(screen.getAllByText("Excluir")[1]);

    expect(window.confirm).toHaveBeenCalledWith('Excluir a grade "Grade Padrão"?');
    await waitFor(() => expect(api.excluir_grade).toHaveBeenCalledWith(1));
  });

  it("erro ao excluir grade em uso mostra a mensagem da API", async () => {
    api.excluir_grade.mockRejectedValue({ response: { data: { detail: "Grade em uso." } } });
    await renderCarregado();

    fireEvent.click(screen.getAllByText("Excluir")[1]);

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Grade em uso."));
  });
});
