import { useState } from "react";

export function ModalTamanho({ onCriar, onCancelar }) {
  const [nome, setNome] = useState("");
  const [qtdSabores, setQtdSabores] = useState("");
  const [qtdBordas, setQtdBordas] = useState("");

  function handleCriar() {
    if (!nome || !qtdSabores || !qtdBordas) { alert("Preencha todos os campos."); return; }
    onCriar(nome, Number(qtdSabores), Number(qtdBordas));
    setNome(""); setQtdSabores(""); setQtdBordas("");
  }

  return (
    <div className="np-modal-overlay">
      <div className="np-modal">
        <h3 className="np-modal-titulo">Novo Tamanho</h3>
        <div className="np-field">
          <label className="np-label">Nome</label>
          <input className="np-input" placeholder="Ex: G, M, P, GG" value={nome} onChange={e => setNome(e.target.value)} />
        </div>
        <div className="np-grid-2">
          <div className="np-field">
            <label className="np-label">Qtd. Sabores</label>
            <input className="np-input" type="number" min="1" placeholder="Ex: 2" value={qtdSabores} onChange={e => setQtdSabores(e.target.value)} />
          </div>
          <div className="np-field">
            <label className="np-label">Qtd. Bordas</label>
            <input className="np-input" type="number" min="0" placeholder="Ex: 1" value={qtdBordas} onChange={e => setQtdBordas(e.target.value)} />
          </div>
        </div>
        <div className="np-modal-acoes">
          <button className="np-btn-ghost" onClick={onCancelar}>Cancelar</button>
          <button className="np-btn-primary" onClick={handleCriar}>Criar</button>
        </div>
      </div>
    </div>
  );
}