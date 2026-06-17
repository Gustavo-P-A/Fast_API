export function SelectComCriar({ label, valor, onChange, opcoes, onCriar, erro }) {
  return (
    <div className="np-field">
      <div className="np-field-header">
        <label className="np-label">{label}</label>
        <button type="button" className="np-btn-link" onClick={onCriar}>
          + Criar novo
        </button>
      </div>
      <select className="np-select" value={valor} onChange={e => onChange(e.target.value)}>
        <option value="">Selecione...</option>
        {opcoes.map(op => (
          <option key={op.id} value={String(op.id)}>{op.nome}</option>
        ))}
      </select>
      {erro && <span className="np-erro">{erro}</span>}
    </div>
  );
}