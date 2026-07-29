export function SaboresVinculados({
  isEditing,
  sabores, saboresDisponiveisParaAdicionar,
  saborParaAdicionar, setSaborParaAdicionar,
  importando, sincronizando,
  onImportarAutomatico, onSincronizar, onAdicionarManual, onRemoverSabor,
}) {
  return (
    <div className="np-section">
      <h2 className="np-section-titulo">Sabores disponíveis</h2>

      {!isEditing && (
        <p className="np-hint">Selecione um tamanho ao lado para liberar essa seção.</p>
      )}

      {isEditing && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              className="np-btn-primary"
              onClick={onImportarAutomatico}
              disabled={importando}
            >
              {importando ? "Importando..." : "Importar sabores automaticamente"}
            </button>
            <button
              type="button"
              className="np-btn-ghost"
              onClick={onSincronizar}
              disabled={sincronizando}
            >
              {sincronizando ? "Atualizando..." : "Atualizar sabores"}
            </button>
          </div>
          <p className="np-hint" style={{ marginBottom: 16 }}>
            "Importar" traz sabores novos disponíveis para este tamanho. "Atualizar" remove
            sabores que deixaram de estar disponíveis no Monte Sua Pizza.
          </p>

          <div className="np-grid-2" style={{ marginBottom: 16 }}>
            <div className="np-field">
              <label className="np-label">Adicionar sabor manualmente</label>
              <select
                className="np-select"
                value={saborParaAdicionar}
                onChange={e => setSaborParaAdicionar(e.target.value)}
              >
                <option value="">Selecione...</option>
                {saboresDisponiveisParaAdicionar.map(s => (
                  <option key={s.id} value={String(s.id)}>{s.nome}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="np-btn-ghost"
              style={{ alignSelf: "flex-end" }}
              onClick={onAdicionarManual}
              disabled={!saborParaAdicionar}
            >
              Adicionar
            </button>
          </div>

          <div className="np-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Sabor</th>
                  <th className="text-center">Preço no tamanho</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sabores.length === 0 && (
                  <tr><td colSpan={3} className="ap-vazio">Nenhum sabor vinculado ainda.</td></tr>
                )}
                {sabores.map(s => (
                  <tr key={s.id}>
                    <td>{s.nome}</td>
                    <td className="text-center">
                      {s.preco != null ? `R$ ${s.preco.toFixed(2)}` : "— sem preço nesse tamanho"}
                    </td>
                    <td className="text-center">
                      <button className="ap-btn-delete" onClick={() => onRemoverSabor(s.id)}>Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
