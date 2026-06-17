import { useState } from "react";
import { criar_categoria } from "../../api/auth";

export function ModalCriarCategoria({ onCriado, onCancelar }) {
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleCriar() {
    if (!nome.trim()) { alert("Informe o nome da categoria."); return; }
    setSalvando(true);
    try {
      await criar_categoria(nome.trim());
      onCriado();
    } catch {
      alert("Erro ao criar categoria.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="np-modal-overlay">
      <div className="np-modal">
        <h3 className="np-modal-titulo">Nova Categoria</h3>
        <div className="np-field">
          <label className="np-label">Nome</label>
          <input className="np-input" placeholder="Ex: Salgados" value={nome} onChange={e => setNome(e.target.value)} />
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