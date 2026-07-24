import "../../styles/produto/ToggleAtivo.css";

export function ToggleAtivo({ ativo, onChange }) {
  return (
    <div className="tgl-toggle-wrap">
      <span className="tgl-toggle-label">Status do produto</span>
      <button
        type="button"
        className={`tgl-toggle ${ativo ? "tgl-toggle-on" : "tgl-toggle-off"}`}
        onClick={() => onChange(!ativo)}
      >
        <span className="tgl-toggle-thumb" />
      </button>
      <span className={`tgl-toggle-text ${ativo ? "tgl-toggle-text-on" : "tgl-toggle-text-off"}`}>
        {ativo ? "Ativo" : "Inativo"}
      </span>
    </div>
  );
}