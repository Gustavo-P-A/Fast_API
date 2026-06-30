import { useState, useEffect } from "react";
import { listar_adicionais, listar_tamanho, toggle_status_adicional, deletar_adicional } from "../../api/auth";
import { ModalBorda } from "../../components/borda/ModalBorda";
import "../../styles/AdminPaginas.css";

export function AdminBordas() {
  const [bordas, setBordas] = useState([]);
  const [tamanhos, setTamanhos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [bordaEditando, setBordaEditando] = useState(null);
  const [carregando, setCarregando] = useState(true);

  async function buscar() {
    setCarregando(true);
    try {
      const [b, t] = await Promise.all([listar_adicionais(), listar_tamanho()]);
      setBordas(b);
      setTamanhos(t);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { buscar(); }, []);

  function abrirNova() { setBordaEditando(null); setModalAberto(true); }
  function abrirEdicao(borda) { setBordaEditando(borda); setModalAberto(true); }
  function fecharModal() { setModalAberto(false); }
  async function aoSalvar() { fecharModal(); await buscar(); }

  async function handleToggle(id) {
    try {
      const data = await toggle_status_adicional(id);
      setBordas(prev => prev.map(b => b.id === id ? { ...b, ativo: data.ativo } : b));
    } catch {
      alert("Erro ao alterar status.");
    }
  }

  async function handleDeletar(id) {
    if (!confirm("Deseja realmente excluir esta borda?")) return;
    try {
      await deletar_adicional(id);
      setBordas(prev => prev.filter(b => b.id !== id));
    } catch {
      alert("Erro ao excluir borda.");
    }
  }

  return (
    <div className="ap-page">
      <div className="ap-header">
        <div>
          <h1 className="ap-titulo">Bordas</h1>
          <p className="ap-subtitulo">Cadastre as bordas e seus preços por tamanho.</p>
        </div>
        <button className="ap-btn-primary" onClick={abrirNova}>+ Nova Borda</button>
      </div>

      <div className="ap-card">
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Preços por tamanho</th>
                <th className="text-center">Status</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando && <tr><td colSpan={4} className="ap-vazio">Carregando...</td></tr>}
              {!carregando && bordas.length === 0 && (
                <tr><td colSpan={4} className="ap-vazio">Nenhuma borda cadastrada.</td></tr>
              )}
              {!carregando && bordas.map(b => (
                <tr key={b.id} className={!b.ativo ? "ap-row-inativo" : ""}>
                  <td className="ap-nome">{b.nome}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {b.precos.length === 0 && <span className="ag-sem-grade">Sem preço definido</span>}
                      {b.precos.map(p => (
                        <span key={p.id} className="ag-badge-grade">
                          {p.tamanho_nome}: R$ {p.preco.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-center">
                    <button
                      className={`ap-btn-status ${b.ativo ? "ap-status-ativo" : "ap-status-inativo"}`}
                      onClick={() => handleToggle(b.id)}
                    >
                      {b.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="text-center">
                    <div className="ap-acoes">
                      <button className="ap-btn-edit" onClick={() => abrirEdicao(b)}>Editar</button>
                      <button className="ap-btn-delete" onClick={() => handleDeletar(b.id)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <ModalBorda
          borda={bordaEditando}
          tamanhos={tamanhos}
          onSalvo={aoSalvar}
          onCancelar={fecharModal}
        />
      )}
    </div>
  );
}