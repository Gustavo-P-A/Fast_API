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
