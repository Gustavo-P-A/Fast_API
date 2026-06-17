const TIPOS = ["Pix", "Cartão de crédito", "Cartão de débito", "Dinheiro"];

export function SecaoPagamento({ selecionado, onSelecionar }) {
  return (
    <div className="secao-pagamento">
      <h2 className="titulo-secao">Forma de pagamento</h2>
      <div className="pagamento-grid">
        {TIPOS.map(tipo => (
          <button
            key={tipo}
            className={`btn-pagamento-item ${selecionado === tipo ? "ativo" : ""}`}
            onClick={() => onSelecionar(tipo)}
          >
            {tipo}
          </button>
        ))}
      </div>
    </div>
  );
}