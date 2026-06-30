import { useState } from "react";
import { criar_adicionais, salvar_preco_adicional } from "../../api/auth";

export function ModalBorda({ borda, tamanhos, onSalvo, onCancelar }) {
  const precosOriginais = Object.fromEntries((borda?.precos || []).map(p => [p.tamanho_id, p]));
  const [nome, setNome] = useState(borda?.nome || "");
  const [precos, setPrecos] = useState(
    Object.fromEntries(tamanhos.map(t => [t.id, precosOriginais[t.id]?.preco ?? ""]))
  );
  const [salvando, setSalvando] = useState(false);

  function setPreco(tamanhoId, valor) {
    setPrecos(prev => ({ ...prev, [tamanhoId]: valor }));
  }

  async function handleSalvar() {
    if (!nome.trim()) { alert("Informe o nome da borda."); return; }
    setSalvando(true);
    try {
      const adicionalId = borda?.id ?? (await criar_adicionais(nome.trim())).id;
      for (const t of tamanhos) {
        const valor = precos[t.id];
        if (valor === "" || valor === null) continue;
        await salvar_preco_adicional(adicionalId, t.id, Number(valor));
      }
      onSalvo();
    } catch {
      alert("Erro ao salvar borda.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="ap-modal-overlay">
      <div className="ap-modal">
        <h3 className="ap-modal-titulo">{borda ? "Editar Borda" : "Nova Borda"}</h3>

        <div className="ap-modal-field">
          <label className="ap-modal-label">Nome</label>
          <input
            className="ap-input"
            placeholder="Ex: Catupiry, Cheddar, Chocolate"
            value={nome}
            disabled={!!borda}
            onChange={e => setNome(e.target.value)}
          />
        </div>

        <div className="ap-modal-field">
          <label className="ap-modal-label">Preço por tamanho</label>
          <div className="ap-modal-grid">
            {tamanhos.map(t => (
              <div key={t.id} className="ap-modal-grid-item">
                <label className="ap-modal-sublabel">{t.nome}</label>
                <input
                  className="ap-input"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={precos[t.id]}
                  onChange={e => setPreco(t.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="ap-modal-acoes">
          <button className="ap-btn-ghost" onClick={onCancelar}>Cancelar</button>
          <button className="ap-btn-primary" onClick={handleSalvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}