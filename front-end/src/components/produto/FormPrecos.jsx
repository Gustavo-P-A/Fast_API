import { useState } from "react";

export function FormPrecos({ tamanhos, onAdicionar, onNovoTamanho }) {
  const [tamanhoId, setTamanhoId] = useState("");
  const [precoTemp, setPrecoTemp] = useState("");

  function handleAdicionar() {
    if (!tamanhoId) { alert("Selecione um tamanho."); return; }
    if (!precoTemp) { alert("Informe o preço."); return; }
    const preco = Number(precoTemp.trim().replace(",", ".").replace(/[^0-9.]/g, ""));
    if (isNaN(preco) || preco <= 0) { alert("Preço inválido."); return; }
    onAdicionar({ tamanho_id: String(tamanhoId), preco });
    setTamanhoId(""); setPrecoTemp("");
  }

  return (
    <div className="np-section">
      <div className="np-section-header">
        <h2 className="np-section-titulo" style={{ borderBottom: "none", paddingBottom: 0 }}>
          Tamanhos e Preços
        </h2>
        <button type="button" className="np-btn-link" onClick={onNovoTamanho}>
          + Novo tamanho
        </button>
      </div>

      <div className="np-grid-2">
        <div className="np-field">
          <label className="np-label">Tamanho</label>
          <select className="np-select" value={tamanhoId} onChange={e => setTamanhoId(e.target.value)}>
            <option value="">Selecione...</option>
            {tamanhos.map(t => (
              <option key={t.id} value={String(t.id)}>
                {t.nome} — {t.qtd_sabores} sabor(es), {t.qtd_bordas} borda(s)
              </option>
            ))}
          </select>
        </div>
        <div className="np-field">
          <label className="np-label">Preço (R$)</label>
          <input
            className="np-input"
            type="text"
            placeholder="Ex: 35,90"
            value={precoTemp}
            onChange={e => setPrecoTemp(e.target.value)}
          />
        </div>
      </div>

      <button type="button" className="np-btn-secondary" onClick={handleAdicionar}>
        + Adicionar preço
      </button>
    </div>
  );
}