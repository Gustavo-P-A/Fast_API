import "../../styles/adminlayout.css";

export function PreviewCardapio({ preview = [] }) {
  return (
    <div className="ag-right">
      <div className="ag-preview-header">
        <span className="ag-preview-icon">👁️</span>
        <div>
          <div className="ag-preview-title">Preview do Cardápio</div>
          <div className="ag-preview-sub">Visualização em tempo real</div>
        </div>
      </div>

      <div className="ag-preview-body">
        {preview.length === 0 && (
          <p className="ag-preview-vazio">Nenhuma grade cadastrada.</p>
        )}
        {preview.map(g => (
          <div key={g.grade_id} className="ag-grade-group">
            <div className="ag-grade-titulo">
              {g.posicao === 0 ? "⭐ " : "🍕 "}
              {g.grade_nome.toUpperCase()}
            </div>

            {g.produtos.length === 0 && (
              <p className="ag-preview-vazio-grade">Nenhum produto nesta grade.</p>
            )}

            {g.produtos.map(p => (
              <div key={p.id} className="ag-preview-item">
                {p.imagem_url
                  ? <img src={p.imagem_url} alt={p.nome} className="ag-preview-thumb" />
                  : <div className="ag-preview-thumb-vazio">🍕</div>
                }
                <div className="ag-preview-info">
                  <div className="ag-preview-nome">{p.nome}</div>
                  <div className="ag-preview-desc">{p.descricao}</div>
                  {p.menor_preco && (
                    <div className="ag-preview-preco">
                      R$ {Number(p.menor_preco).toFixed(2).replace(".", ",")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="ag-preview-footer">
        O preview reflete os produtos ativos e visíveis no cardápio.
      </div>
    </div>
  );
}