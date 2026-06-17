import "../../styles/NovoProduto.css";

export function ToggleAtivo({ ativo, onChange }) {
  return (
    <div className="np-toggle-wrap">
      <span className="np-toggle-label">Status do produto</span>
      <button
        type="button"
        className={`np-toggle ${ativo ? "np-toggle-on" : "np-toggle-off"}`}
        onClick={() => onChange(!ativo)}
      >
        <span className="np-toggle-thumb" />
      </button>
      <span className={`np-toggle-text ${ativo ? "np-toggle-text-on" : "np-toggle-text-off"}`}>
        {ativo ? "Ativo" : "Inativo"}
      </span>
    </div>
  );
}