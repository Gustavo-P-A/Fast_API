import { useState, useEffect } from "react";
import "../../styles/admin/Bordas.css";
import { listar_adicionais, listar_tamanho, toggle_status_adicional, deletar_adicional } from "../../api/auth";
import { ModalBorda } from "../../components/borda/ModalBorda";

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
    <div className="bor-page">
      <div className="bor-header">
        <div>
          <h1 className="bor-titulo">Bordas</h1>
          <p className="bor-subtitulo">Cadastre as bordas e seus preços por tamanho.</p>
        </div>
        <button className="bor-btn-primary" onClick={abrirNova}>+ Nova Borda</button>
      </div>

      <div className="bor-card">
        <div className="bor-table-wrap">
          <table className="bor-table bor-table-bordas">
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col className="bor-col-filler" />
            </colgroup>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Preços por tamanho</th>
                <th className="text-center">Status</th>
                <th className="text-center">Ações</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {carregando && <tr><td colSpan={5} className="bor-vazio">Carregando...</td></tr>}
              {!carregando && bordas.length === 0 && (
                <tr><td colSpan={5} className="bor-vazio">Nenhuma borda cadastrada.</td></tr>
              )}
              {!carregando && bordas.map(b => (
                <tr key={b.id} className={!b.ativo ? "bor-row-inativo" : ""}>
                  <td className="bor-nome">{b.nome}</td>
                  <td>
                    <div className="bor-precos">
                      {b.precos.length === 0 && <span className="bor-ag-sem-grade">Sem preço definido</span>}
                      {b.precos.map(p => (
                        <span key={p.id} className="bor-ag-badge-grade">
                          {p.tamanho_nome}: R$ {p.preco.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-center">
                    <button
                      className={`bor-btn-status ${b.ativo ? "bor-status-ativo" : "bor-status-inativo"}`}
                      onClick={() => handleToggle(b.id)}
                    >
                      {b.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="text-center">
                    <div className="bor-acoes">
                      <button className="bor-btn-edit" onClick={() => abrirEdicao(b)}>Editar</button>
                      <button className="bor-btn-delete" onClick={() => handleDeletar(b.id)}>Excluir</button>
                    </div>
                  </td>
                  <td></td>
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