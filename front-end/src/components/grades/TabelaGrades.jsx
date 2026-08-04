export function TabelaGrades({
  produtos, categorias, produtoGradeMap, carregando,
  selecionados, todosSelecionados, onSelecionarTodos, onCheckbox,
}) {
  function chaveSelecao(tipo, id) {
    return `${tipo}-${id}`;
  }

  return (
    <div className="ap-table-wrap">
      <table className="ap-table ap-table-grades">
        <colgroup>
          <col />
          <col />
          <col />
          <col />
          <col />
          <col />
          <col />
          <col className="ap-col-filler" />
        </colgroup>

        <thead>
          <tr>
            <th>
              <input type="checkbox" checked={todosSelecionados} onChange={onSelecionarTodos} />
            </th>
            <th>ID</th>
            <th>Produto</th>
            <th>Tipo</th>
            <th>Categoria</th>
            <th>Grade Atual</th>
            <th className="text-center">Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {carregando && (
            <tr><td colSpan={8} className="ap-vazio">Carregando...</td></tr>
          )}

          {!carregando && produtos.length === 0 && (
            <tr><td colSpan={8} className="ap-vazio">Nenhum produto encontrado.</td></tr>
          )}

          {!carregando && produtos.map((p, index) => {
            const selecionado = selecionados.some((s) => s.tipo === p.tipo && s.id === p.id);
            const gradeInfo = produtoGradeMap[chaveSelecao(p.tipo, p.id)];
            const catNome = categorias.find((c) => c.id === p.categoria_id)?.nome || "—";

            return (
              <tr
                key={chaveSelecao(p.tipo, p.id)}
                className={[!p.ativo ? "ap-row-inativo" : "", selecionado ? "ap-row-selecionado" : ""].join(" ")}
              >
                <td>
                  <input type="checkbox" checked={selecionado} onChange={() => onCheckbox(p.tipo, p.id)} />
                </td>

                <td className="ag-id-cell">#{p.numeroExibido}</td>

                <td>
                  <div className="ag-produto-cell">
                    {p.imagem_url
                      ? <img src={p.imagem_url} alt={p.nome} className="ag-thumb" />
                      : <div className="ag-thumb ag-thumb-empty">🍕</div>
                    }
                    <div className="ag-produto-info">
                      <div className="ap-nome">{p.nome}</div>
                    </div>
                  </div>
                </td>

                <td>
                  {p.tipo === "monte_pizza" && <span className="ag-badge-grade">Monte Sua Pizza</span>}
                  {p.tipo === "sabor" && <span className="ag-badge-cat">Pizza</span>}
                  {p.tipo === "bebida" && <span className="ag-badge-cat">Bebida</span>}
                </td>

                <td>
                  <span className="ag-badge-cat">{catNome}</span>
                </td>

                <td>
                  {gradeInfo
                    ? <span className="ag-badge-grade">{gradeInfo.posicao === 0 ? "⭐ " : ""}{gradeInfo.nome}</span>
                    : <span className="ag-sem-grade">Sem grade</span>
                  }
                </td>

                <td className="text-center">
                  <span className={`ag-badge-grade ag-status-badge ${p.ativo ? "" : "ag-status-badge-inativo"}`}>
                    {p.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>

                <td></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}