import { useState } from "react";
import { criar_grade, editar_grade } from "../../api/auth";

export function ModalCriarGrade({ gradeEditando, onCriado, onCancelar }) {
  const isEditing = !!gradeEditando;
  const [nome, setNome] = useState(gradeEditando?.nome || "");
  const [posicao, setPosicao] = useState(gradeEditando ? String(gradeEditando.posicao) : "");
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar() {
    if (!nome.trim() || !posicao) { alert("Preencha todos os campos."); return; }
    setSalvando(true);
    try {
      if (isEditing) {
        await editar_grade(gradeEditando.id, nome.trim(), Number(posicao));
      } else {
        await criar_grade(nome.trim(), Number(posicao));
      }
      onCriado();
    } catch {
      alert(isEditing ? "Erro ao editar grade." : "Erro ao criar grade.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="np-modal-overlay">
      <div className="np-modal">
        <h3 className="np-modal-titulo">{isEditing ? "Editar Grade" : "Nova Grade"}</h3>
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
          <button className="np-btn-primary" onClick={handleSalvar} disabled={salvando}>
            {salvando ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}
