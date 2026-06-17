export function ListaPrecos({ precos, tamanhos, onChange, onRemover }) {
  if (precos.length === 0) return null;

  return (
    <div className="np-lista-precos">
      {precos.map((preco, index) => {
        const tamanho = tamanhos.find(t => String(t.id) === String(preco.tamanho_id));
        return (
          <div key={`${preco.tamanho_id}-${index}`} className="np-preco-item">
            <div className="np-preco-info">
              <span className="np-preco-tamanho">{tamanho?.nome ?? "—"}</span>
              <span className="np-preco-detalhe">
                {tamanho ? `${tamanho.qtd_sabores} sabor(es), ${tamanho.qtd_bordas} borda(s)` : ""}
              </span>
            </div>
            <div className="np-preco-valor-wrap">
              <span className="np-preco-rs">R$</span>
              <input
                className="np-input np-input-preco"
                type="number"
                value={preco.preco}
                onChange={e => onChange(index, "preco", e.target.value)}
              />
            </div>
            {onRemover && (
              <button type="button" className="np-btn-remover" onClick={() => onRemover(index)}>✕</button>
            )}
          </div>
        );
      })}
    </div>
  );
}