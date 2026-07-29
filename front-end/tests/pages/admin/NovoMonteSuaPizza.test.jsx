import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { NovoMonteSuaPizza } from "../../../src/pages/Admin/NovoMonteSuaPizza";

// Mock da camada de API inteira usada por essa página
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
  sincronizar_sabores_monte_pizza: vi.fn(),
  listar_todos_produtos: vi.fn(),
}));

import * as api from "../../../src/api/auth";

const CATEGORIAS = [{ id: 1, nome: "Pizzas Salgadas" }];
const GRADES = [{ id: 1, nome: "Grade Padrão", posicao: 1 }];
const TAMANHOS = [{ id: 10, nome: "Grande", qtd_sabores: 2 }];
const TODOS_PRODUTOS = [
  { id: 1, nome: "Calabresa", disponivel_monte_sua_pizza: true },
  { id: 2, nome: "Marguerita", disponivel_monte_sua_pizza: true },
  { id: 3, nome: "Bebida Genérica", disponivel_monte_sua_pizza: false },
];

function renderPaginaNova() {
  return render(
    <MemoryRouter initialEntries={["/admin/novo-monte-pizza"]}>
      <Routes>
        <Route path="/admin/novo-monte-pizza" element={<NovoMonteSuaPizza />} />
        <Route path="/admin/novo-monte-pizza/:id" element={<NovoMonteSuaPizza />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderPaginaEditando(id = "5") {
  return render(
    <MemoryRouter initialEntries={[`/admin/novo-monte-pizza/${id}`]}>
      <Routes>
        <Route path="/admin/novo-monte-pizza/:id" element={<NovoMonteSuaPizza />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("NovoMonteSuaPizza (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listar_categoria.mockResolvedValue(CATEGORIAS);
    api.listar_grade.mockResolvedValue(GRADES);
    api.listar_tamanho.mockResolvedValue(TAMANHOS);
    api.listar_todos_produtos.mockResolvedValue(TODOS_PRODUTOS);
    // window.confirm é usado em handleRemoverSabor -- sem mockar,
    // jsdom lança "not implemented" e o clique nunca confirma
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("mostra 'Selecione um tamanho' e esconde a seção de sabores ao criar (ainda sem tamanho)", async () => {
    renderPaginaNova();

    await waitFor(() => expect(api.listar_categoria).toHaveBeenCalled());

    expect(
      screen.getByText("Selecione um tamanho ao lado para liberar essa seção.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Importar sabores automaticamente")).not.toBeInTheDocument();
  });

  it("cria um rascunho automaticamente assim que o tamanho é escolhido", async () => {
    api.criar_monte_pizza.mockResolvedValue({ id: 42 });

    renderPaginaNova();
    await waitFor(() => expect(api.listar_tamanho).toHaveBeenCalled());

    // 3 selects compartilham "Selecione..." (tamanho, categoria, grade) --
    // o de Tamanho é o primeiro a aparecer no DOM (OrganizacaoMontePizza)
    const selectTamanho = document.querySelectorAll("select.np-select")[0];
    fireEvent.change(selectTamanho, { target: { value: "10" } });

    await waitFor(() => {
      expect(api.criar_monte_pizza).toHaveBeenCalledTimes(1);
    });

    const payload = api.criar_monte_pizza.mock.calls[0][0];
    expect(payload.tamanho_id).toBe(10);
    expect(payload.nome).toBe("Novo Monte Sua Pizza"); // nome padrão quando ainda vazio
  });

  it("não cria um segundo rascunho se o tamanho for trocado de novo (já criou uma vez)", async () => {
    api.criar_monte_pizza.mockResolvedValue({ id: 42 });
    const outroTamanho = { id: 20, nome: "Média", qtd_sabores: 1 };
    api.listar_tamanho.mockResolvedValue([...TAMANHOS, outroTamanho]);

    renderPaginaNova();
    await waitFor(() => expect(api.listar_tamanho).toHaveBeenCalled());

    const selectTamanho = document.querySelectorAll("select.np-select")[0];
    fireEvent.change(selectTamanho, { target: { value: "10" } });
    await waitFor(() => expect(api.criar_monte_pizza).toHaveBeenCalledTimes(1));

    fireEvent.change(selectTamanho, { target: { value: "20" } });

    // useEffect roda de novo (tamanho_id mudou), mas criandoRascunho.current
    // já é true -- não deve criar um segundo produto
    await new Promise((r) => setTimeout(r, 50));
    expect(api.criar_monte_pizza).toHaveBeenCalledTimes(1);
  });

  it("valida nome, tamanho e grade ao clicar em Salvar sem preencher nada", async () => {
    renderPaginaNova();
    await waitFor(() => expect(api.listar_categoria).toHaveBeenCalled());

    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => {
      expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
      expect(screen.getByText("Tamanho é obrigatório")).toBeInTheDocument();
      expect(
        screen.getByText("Grade é obrigatória — sem ela o item não aparece no cardápio")
      ).toBeInTheDocument();
    });
    expect(api.criar_monte_pizza).not.toHaveBeenCalled();
  });

  it("rejeita qtd_sabores_override menor que 1", async () => {
    renderPaginaNova();
    await waitFor(() => expect(api.listar_categoria).toHaveBeenCalled());

    const inputQtd = screen.getByPlaceholderText("Selecione um tamanho");
    fireEvent.change(inputQtd, { target: { value: "0" } });
    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => {
      expect(screen.getByText("Mínimo 1 sabor")).toBeInTheDocument();
    });
  });

  it("carrega produto existente ao editar e preenche os campos", async () => {
    api.buscar_monte_pizza.mockResolvedValue({
      id: 5,
      nome: "Monte Sua Pizza Grande",
      descricao: "desc",
      ativo: true,
      tamanho_id: 10,
      categoria_id: 1,
      grade_id: 1,
      qtd_sabores_override: null,
      permite_borda: true,
      permite_ingrediente: true,
      imagem_url: null,
      sabores: [{ id: 1, nome: "Calabresa", preco: 40.0 }],
    });

    renderPaginaEditando("5");

    await waitFor(() => {
      expect(screen.getByDisplayValue("Monte Sua Pizza Grande")).toBeInTheDocument();
    });
    expect(screen.getByText("Editar Monte Sua Pizza")).toBeInTheDocument();
    // em modo edição, a seção de sabores fica liberada
    expect(screen.getByText("Importar sabores automaticamente")).toBeInTheDocument();
    expect(screen.getByText("Calabresa")).toBeInTheDocument();
    expect(screen.getByText("R$ 40.00")).toBeInTheDocument();
  });

  it("editar produto existente chama editar_monte_pizza (não criar)", async () => {
    api.buscar_monte_pizza.mockResolvedValue({
      id: 5,
      nome: "Monte Sua Pizza Grande",
      descricao: "",
      ativo: true,
      tamanho_id: 10,
      categoria_id: 1,
      grade_id: 1,
      qtd_sabores_override: null,
      permite_borda: true,
      permite_ingrediente: true,
      imagem_url: null,
      sabores: [],
    });
    api.editar_monte_pizza.mockResolvedValue({ mensagem: "ok" });

    renderPaginaEditando("5");
    await waitFor(() => screen.getByDisplayValue("Monte Sua Pizza Grande"));

    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => {
      expect(api.editar_monte_pizza).toHaveBeenCalledTimes(1);
      expect(api.criar_monte_pizza).not.toHaveBeenCalled();
    });
    expect(api.editar_monte_pizza.mock.calls[0][0]).toBe("5");
  });

  it("botão 'Importar sabores automaticamente' chama a API e recarrega o produto", async () => {
    api.buscar_monte_pizza
      .mockResolvedValueOnce({
        id: 5, nome: "MSP", descricao: "", ativo: true, tamanho_id: 10,
        categoria_id: 1, grade_id: 1, qtd_sabores_override: null,
        permite_borda: true, permite_ingrediente: true, imagem_url: null,
        sabores: [],
      })
      .mockResolvedValueOnce({
        id: 5, nome: "MSP", descricao: "", ativo: true, tamanho_id: 10,
        categoria_id: 1, grade_id: 1, qtd_sabores_override: null,
        permite_borda: true, permite_ingrediente: true, imagem_url: null,
        sabores: [{ id: 1, nome: "Calabresa", preco: 40.0 }],
      });
    api.importar_sabores_monte_pizza.mockResolvedValue({ mensagem: "1 sabor(es) importado(s)" });

    renderPaginaEditando("5");
    await waitFor(() => screen.getByText("Importar sabores automaticamente"));

    fireEvent.click(screen.getByText("Importar sabores automaticamente"));

    await waitFor(() => {
      expect(api.importar_sabores_monte_pizza).toHaveBeenCalledWith("5");
    });
    await waitFor(() => {
      expect(screen.getByText("Calabresa")).toBeInTheDocument();
    });
  });

  it("botão 'Atualizar sabores' chama sincronizar e recarrega", async () => {
    api.buscar_monte_pizza.mockResolvedValue({
      id: 5, nome: "MSP", descricao: "", ativo: true, tamanho_id: 10,
      categoria_id: 1, grade_id: 1, qtd_sabores_override: null,
      permite_borda: true, permite_ingrediente: true, imagem_url: null,
      sabores: [{ id: 1, nome: "Calabresa", preco: 40.0 }],
    });
    api.sincronizar_sabores_monte_pizza.mockResolvedValue({ mensagem: "0 removido(s)" });

    renderPaginaEditando("5");
    await waitFor(() => screen.getByText("Atualizar sabores"));

    fireEvent.click(screen.getByText("Atualizar sabores"));

    await waitFor(() => {
      expect(api.sincronizar_sabores_monte_pizza).toHaveBeenCalledWith("5");
    });
  });

  it("adicionar sabor manual fica desabilitado sem seleção, habilita ao escolher", async () => {
    api.buscar_monte_pizza.mockResolvedValue({
      id: 5, nome: "MSP", descricao: "", ativo: true, tamanho_id: 10,
      categoria_id: 1, grade_id: 1, qtd_sabores_override: null,
      permite_borda: true, permite_ingrediente: true, imagem_url: null,
      sabores: [],
    });

    renderPaginaEditando("5");
    await waitFor(() => screen.getByText("Adicionar sabor manualmente"));

    expect(screen.getByText("Adicionar")).toBeDisabled();

    const selects = screen.getAllByDisplayValue("Selecione...");
    // seleciona o primeiro <select> disponível de "sabor para adicionar"
    // (categoria/grade também usam "Selecione...", então filtra pelo que
    // tem as opções de sabores disponíveis)
    const selectSabor = selects.find((s) =>
      Array.from(s.options).some((o) => o.text === "Calabresa")
    );
    fireEvent.change(selectSabor, { target: { value: "1" } });

    expect(screen.getByText("Adicionar")).not.toBeDisabled();
  });

  it("só oferece sabores disponíveis e ainda não vinculados na lista de adicionar", async () => {
    api.buscar_monte_pizza.mockResolvedValue({
      id: 5, nome: "MSP", descricao: "", ativo: true, tamanho_id: 10,
      categoria_id: 1, grade_id: 1, qtd_sabores_override: null,
      permite_borda: true, permite_ingrediente: true, imagem_url: null,
      sabores: [{ id: 1, nome: "Calabresa", preco: 40.0 }], // já vinculado
    });

    renderPaginaEditando("5");
    await waitFor(() => screen.getByText("Adicionar sabor manualmente"));

    const selects = screen.getAllByDisplayValue("Selecione...");
    const selectSabor = selects.find((s) =>
      Array.from(s.options).some((o) => o.text === "Marguerita")
    );
    const opcoes = Array.from(selectSabor.options).map((o) => o.text);

    // Calabresa já está vinculado -> não aparece de novo na lista
    // Bebida Genérica não é disponivel_monte_sua_pizza -> nunca aparece
    expect(opcoes).not.toContain("Calabresa");
    expect(opcoes).not.toContain("Bebida Genérica");
    expect(opcoes).toContain("Marguerita");
  });

  it("remover sabor pede confirmação e, ao confirmar, chama a API e some da tela", async () => {
    api.buscar_monte_pizza.mockResolvedValue({
      id: 5, nome: "MSP", descricao: "", ativo: true, tamanho_id: 10,
      categoria_id: 1, grade_id: 1, qtd_sabores_override: null,
      permite_borda: true, permite_ingrediente: true, imagem_url: null,
      sabores: [{ id: 1, nome: "Calabresa", preco: 40.0 }],
    });
    api.remover_sabor_monte_pizza.mockResolvedValue({ mensagem: "ok" });

    renderPaginaEditando("5");
    await waitFor(() => screen.getByText("Calabresa"));

    fireEvent.click(screen.getByText("Remover"));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(api.remover_sabor_monte_pizza).toHaveBeenCalledWith("5", 1);
    });
    await waitFor(() => {
      expect(screen.getByText("Nenhum sabor vinculado ainda.")).toBeInTheDocument();
    });
  });

  it("não remove o sabor se o usuário cancelar a confirmação", async () => {
    window.confirm.mockReturnValue(false);
    api.buscar_monte_pizza.mockResolvedValue({
      id: 5, nome: "MSP", descricao: "", ativo: true, tamanho_id: 10,
      categoria_id: 1, grade_id: 1, qtd_sabores_override: null,
      permite_borda: true, permite_ingrediente: true, imagem_url: null,
      sabores: [{ id: 1, nome: "Calabresa", preco: 40.0 }],
    });

    renderPaginaEditando("5");
    await waitFor(() => screen.getByText("Calabresa"));

    fireEvent.click(screen.getByText("Remover"));

    expect(api.remover_sabor_monte_pizza).not.toHaveBeenCalled();
    expect(screen.getByText("Calabresa")).toBeInTheDocument();
  });

  it("mostra 'sem preço nesse tamanho' quando o sabor vinculado não tem preço cadastrado", async () => {
    api.buscar_monte_pizza.mockResolvedValue({
      id: 5, nome: "MSP", descricao: "", ativo: true, tamanho_id: 10,
      categoria_id: 1, grade_id: 1, qtd_sabores_override: null,
      permite_borda: true, permite_ingrediente: true, imagem_url: null,
      sabores: [{ id: 1, nome: "Sabor Sem Preço", preco: null }],
    });

    renderPaginaEditando("5");

    await waitFor(() => {
      expect(screen.getByText("— sem preço nesse tamanho")).toBeInTheDocument();
    });
  });
});