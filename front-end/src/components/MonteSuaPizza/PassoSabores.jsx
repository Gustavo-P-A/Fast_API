export function PassoSabores({
  sabores, qtdMax, saboresEscolhidos, onToggleSabor, podeAvancar, onContinuar,
}) {
  return (
    <div className="mmp-secao">
      <h3>Escolha até {qtdMax} sabor(es) — {saboresEscolhidos.length}/{qtdMax}</h3>
      <div className="mmp-sabores-grid">
        {sabores.map(s => {
          const selecionado = saboresEscolhidos.includes(s.id);
          const bloqueado = !selecionado && saboresEscolhidos.length >= qtdMax;
          return (
            <button
              key={s.id}
              type="button"
              className={`mmp-sabor-card ${selecionado ? "mmp-sabor-selecionado" : ""} ${bloqueado ? "mmp-sabor-bloqueado" : ""}`}
              onClick={() => onToggleSabor(s.id)}
              disabled={bloqueado}
            >
              {s.imagem_url
                ? <img src={s.imagem_url} alt={s.nome} />
                : <div className="mmp-sabor-sem-foto">🍕</div>
              }
              <strong>{s.nome}</strong>
              <span>R$ {s.preco.toFixed(2).replace(".", ",")}</span>
            </button>
          );
        })}
      </div>
      <button
        className={`sabor-btn-finalizar ${podeAvancar ? "ativo" : ""}`}
        disabled={!podeAvancar}
        onClick={onContinuar}
      >
        Continuar
      </button>
    </div>
  );
}
