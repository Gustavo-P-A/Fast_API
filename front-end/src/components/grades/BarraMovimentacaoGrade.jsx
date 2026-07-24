export function BarraMovimentacaoGrade({
  selecionados, grades, gradeDestino, setGradeDestino, movendo,
  onConfirmar, onCancelar,
}) {
  if (selecionados.length === 0) return null;

  return (
    <div className="ap-massa-bar">
      <span className="ap-massa-info">
        {selecionados.length} produto(s) selecionado(s)
      </span>

      <select
        className="ap-select"
        value={gradeDestino}
        onChange={(e) => setGradeDestino(e.target.value)}
      >
        <option value="">Mover para grade...</option>
        {grades.map((g) => (
          <option key={g.id} value={String(g.id)}>
            {g.posicao === 0 ? `⭐ ${g.nome} (Promoção)` : `${g.nome} — Pos. ${g.posicao}`}
          </option>
        ))}
      </select>

      <button className="ap-btn-primary" onClick={onConfirmar} disabled={movendo}>
        {movendo ? "Movendo..." : "Confirmar"}
      </button>

      <button className="ap-btn-ghost" onClick={onCancelar}>
        Cancelar
      </button>
    </div>
  );
}
