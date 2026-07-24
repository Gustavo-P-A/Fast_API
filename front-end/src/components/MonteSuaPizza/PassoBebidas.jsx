export function PassoBebidas({
  bebidas, bebidasEscolhidas, onAlterarQtd,
  precoEstimado, onVoltar, onFinalizar, textoBotaoFinalizar,
}) {
  return (
    <div className="mmp-secao">
      <h3>Que tal uma bebida?</h3>
      <div className="mmp-bebidas-carrossel">
        {bebidas.length === 0 && <p className="np-hint">Nenhuma bebida disponível no momento.</p>}
        {bebidas.map(b => {
          const item = bebidasEscolhidas.find(be => be.item_simples_id === b.id);
          const quantidade = item?.quantidade || 0;
          return (
            <div key={b.id} className="mmp-bebida-card">
              {b.imagem_url
                ? <img src={b.imagem_url} alt={b.nome} />
                : <div className="mmp-sabor-sem-foto">🥤</div>
              }
              <strong>{b.nome}</strong>
              <span>R$ {b.preco.toFixed(2).replace(".", ",")}</span>
              <div className="borda-contador">
                <button type="button" onClick={() => onAlterarQtd(b.id, -1)} disabled={quantidade === 0}>−</button>
                <span>{quantidade}</span>
                <button type="button" onClick={() => onAlterarQtd(b.id, 1)}>+</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sabor-preco-estimado">
        Total estimado: <strong>R$ {precoEstimado.toFixed(2).replace(".", ",")}</strong>
      </div>

      <div className="mmp-botoes-passo">
        <button className="np-btn-ghost" onClick={onVoltar}>Voltar</button>
        <button className="sabor-btn-finalizar ativo" onClick={onFinalizar}>
          {textoBotaoFinalizar}
        </button>
      </div>
    </div>
  );
}
