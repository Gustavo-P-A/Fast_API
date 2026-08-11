import { describe, it, expect, beforeEach } from "vitest";
import { useContext } from "react";
import { renderHook, act } from "@testing-library/react";
import { CartProvider } from "../../src/contexts/CartProvider";
import { CartContext } from "../../src/contexts/CartContext";
import { precoItemCarrinho } from "../../src/contexts/carrinhoCalculos";

function useCarrinho() {
  return useContext(CartContext);
}

function renderCarrinho() {
  return renderHook(() => useCarrinho(), { wrapper: CartProvider });
}

const ITEM_BASE = {
  tamanho_id: 10,
  sabor_ids: [1],
  sabor_nomes: ["Calabresa"],
  preco_sabor: 40,
  qtd_bordas: 2,
  bordas: [],
  ingredientes: [],
};

beforeEach(() => {
  localStorage.clear();
});

describe("CartProvider", () => {
  it("começa vazio quando não há nada salvo", () => {
    const { result } = renderCarrinho();
    expect(result.current.vazio).toBe(true);
    expect(result.current.itens).toEqual([]);
    expect(result.current.bebidas).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it("adicionarItem inclui o item e gera um id único", () => {
    const { result } = renderCarrinho();

    act(() => result.current.adicionarItem(ITEM_BASE));

    expect(result.current.itens).toHaveLength(1);
    expect(result.current.itens[0].id).toBeTruthy();
    expect(result.current.vazio).toBe(false);
  });

  it("removerItem tira o item pelo id sem afetar os demais", () => {
    const { result } = renderCarrinho();
    act(() => result.current.adicionarItem(ITEM_BASE));
    act(() => result.current.adicionarItem({ ...ITEM_BASE, sabor_nomes: ["Marguerita"] }));

    const idParaRemover = result.current.itens[0].id;
    act(() => result.current.removerItem(idParaRemover));

    expect(result.current.itens).toHaveLength(1);
    expect(result.current.itens[0].sabor_nomes).toEqual(["Marguerita"]);
  });

  it("adicionarBebida cria entrada nova com a quantidade informada", () => {
    const { result } = renderCarrinho();

    act(() => result.current.adicionarBebida({ item_simples_id: 5, nome: "Coca-Cola", preco: 8 }, 2));

    expect(result.current.bebidas).toEqual([
      { item_simples_id: 5, nome: "Coca-Cola", preco: 8, quantidade: 2 },
    ]);
  });

  it("adicionar a mesma bebida de novo soma a quantidade em vez de duplicar", () => {
    const { result } = renderCarrinho();

    act(() => result.current.adicionarBebida({ item_simples_id: 5, nome: "Coca-Cola", preco: 8 }));
    act(() => result.current.adicionarBebida({ item_simples_id: 5, nome: "Coca-Cola", preco: 8 }, 3));

    expect(result.current.bebidas).toHaveLength(1);
    expect(result.current.bebidas[0].quantidade).toBe(4);
  });

  it("alterarQtdBebida soma o delta", () => {
    const { result } = renderCarrinho();
    act(() => result.current.adicionarBebida({ item_simples_id: 5, nome: "Coca-Cola", preco: 8 }, 2));

    act(() => result.current.alterarQtdBebida(5, 1));

    expect(result.current.bebidas[0].quantidade).toBe(3);
  });

  it("alterarQtdBebida remove a bebida quando a quantidade chega a 0", () => {
    const { result } = renderCarrinho();
    act(() => result.current.adicionarBebida({ item_simples_id: 5, nome: "Coca-Cola", preco: 8 }, 1));

    act(() => result.current.alterarQtdBebida(5, -1));

    expect(result.current.bebidas).toEqual([]);
  });

  it("removerBebida tira pelo item_simples_id", () => {
    const { result } = renderCarrinho();
    act(() => result.current.adicionarBebida({ item_simples_id: 5, nome: "Coca-Cola", preco: 8 }));
    act(() => result.current.adicionarBebida({ item_simples_id: 6, nome: "Guaraná", preco: 7 }));

    act(() => result.current.removerBebida(5));

    expect(result.current.bebidas).toHaveLength(1);
    expect(result.current.bebidas[0].item_simples_id).toBe(6);
  });

  it("limparCarrinho esvazia itens e bebidas", () => {
    const { result } = renderCarrinho();
    act(() => result.current.adicionarItem(ITEM_BASE));
    act(() => result.current.adicionarBebida({ item_simples_id: 5, nome: "Coca-Cola", preco: 8 }));

    act(() => result.current.limparCarrinho());

    expect(result.current.vazio).toBe(true);
  });

  it("total soma itens (com bordas/ingredientes) e bebidas", () => {
    const { result } = renderCarrinho();
    act(() =>
      result.current.adicionarItem({
        ...ITEM_BASE,
        bordas: [{ adicional_id: 1, partes: 2, preco: 10 }],
        ingredientes: [{ item_simples_id: 1, quantidade: 2, preco: 3 }],
      })
    );
    act(() => result.current.adicionarBebida({ item_simples_id: 5, nome: "Coca-Cola", preco: 8 }, 2));

    // item: 40 (sabor) + 10 (1 borda cobra preço cheio) + 3*2 (ingredientes) = 56
    // bebidas: 8*2 = 16
    expect(result.current.total).toBe(72);
  });

  it("quantidadeTotal conta 1 por item de pizza + soma das quantidades de bebida", () => {
    const { result } = renderCarrinho();
    act(() => result.current.adicionarItem(ITEM_BASE));
    act(() => result.current.adicionarItem(ITEM_BASE));
    act(() => result.current.adicionarBebida({ item_simples_id: 5, nome: "Coca-Cola", preco: 8 }, 3));

    expect(result.current.quantidadeTotal).toBe(5);
  });

  it("persiste o carrinho no localStorage entre montagens", () => {
    const primeira = renderCarrinho();
    act(() => primeira.result.current.adicionarItem(ITEM_BASE));

    const segunda = renderCarrinho();

    expect(segunda.result.current.itens).toHaveLength(1);
  });

  it("ignora localStorage corrompido e começa vazio", () => {
    localStorage.setItem("pizza_carrinho_v1", "{não é json válido");

    const { result } = renderCarrinho();

    expect(result.current.vazio).toBe(true);
  });
});

describe("precoItemCarrinho", () => {
  it("sem borda nem ingrediente, é só o preço do sabor", () => {
    expect(precoItemCarrinho({ preco_sabor: 40, bordas: [], ingredientes: [] })).toBe(40);
  });

  it("uma única borda cobra o preço cheio dela", () => {
    const item = { preco_sabor: 40, qtd_bordas: 2, bordas: [{ preco: 10, partes: 1 }], ingredientes: [] };
    expect(precoItemCarrinho(item)).toBe(50);
  });

  it("duas bordas são rateadas pelas partes sobre qtd_bordas", () => {
    const item = {
      preco_sabor: 40,
      qtd_bordas: 4,
      bordas: [
        { preco: 8, partes: 2 },
        { preco: 12, partes: 2 },
      ],
      ingredientes: [],
    };
    // 40 + 8*(2/4) + 12*(2/4) = 40 + 4 + 6 = 50
    expect(precoItemCarrinho(item)).toBe(50);
  });

  it("soma preço * quantidade de cada ingrediente extra", () => {
    const item = {
      preco_sabor: 40,
      bordas: [],
      ingredientes: [
        { preco: 3, quantidade: 2 },
        { preco: 5, quantidade: 1 },
      ],
    };
    expect(precoItemCarrinho(item)).toBe(51); // 40 + 6 + 5
  });
});
