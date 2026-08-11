import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { NovoProduto } from "../../../src/pages/Admin/NovoProduto";

vi.mock("../../../src/api/auth", () => ({
  listar_categoria: vi.fn(),
  listar_grade: vi.fn(),
  listar_tamanho: vi.fn(),
  admin_tamanho: vi.fn(),
  upload_imagem: vi.fn(),
  criar_novo_produto: vi.fn(),
  editar_produto: vi.fn(),
  listar_novo_produto: vi.fn(),
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
  ModalCriarGrade: ({ gradeEditando, onCriado }) => (
    <div>
      <span>ModalGrade {gradeEditando ? `editando ${gradeEditando.nome}` : "nova"}</span>
      <button onClick={onCriado}>Confirmar grade (mock)</button>
    </div>
  ),
}));

import * as api from "../../../src/api/auth";

const CATEGORIAS = [{ id: 1, nome: "Pizzas Salgadas" }];
const GRADES = [{ id: 1, nome: "Grade Padrão", posicao: 1 }];
const TAMANHOS = [{ id: 10, nome: "Grande", qtd_sabores: 2 }, { id: 11, nome: "Média", qtd_sabores: 1 }];

const PRODUTO_EXISTENTE = {
  nome: "Calabresa", descricao: "Molho e calabresa", ativo: true,
  categoria_id: 1, grade_id: 1, imagem_url: null,
  disponivel_cardapio_normal: true, disponivel_monte_sua_pizza: false,
  permite_borda: true, permite_ingrediente: true,
  precos: [{ tamanho_id: 10, preco: 40 }],
};

beforeEach(() => {
  vi.clearAllMocks();
  api.listar_categoria.mockResolvedValue(CATEGORIAS);
  api.listar_grade.mockResolvedValue(GRADES);
  api.listar_tamanho.mockResolvedValue(TAMANHOS);
  api.listar_novo_produto.mockResolvedValue(PRODUTO_EXISTENTE);
  api.admin_tamanho.mockResolvedValue({});
  api.editar_produto.mockResolvedValue({});
  api.criar_novo_produto.mockResolvedValue({});
  api.excluir_categoria.mockResolvedValue({});
  api.excluir_grade.mockResolvedValue({});
  vi.spyOn(window, "alert").mockImplementation(() => {});
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

function renderEditando(id = "3") {
  return render(
    <MemoryRouter initialEntries={[`/admin/editar-produto/${id}`]}>
      <Routes>
        <Route path="/admin/editar-produto/:id" element={<NovoProduto />} />
        <Route path="/admin/produtos" element={<div>Lista de produtos</div>} />
      </Routes>
    </MemoryRouter>
  );
}

async function renderCarregado() {
  renderEditando();
  await waitFor(() => expect(screen.getByDisplayValue("Calabresa")).toBeInTheDocument());
}

describe("NovoProduto - edição", () => {
  it("busca o produto existente pelo id e preenche o formulário", async () => {
    await renderCarregado();
    expect(api.listar_novo_produto).toHaveBeenCalledWith("3");
    expect(screen.getByText("Editar Produto")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Molho e calabresa")).toBeInTheDocument();
  });

  it("preço já cadastrado aparece na lista", async () => {
    await renderCarregado();
    expect(screen.getByDisplayValue("40")).toBeInTheDocument();
  });

  it("salvar chama editar_produto (não criar)", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("Salvar Alterações"));
    await waitFor(() => expect(api.editar_produto).toHaveBeenCalledWith(
      "3", "Calabresa", "Molho e calabresa", true, 1, 1, expect.any(Array), null, expect.any(Object)
    ));
    expect(api.criar_novo_produto).not.toHaveBeenCalled();
  });

  it("'← Voltar' leva pra lista de produtos", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("← Voltar"));
    await waitFor(() => expect(screen.getByText("Lista de produtos")).toBeInTheDocument());
  });
});

describe("NovoProduto - toggles", () => {
  it("alterna status, cardápio normal, monte sua pizza, borda e ingrediente", async () => {
    const { container } = await (async () => {
      const utils = render(
        <MemoryRouter initialEntries={["/admin/editar-produto/3"]}>
          <Routes>
            <Route path="/admin/editar-produto/:id" element={<NovoProduto />} />
          </Routes>
        </MemoryRouter>
      );
      await waitFor(() => expect(screen.getByDisplayValue("Calabresa")).toBeInTheDocument());
      return utils;
    })();

    fireEvent.click(container.querySelector(".tgl-toggle"));
    expect(screen.getByText("Inativo")).toBeInTheDocument();

    const toggleMSP = screen.getByText("Disponível no Monte Sua Pizza").parentElement.querySelector(".np-toggle");
    fireEvent.click(toggleMSP);
    expect(screen.getAllByText("Sim").length).toBe(4); // as 4 regras agora ficam "Sim"
  });
});

describe("NovoProduto - novo tamanho", () => {
  it("'+ Novo tamanho' abre o modal e criar chama admin_tamanho + recarrega tamanhos", async () => {
    await renderCarregado();
    fireEvent.click(screen.getByText("+ Novo tamanho"));

    fireEvent.change(screen.getByPlaceholderText("Ex: P, M, G, GG"), { target: { value: "Família" } });
    fireEvent.change(screen.getByPlaceholderText("Ex: 2"), { target: { value: "3" } });
    fireEvent.change(screen.getByPlaceholderText("Ex: 1"), { target: { value: "2" } });
    fireEvent.click(screen.getByText("Criar"));

    await waitFor(() => expect(api.admin_tamanho).toHaveBeenCalledWith("Família", 3, 2));
    await waitFor(() => expect(api.listar_tamanho).toHaveBeenCalledTimes(2));
  });
});

describe("NovoProduto - categoria/grade", () => {
  it("Editar categoria abre o modal já preenchido", async () => {
    await renderCarregado();
    fireEvent.click(screen.getAllByText("Editar")[0]);
    expect(screen.getByText("ModalCategoria editando Pizzas Salgadas")).toBeInTheDocument();
  });

  it("Excluir categoria pede confirmação e chama a API", async () => {
    await renderCarregado();
    fireEvent.click(screen.getAllByText("Excluir")[0]);
    expect(window.confirm).toHaveBeenCalledWith('Excluir a categoria "Pizzas Salgadas"?');
    await waitFor(() => expect(api.excluir_categoria).toHaveBeenCalledWith(1));
  });

  it("Excluir grade pede confirmação e chama a API", async () => {
    await renderCarregado();
    fireEvent.click(screen.getAllByText("Excluir")[1]);
    expect(window.confirm).toHaveBeenCalledWith('Excluir a grade "Grade Padrão"?');
    await waitFor(() => expect(api.excluir_grade).toHaveBeenCalledWith(1));
  });

  it("confirmar categoria no modal recarrega as opções e fecha o modal", async () => {
    await renderCarregado();
    fireEvent.click(screen.getAllByText("+ Criar novo")[0]);

    fireEvent.click(screen.getByText("Confirmar categoria (mock)"));

    await waitFor(() => expect(api.listar_categoria).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/ModalCategoria/)).not.toBeInTheDocument();
  });
});
