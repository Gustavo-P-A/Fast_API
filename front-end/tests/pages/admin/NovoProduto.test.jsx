import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NovoProduto } from "../../../src/pages/Admin/NovoProduto";

// ── Mock da camada de API ──
// NovoProduto.jsx importa várias funções de "../api/auth". Em vez de
// deixar essas chamadas tentarem acertar um backend de verdade (que
// não existe durante o teste), a gente substitui o módulo inteiro por
// versões falsas que devolvem dado pronto na hora.
//
// O caminho no vi.mock() precisa ser o MESMO caminho usado dentro do
// arquivo que está sendo testado (relativo ao arquivo de origem,
// não ao teste) -- é assim que o Vitest sabe qual import interceptar.
vi.mock("../../../src/api/auth", () => ({
  listar_categoria: vi.fn(),
  listar_grade: vi.fn(),
  listar_tamanho: vi.fn(),
  criar_novo_produto: vi.fn(),
  editar_produto: vi.fn(),
  listar_novo_produto: vi.fn(),
  admin_tamanho: vi.fn(),
  upload_imagem: vi.fn(),
}));

import * as api from "../../../src/api/auth";

// NovoProduto usa useNavigate/useParams do react-router-dom, então
// precisa ser renderizado dentro de um <MemoryRouter> -- fora de um
// Router, esses hooks quebram com erro.
function renderPagina() {
  return render(
    <MemoryRouter>
      <NovoProduto />
    </MemoryRouter>
  );
}

describe("NovoProduto (página + componentes filhos juntos)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Respostas padrão para o carregamento inicial da página
    // (buscarTodos() chama essas 3 em paralelo no useEffect)
    api.listar_categoria.mockResolvedValue([{ id: 1, nome: "Pizzas Salgadas" }]);
    api.listar_grade.mockResolvedValue([{ id: 1, nome: "Grade Padrão", posicao: 1 }]);
    api.listar_tamanho.mockResolvedValue([{ id: 1, nome: "Grande" }]);
  });

  it("carrega categorias e grades da API ao montar a página", async () => {
    renderPagina();

    // Espera o useEffect terminar de buscar os dados e popular o
    // <select> renderizado pelo componente filho SelectComCriar
    await waitFor(() => {
      expect(screen.getByText("Pizzas Salgadas")).toBeInTheDocument();
    });

    expect(api.listar_categoria).toHaveBeenCalledTimes(1);
    expect(api.listar_grade).toHaveBeenCalledTimes(1);
  });

  it("mostra erro de validação e NÃO chama a API se salvar sem preencher nada", async () => {
    renderPagina();
    await waitFor(() => expect(api.listar_categoria).toHaveBeenCalled());

    fireEvent.click(screen.getByText("Salvar Produto"));

    await waitFor(() => {
      expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
    });
    expect(api.criar_novo_produto).not.toHaveBeenCalled();
  });

  it("cria o produto com sucesso ao preencher nome, descrição, categoria, grade e um preço", async () => {
    // Este teste passa pela página inteira E pelos componentes filhos
    // reais (InfoBasicas, FormPrecos, SelectComCriar...) exatamente
    // como o usuário usaria no navegador -- não estamos testando
    // cada componente isolado aqui, e sim a integração entre eles.
    api.criar_novo_produto.mockResolvedValue({ mensagem: "ok" });

    renderPagina();
    await waitFor(() => expect(api.listar_categoria).toHaveBeenCalled());
    // espera os <select> de categoria/grade serem populados
    await screen.findByText("Pizzas Salgadas");

    fireEvent.change(screen.getByPlaceholderText(/Pizza Calabresa Especial/i), {
      target: { value: "Pizza Calabresa" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Molho de tomate/i), {
      target: { value: "Calabresa e cebola" },
    });

    // categoria e grade usam <select> renderizados pelo SelectComCriar;
    // pegamos todos os <select> da tela na ordem em que aparecem no JSX
    const selects = document.querySelectorAll("select");
    const [selectCategoria, selectGrade, selectTamanho] = selects;
    fireEvent.change(selectCategoria, { target: { value: "1" } });
    fireEvent.change(selectGrade, { target: { value: "1" } });

    // preço: seleciona o tamanho e digita o valor, depois clica em
    // "+ Adicionar preço" (dentro de FormPrecos)
    fireEvent.change(selectTamanho, { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: 35,90/i), {
      target: { value: "45,90" },
    });
    fireEvent.click(screen.getByText("+ Adicionar preço"));

    fireEvent.click(screen.getByText("Salvar Produto"));

    await waitFor(() => {
      expect(api.criar_novo_produto).toHaveBeenCalledTimes(1);
    });

    // Confere os argumentos principais enviados pra API --
    // (nome, descricao, ativo, categoria_id, grade_id, precos, ...)
    const chamada = api.criar_novo_produto.mock.calls[0];
    expect(chamada[0]).toBe("Pizza Calabresa");
    expect(chamada[1]).toBe("Calabresa e cebola");
    expect(chamada[5]).toEqual([{ tamanho_id: 1, preco: 45.9 }]);
  });
});