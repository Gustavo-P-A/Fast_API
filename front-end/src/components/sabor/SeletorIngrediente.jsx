import "../../styles/sabor/SeletorBorda.css";

export function SeletorIngrediente({ opcoes, ingredientesSelecionados, setIngredientesSelecionados }) {
  if (opcoes.length === 0) return null;

  function getQuantidade(itemId) {
    return ingredientesSelecionados.find(i => i.item_simples_id === itemId)?.quantidade || 0;
  }

  function alterarQuantidade(itemId, delta) {
    setIngredientesSelecionados(prev => {
      const atual = prev.find(i => i.item_simples_id === itemId);
      const nova = (atual?.quantidade || 0) + delta;

      if (nova <= 0) {
        return prev.filter(i => i.item_simples_id !== itemId);
      }
      if (atual) {
        return prev.map(i => i.item_simples_id === itemId ? { ...i, quantidade: nova } : i);
      }
      return [...prev, { item_simples_id: itemId, quantidade: nova }];
    });
  }

  return (
    <div className="sabor-adicionais">
      <h3>Adicionais</h3>
      {opcoes.map(op => {
        const quantidade = getQuantidade(op.id);
        return (
          <div key={op.id} className={`borda-linha ${quantidade > 0 ? "selecionada" : ""}`}>
            <div className="borda-info">
              <strong>{op.nome}</strong>
              <span>+ R$ {op.preco.toFixed(2)}</span>
            </div>
            <div className="borda-contador">
              <button type="button" onClick={() => alterarQuantidade(op.id, -1)} disabled={quantidade === 0}>−</button>
              <span>{quantidade}</span>
              <button type="button" onClick={() => alterarQuantidade(op.id, 1)}>+</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
