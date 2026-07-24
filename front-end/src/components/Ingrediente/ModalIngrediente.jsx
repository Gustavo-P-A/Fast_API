import { useState } from "react";
import { criar_item_simples, editar_item_simples } from "../../api/auth";

export function ModalIngrediente({ ingrediente, onSalvo, onCancelar }) {
  const [nome, setNome] = useState(ingrediente?.nome || "");
  const [preco, setPreco] = useState(ingrediente ? String(ingrediente.preco) : "");
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar() {
    if (!nome.trim()) { alert("Informe o nome do ingrediente."); return; }
    if (!preco) { alert("Informe o preço."); return; }

    setSalvando(true);
    try {
      const payload = {
        tipo: "INGREDIENTE",
        nome: nome.trim(),
        categoria_id: null,
        grade_id: null,
        preco: Number(String(preco).replace(",", ".")),
        descricao: null,
        ativo: ingrediente?.ativo ?? true,
        imagem_url: null,
      };

      if (ingrediente) {
        await editar_item_simples(ingrediente.id, payload);
      } else {
        await criar_item_simples(payload);
      }
      onSalvo();
    } catch {
      alert("Erro ao salvar ingrediente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="ap-modal-overlay">
      <div className="ap-modal">
        <h3 className="ap-modal-titulo">{ingrediente ? "Editar Ingrediente" : "Novo Ingrediente"}</h3>

        <div className="ap-modal-field">
          <label className="ap-modal-label">Nome</label>
          <input
            className="ap-input"
            placeholder="Ex: Mussarela, Bacon, Catupiry"
            value={nome}
            onChange={e => setNome(e.target.value)}
          />
        </div>

        <div className="ap-modal-field">
          <label className="ap-modal-label">Preço</label>
          <input
            className="ap-input"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={preco}
            onChange={e => setPreco(e.target.value)}
          />
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