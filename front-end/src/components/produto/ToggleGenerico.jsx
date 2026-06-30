export function ToggleGenerico({ label, valor, onChange }) {
  return (
    <div className="np-toggle-wrap">
      <span className="np-toggle-label">{label}</span>
      <button
        type="button"
        className={`np-toggle ${valor ? "np-toggle-on" : "np-toggle-off"}`}
        onClick={() => onChange(!valor)}
      >
        <span className="np-toggle-thumb" />
      </button>
      <span className={`np-toggle-text ${valor ? "np-toggle-text-on" : "np-toggle-text-off"}`}>
        {valor ? "Sim" : "Não"}
      </span>
    </div>
  );
}