import { SelectComCriar } from "../produto/SelectComCriar";

export function OrganizacaoMontePizza({
  tamanho_id, setTamanho_id, tamanhos, tamanhoSelecionado, erroTamanho,
  qtdOverride, setQtdOverride, erroQtdOverride,
  categoria_id, setCategoria_id, categorias, onCriarCategoria, onEditarCategoria, onExcluirCategoria,
  grade_id, setGrade_id, grades, onCriarGrade, onEditarGrade, onExcluirGrade, erroGrade,
}) {
  return (
    <div className="np-section">
      <h2 className="np-section-titulo">Organização</h2>
      <div className="np-grid-2">
        <div className="np-field">
          <label className="np-label">Tamanho *</label>
          <select className="np-select" value={tamanho_id} onChange={e => setTamanho_id(e.target.value)}>
            <option value="">Selecione...</option>
            {tamanhos.map(t => (
              <option key={t.id} value={String(t.id)}>{t.nome}</option>
            ))}
          </select>
          {erroTamanho && <span className="np-erro">{erroTamanho}</span>}
          {tamanhoSelecionado && (
            <span className="np-hint">Esse tamanho aceita {tamanhoSelecionado.qtd_sabores} sabor(es) por padrão.</span>
          )}
        </div>

        <div className="np-field">
          <label className="np-label">Quantidade de sabores (opcional)</label>
          <input
            className="np-input"
            type="number"
            min="1"
            placeholder={tamanhoSelecionado ? `Padrão: ${tamanhoSelecionado.qtd_sabores}` : "Selecione um tamanho"}
            value={qtdOverride}
            onChange={e => setQtdOverride(e.target.value)}
          />
          {erroQtdOverride && <span className="np-erro">{erroQtdOverride}</span>}
          <span className="np-hint">Deixe em branco para usar o padrão do tamanho selecionado.</span>
        </div>
      </div>

      <div className="np-grid-2">
        <SelectComCriar
          label="Categoria (opcional)"
          valor={categoria_id}
          onChange={setCategoria_id}
          opcoes={categorias}
          onCriar={onCriarCategoria}
          onEditar={onEditarCategoria}
          onExcluir={onExcluirCategoria}
        />
        <SelectComCriar
          label="Grade (posição no site) *"
          valor={grade_id}
          onChange={setGrade_id}
          opcoes={grades.map(g => ({ ...g, nome: `${g.nome} — Posição ${g.posicao}` }))}
          onCriar={onCriarGrade}
          onEditar={onEditarGrade}
          onExcluir={onExcluirGrade}
          erro={erroGrade}
        />
      </div>
    </div>
  );
}
