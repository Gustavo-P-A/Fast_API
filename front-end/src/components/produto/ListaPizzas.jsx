export function ListaPizzas({
  produtos, categorias, navigate,
  filtroNome, setFiltroNome, filtroCategoria, setFiltroCategoria, filtroStatus, setFiltroStatus,
  handleDeletar, handleToggle,
}) {
  const produtosFiltrados = produtos.filter(p => {
    const nomeOk = p.nome.toLowerCase().includes(filtroNome.toLowerCase());
    const catOk = filtroCategoria ? String(p.categoria_id) === filtroCategoria : true;
    const statusOk = filtroStatus === "" ? true : filtroStatus === "ativo" ? p.ativo : !p.ativo;
    return nomeOk && catOk && statusOk;
  });

  return (
    <div className="ap-card">
      <div className="ap-filtros">
        <input
          className="ap-input"
          placeholder="Buscar por nome..."
          value={filtroNome}
          onChange={e => setFiltroNome(e.target.value)}
        />
        <select className="ap-select" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
          <option value="">Todas categorias</option>
          {categorias.map(c => <option key={c.id} value={String(c.id)}>{c.nome}</option>)}
        </select>
        <select className="ap-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
        <button className="ap-btn-ghost" onClick={() => { setFiltroNome(""); setFiltroCategoria(""); setFiltroStatus(""); }}>
          Limpar
        </button>
      </div>

      <div className="ap-resumo-linha">
        <span>{produtosFiltrados.length} produto(s)</span>
        <span className="ap-resumo-ativo">{produtos.filter(p => p.ativo).length} ativos</span>
        <span className="ap-resumo-inativo">{produtos.filter(p => !p.ativo).length} inativos</span>
      </div>

      <div className="ap-table-wrap">
        <table className="ap-table ap-table-produtos">
          <colgroup>
            <col />
            <col />
            <col />
            <col />
            <col />
            <col className="ap-col-filler" />
          </colgroup>
          <thead>
            <tr>
              <th>Imagem</th>
              <th>Nome</th>
              <th>Descrição</th>
              <th className="text-center">Status</th>
              <th className="text-center">Ações</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.length === 0 && (
              <tr><td colSpan={6} className="ap-vazio">Nenhum produto encontrado.</td></tr>
            )}
            {produtosFiltrados.map(p => (
              <tr key={p.id} className={!p.ativo ? "ap-row-inativo" : ""}>
                <td>
                  {p.imagem_url
                    ? <img src={p.imagem_url} alt={p.nome} className="ap-thumb" />
                    : <div className="ap-thumb-empty">🍕</div>
                  }
                </td>
                <td className="ap-nome">{p.nome}</td>
                <td className="ap-desc">{p.descricao}</td>
                <td className="text-center">
                  <button
                    className={`ap-btn-status ${p.ativo ? "ap-status-ativo" : "ap-status-inativo"}`}
                    onClick={() => handleToggle(p.id)}
                  >
                    {p.ativo ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td>
                  <div className="ap-acoes">
                    <button className="ap-btn-edit" onClick={() => navigate(`/novo-produto/${p.id}`)}>Editar</button>
                    <button className="ap-btn-delete" onClick={() => handleDeletar(p.id)}>Excluir</button>
                  </div>
                </td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}