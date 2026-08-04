export function FiltrosGrades({
  categorias,
  filtroNome, setFiltroNome,
  filtroCategoria, setFiltroCategoria,
  filtroTipo, setFiltroTipo,
  filtroStatus, setFiltroStatus,
  filtroIdMin, setFiltroIdMin,
  filtroIdMax, setFiltroIdMax,
  onLimpar,
}) {
  return (
    <div className="ap-filtros">
      <div className="ap-filtro-nome-linha">
        <input
          className="ap-input"
          placeholder="Buscar por nome..."
          value={filtroNome}
          onChange={e => setFiltroNome(e.target.value)}
        />
      </div>

      <div className="ap-filtro-id">
        <span>ID</span>
        <input
          className="ap-input ap-input-id"
          placeholder="de"
          value={filtroIdMin}
          onChange={e => setFiltroIdMin(e.target.value)}
        />
        <span>até</span>
        <input
          className="ap-input ap-input-id"
          placeholder="9999"
          value={filtroIdMax}
          onChange={e => setFiltroIdMax(e.target.value)}
        />
      </div>

      <select className="ap-select" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
        <option value="">Todas categorias</option>
        {categorias.map(c => <option key={c.id} value={String(c.id)}>{c.nome}</option>)}
      </select>

      <select className="ap-select" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
        <option value="">Todos os tipos</option>
        <option value="sabor">Pizza</option>
        <option value="monte_pizza">Monte Sua Pizza</option>
        <option value="bebida">Bebida</option>
      </select>

      <select className="ap-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
        <option value="">Todos</option>
        <option value="ativo">Ativos</option>
        <option value="inativo">Inativos</option>
      </select>

      <button className="ap-btn-ghost" onClick={onLimpar}>Limpar</button>
    </div>
  );
}