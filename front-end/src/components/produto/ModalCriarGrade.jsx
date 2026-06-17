import { useState } from "react";
import { criar_grade } from "../../api/auth";

export function ModalCriarGrade({ onCriado, onCancelar }) {
  const [nome, setNome] = useState("");
  const [posicao, setPosicao] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleCriar() {
    if (!nome.trim() || !posicao) { alert("Preencha todos os campos."); return; }
    setSalvando(true);
    try {
      await criar_grade(nome.trim(), Number(posicao));
      onCriado();
    } catch {
      alert("Erro ao criar grade.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="np-modal-overlay">
      <div className="np-modal">
        <h3 className="np-modal-titulo">Nova Grade</h3>
        <div className="np-field">
          <label className="np-label">Nome</label>
          <input className="np-input" placeholder="Ex: Pizza Salgada" value={nome} onChange={e => setNome(e.target.value)} />
        </div>
        <div className="np-field">
          <label className="np-label">Posição no site</label>
          <input className="np-input" type="number" min="0" placeholder="Ex: 1 (0 = topo/promoções)" value={posicao} onChange={e => setPosicao(e.target.value)} />
          <span className="np-hint">Posição 0 = sempre no topo (promoções)</span>
        </div>
        <div className="np-modal-acoes">
          <button className="np-btn-ghost" onClick={onCancelar}>Cancelar</button>
          <button className="np-btn-primary" onClick={handleCriar} disabled={salvando}>
            {salvando ? "Salvando..." : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}