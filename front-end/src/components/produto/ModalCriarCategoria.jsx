import { useState } from "react";
import { criar_categoria, editar_categoria } from "../../api/auth";

export function ModalCriarCategoria({ categoriaEditando, onCriado, onCancelar }) {
  const isEditing = !!categoriaEditando;
  const [nome, setNome] = useState(categoriaEditando?.nome || "");
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar() {
    if (!nome.trim()) { alert("Informe o nome da categoria."); return; }
    setSalvando(true);
    try {
      if (isEditing) {
        await editar_categoria(categoriaEditando.id, nome.trim());
      } else {
        await criar_categoria(nome.trim());
      }
      onCriado();
    } catch {
      alert(isEditing ? "Erro ao editar categoria." : "Erro ao criar categoria.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="np-modal-overlay">
      <div className="np-modal">
        <h3 className="np-modal-titulo">{isEditing ? "Editar Categoria" : "Nova Categoria"}</h3>
        <div className="np-field">
          <label className="np-label">Nome</label>
          <input className="np-input" placeholder="Ex: Salgados" value={nome} onChange={e => setNome(e.target.value)} />
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
