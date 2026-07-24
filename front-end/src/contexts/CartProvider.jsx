import { useState, useEffect } from "react";
import { CartContext } from "./CartContext";

const CHAVE_STORAGE = "pizza_carrinho_v1";

function carregarInicial() {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) return { itens: [], bebidas: [] };
    const dado = JSON.parse(bruto);
    return { itens: dado.itens || [], bebidas: dado.bebidas || [] };
  } catch {
    return { itens: [], bebidas: [] };
  }
}

function precoBordas(bordas, qtd_bordas) {
  if (!bordas || bordas.length === 0) return 0;
  if (bordas.length === 1) return bordas[0].preco;
  return bordas.reduce((soma, b) => soma + b.preco * (b.partes / qtd_bordas), 0);
}

function precoIngredientes(ingredientes) {
  if (!ingredientes || ingredientes.length === 0) return 0;
  return ingredientes.reduce((soma, i) => soma + i.preco * i.quantidade, 0);
}

export function precoItemCarrinho(item) {
  return item.preco_sabor + precoBordas(item.bordas, item.qtd_bordas) + precoIngredientes(item.ingredientes);
}

export function CartProvider({ children }) {
  const [carrinho, setCarrinho] = useState(carregarInicial);

  useEffect(() => {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(carrinho));
  }, [carrinho]);

  function adicionarItem(item) {
    const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setCarrinho(prev => ({ ...prev, itens: [...prev.itens, { ...item, id }] }));
  }

  function removerItem(id) {
    setCarrinho(prev => ({ ...prev, itens: prev.itens.filter(i => i.id !== id) }));
  }

  function adicionarBebida(bebida, quantidade = 1) {
    setCarrinho(prev => {
      const existente = prev.bebidas.find(b => b.item_simples_id === bebida.item_simples_id);
      if (existente) {
        return {
          ...prev,
          bebidas: prev.bebidas.map(b =>
            b.item_simples_id === bebida.item_simples_id
              ? { ...b, quantidade: b.quantidade + quantidade }
              : b
          ),
        };
      }
      return { ...prev, bebidas: [...prev.bebidas, { ...bebida, quantidade }] };
    });
  }

  function alterarQtdBebida(item_simples_id, delta) {
    setCarrinho(prev => {
      const atual = prev.bebidas.find(b => b.item_simples_id === item_simples_id);
      if (!atual) return prev;
      const nova = atual.quantidade + delta;
      if (nova <= 0) {
        return { ...prev, bebidas: prev.bebidas.filter(b => b.item_simples_id !== item_simples_id) };
      }
      return {
        ...prev,
        bebidas: prev.bebidas.map(b =>
          b.item_simples_id === item_simples_id ? { ...b, quantidade: nova } : b
        ),
      };
    });
  }

  function removerBebida(item_simples_id) {
    setCarrinho(prev => ({ ...prev, bebidas: prev.bebidas.filter(b => b.item_simples_id !== item_simples_id) }));
  }

  function limparCarrinho() {
    setCarrinho({ itens: [], bebidas: [] });
  }

  const totalItens = carrinho.itens.reduce((soma, item) => soma + precoItemCarrinho(item), 0);
  const totalBebidas = carrinho.bebidas.reduce((soma, b) => soma + b.preco * b.quantidade, 0);
  const total = totalItens + totalBebidas;
  const quantidadeTotal = carrinho.itens.length + carrinho.bebidas.reduce((s, b) => s + b.quantidade, 0);
  const vazio = carrinho.itens.length === 0 && carrinho.bebidas.length === 0;

  return (
    <CartContext.Provider
      value={{
        itens: carrinho.itens,
        bebidas: carrinho.bebidas,
        adicionarItem,
        removerItem,
        adicionarBebida,
        alterarQtdBebida,
        removerBebida,
        limparCarrinho,
        total,
        quantidadeTotal,
        vazio,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
