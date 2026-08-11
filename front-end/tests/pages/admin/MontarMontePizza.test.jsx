import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { MontarMontePizza } from "../../../src/pages/Admin/MontarMontePizza";
import { AuthContext } from "../../../src/contexts/AuthContext";
import { CartContext } from "../../../src/contexts/CartContext";

vi.mock("../../../src/api/auth", () => ({
  buscar_monte_pizza_publico: vi.fn(),
  preco_adicional: vi.fn(),
  itens_simples_publico: vi.fn(),
  tamanhos_publico: vi.fn(),
}));

import * as api from "../../../src/api/auth";

const PRODUTO = {
  id: 1,
  nome: "Monte Sua Pizza",
  descricao: "Escolha até 2 sabores",
  imagem_url: null,
  tamanho_id: 10,
  tamanho_nome: "Grande",
  qtd_sabores: 2,
  permite_borda: true,
  permite_ingrediente: true,
  sabores: [
    { id: 1, nome: "Calabresa", preco: 40, permite_borda: true, permite_ingrediente: true },
    { id: 2, nome: "Marguerita", preco: 35, permite_borda: true, permite_ingrediente: true },
  ],
};

function renderPagina({ usuario = { id: 1, nome: "Fulano" }, adicionarItem = vi.fn(), adicionarBebida = vi.fn() } = {}) {
  render(
    <MemoryRouter initialEntries={["/monte-pizza/1"]}>
      <AuthContext.Provider value={{ usuario }}>
        <CartContext.Provider value={{ adicionarItem, adicionarBebida }}>
          <Routes>
            <Route path="/monte-pizza/:id" element={<MontarMontePizza />} />
            <Route path="/carrinho" element={<div>Página do carrinho</div>} />
            <Route path="/cadastro" element={<div>Página de cadastro</div>} />
          </Routes>
        </CartContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
  return { adicionarItem, adicionarBebida };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.buscar_monte_pizza_publico.mockResolvedValue(PRODUTO);
  api.preco_adicional.mockResolvedValue([{ id: 1, preco: 10, adicional_rel: { id: 100, nome: "Catupiry" } }]);
  api.itens_simples_publico.mockImplementation((tipo) =>
    Promise.resolve(tipo === "BEBIDA" ? [{ id: 5, nome: "Coca-Cola", preco: 8, imagem_url: null }] : [])
  );
  api.tamanhos_publico.mockResolvedValue([{ id: 10, nome: "Grande", qtd_bordas: 2 }]);
});

describe("MontarMontePizza - passo 1 (sabores)", () => {
  it("busca o produto pelo id e mostra o passo de sabores", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText("Monte Sua Pizza")).toBeInTheDocument());
    expect(api.buscar_monte_pizza_publico).toHaveBeenCalledWith("1");
    expect(screen.getByText(/Escolha até 2 sabor\(es\)/)).toBeInTheDocument();
  });

  it("Continuar fica desabilitado sem nenhum sabor escolhido", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());
    expect(screen.getByText("Continuar")).toBeDisabled();
  });

  it("escolher sabores até o limite bloqueia os demais", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Calabresa"));
    fireEvent.click(screen.getByText("Marguerita"));

    expect(screen.getByText("Continuar")).not.toBeDisabled();
    expect(screen.getByText(/2\/2/)).toBeInTheDocument();
  });
});

describe("MontarMontePizza - navegação entre passos", () => {
  it("com borda e ingrediente permitidos, passa por sabores -> borda -> adicionais -> bebidas", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Calabresa"));
    fireEvent.click(screen.getByText("Continuar"));

    await waitFor(() => expect(screen.getByText("Catupiry")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Continuar"));

    // passo 3: ingredientes (lista vazia no mock, mas os botões de navegação continuam lá)
    await waitFor(() => expect(screen.getAllByText("Continuar").length).toBeGreaterThan(0));
    fireEvent.click(screen.getByText("Continuar"));

    // passo 4: bebidas
    await waitFor(() => expect(screen.getByText("Que tal uma bebida?")).toBeInTheDocument());
    expect(screen.getByText("Coca-Cola")).toBeInTheDocument();
  });

  it("voltar do passo de bebidas retorna pro passo anterior", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Calabresa"));
    fireEvent.click(screen.getByText("Continuar"));
    await waitFor(() => expect(screen.getByText("Catupiry")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Continuar"));
    await waitFor(() => expect(screen.getByText("Voltar")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Continuar")); // vai pra bebidas
    await waitFor(() => expect(screen.getByText("Que tal uma bebida?")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Voltar"));

    await waitFor(() => expect(screen.queryByText("Que tal uma bebida?")).not.toBeInTheDocument());
    expect(screen.getByText(/3\. Adicionais/).closest("span")).toHaveClass("mmp-passo-ativo");
  });

  it("sabor que não permite borda pula direto pra ingredientes", async () => {
    api.buscar_monte_pizza_publico.mockResolvedValue({
      ...PRODUTO,
      sabores: [{ id: 1, nome: "Calabresa", preco: 40, permite_borda: false, permite_ingrediente: true }],
    });
    renderPagina();
    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Calabresa"));
    fireEvent.click(screen.getByText("Continuar"));

    await waitFor(() => expect(screen.queryByText("Catupiry")).not.toBeInTheDocument());
  });
});

describe("MontarMontePizza - finalizar", () => {
  async function irAtePasso4() {
    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Calabresa"));
    fireEvent.click(screen.getByText("Continuar"));
    await waitFor(() => expect(screen.getByText("Catupiry")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Continuar"));
    await waitFor(() => expect(screen.getAllByText("Continuar").length).toBeGreaterThan(0));
    fireEvent.click(screen.getByText("Continuar"));
    await waitFor(() => expect(screen.getByText("Que tal uma bebida?")).toBeInTheDocument());
  }

  it("usuário logado: finalizar adiciona a pizza (e bebidas escolhidas) no carrinho", async () => {
    const { adicionarItem, adicionarBebida } = renderPagina();
    await irAtePasso4();

    fireEvent.click(screen.getAllByText("+")[0]); // 1 Coca-Cola
    fireEvent.click(screen.getByText("Adicionar ao Carrinho"));

    expect(adicionarItem).toHaveBeenCalledWith(expect.objectContaining({
      tamanho_id: 10, sabor_ids: [1], sabor_nomes: ["Calabresa"], preco_sabor: 40,
    }));
    expect(adicionarBebida).toHaveBeenCalledWith(
      expect.objectContaining({ item_simples_id: 5, nome: "Coca-Cola" }), 1
    );
    await waitFor(() => expect(screen.getByText("Página do carrinho")).toBeInTheDocument());
  });

  it("visitante vê 'Criar Conta' e é levado pro cadastro sem alterar o carrinho", async () => {
    const { adicionarItem } = renderPagina({ usuario: null });
    await irAtePasso4();

    fireEvent.click(screen.getByText("Criar Conta"));

    expect(adicionarItem).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText("Página de cadastro")).toBeInTheDocument());
  });
});
