import '../../styles/sabor/SeletorBorda.css';
export function SeletorBorda({ opcoes, qtdBordas, bordasSelecionadas, setBordasSelecionadas }) {
  if (opcoes.length === 0 || qtdBordas === 0) return null;

  const totalEscolhido = bordasSelecionadas.reduce((soma, b) => soma + b.partes, 0);
  const restante = qtdBordas - totalEscolhido;

  function getPartes(adicionalId) {
    return bordasSelecionadas.find(b => b.adicional_id === adicionalId)?.partes || 0;
  }

  function alterarPartes(adicionalId, delta) {
    if (delta > 0 && restante <= 0) return;
    setBordasSelecionadas(prev => {
      const atual = prev.find(b => b.adicional_id === adicionalId);
      const novaQtd = (atual?.partes || 0) + delta;

      if (novaQtd <= 0) {
        return prev.filter(b => b.adicional_id !== adicionalId);
      }
      if (atual) {
        return prev.map(b => b.adicional_id === adicionalId ? { ...b, partes: novaQtd } : b);
      }
      return [...prev, { adicional_id: adicionalId, partes: novaQtd }];
    });
  }

  return (
    <div className="sabor-adicionais">
      <h3>Borda {qtdBordas > 1 ? `(divida em até ${qtdBordas} partes)` : "(opcional)"}</h3>

      <div className="borda-linha borda-linha-sem-borda">
        <div className="borda-info">
          <strong>Sem borda</strong>
          <span className="borda-partes-label">{restante} de {qtdBordas} parte(s)</span>
        </div>
      </div>

      {opcoes.map(op => {
        const partes = getPartes(op.adicional_rel.id);
        return (
          <div key={op.id} className={`borda-linha ${partes > 0 ? "selecionada" : ""}`}>
            <div className="borda-info">
              <strong>{op.adicional_rel.nome}</strong>
              <span>+ R$ {op.preco.toFixed(2)}</span>
              {partes > 0 && <span className="borda-partes-label">{partes} de {qtdBordas} parte(s)</span>}
            </div>
            <div className="borda-contador">
              <button type="button" onClick={() => alterarPartes(op.adicional_rel.id, -1)} disabled={partes === 0}>−</button>
              <span>{partes}</span>
              <button type="button" onClick={() => alterarPartes(op.adicional_rel.id, 1)} disabled={restante <= 0}>+</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}