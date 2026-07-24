import { useState, useEffect } from "react";
import { listar_item_simples, toggle_status_item_simples, deletar_item_simples } from "../../api/auth";
import { ModalIngrediente } from "../../components/ingrediente/ModalIngrediente";
import "../../styles/AdminPaginas.css";

export function AdminIngredientes() {
  const [ingredientes, setIngredientes] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [ingredienteEditando, setIngredienteEditando] = useState(null);

  async function buscar() {
    setCarregando(true);
    try {
      const itens = await listar_item_simples("INGREDIENTE");
      setIngredientes(itens);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { buscar(); }, []);

  function abrirNovo() { setIngredienteEditando(null); setModalAberto(true); }
  function abrirEdicao(ingrediente) { setIngredienteEditando(ingrediente); setModalAberto(true); }
  function fecharModal() { setModalAberto(false); }
  async function aoSalvar() { fecharModal(); await buscar(); }

  async function handleToggle(id) {
    try {
      const data = await toggle_status_item_simples(id);
      setIngredientes(prev => prev.map(i => i.id === id ? { ...i, ativo: data.ativo } : i));
    } catch {
      alert("Erro ao alterar status.");
    }
  }

  async function handleDeletar(id) {
    if (!confirm("Deseja realmente excluir este ingrediente?")) return;
    try {
      await deletar_item_simples(id);
      setIngredientes(prev => prev.filter(i => i.id !== id));
    } catch {
      alert("Erro ao excluir ingrediente.");
    }
  }

  const ingredientesFiltrados = ingredientes.filter(i => {
    const nomeOk = i.nome.toLowerCase().includes(filtroNome.toLowerCase());
    const statusOk = filtroStatus === "" ? true : filtroStatus === "ativo" ? i.ativo : !i.ativo;
    return nomeOk && statusOk;
  });

  return (
    <div className="ap-page">
      <div className="ap-header">
        <div>
          <h1 className="ap-titulo">Ingredientes</h1>
          <p className="ap-subtitulo">Gerencie os ingredientes do cardápio.</p>
        </div>
        <button className="ap-btn-primary" onClick={abrirNovo}>+ Novo Ingrediente</button>
      </div>

      <div className="ap-card">
        <div className="ap-filtros">
          <input
            className="ap-input"
            placeholder="Buscar por nome..."
            value={filtroNome}
            onChange={e => setFiltroNome(e.target.value)}
          />
          <select className="ap-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
          <button className="ap-btn-ghost" onClick={() => { setFiltroNome(""); setFiltroStatus(""); }}>
            Limpar
          </button>
        </div>

        <div className="ap-resumo-linha">
          <span>{ingredientesFiltrados.length} ingrediente(s)</span>
          <span className="ap-resumo-ativo">{ingredientes.filter(i => i.ativo).length} ativos</span>
          <span className="ap-resumo-inativo">{ingredientes.filter(i => !i.ativo).length} inativos</span>
        </div>

        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Preço</th>
                <th className="text-center">Status</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando && <tr><td colSpan={4} className="ap-vazio">Carregando...</td></tr>}
              {!carregando && ingredientesFiltrados.length === 0 && (
                <tr><td colSpan={4} className="ap-vazio">Nenhum ingrediente encontrado.</td></tr>
              )}
              {!carregando && ingredientesFiltrados.map(i => (
                <tr key={i.id} className={!i.ativo ? "ap-row-inativo" : ""}>
                  <td className="ap-nome">{i.nome}</td>
                  <td>R$ {i.preco.toFixed(2)}</td>
                  <td className="text-center">
                    <button
                      className={`ap-btn-status ${i.ativo ? "ap-status-ativo" : "ap-status-inativo"}`}
                      onClick={() => handleToggle(i.id)}
                    >
                      {i.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="text-center">
                    <div className="ap-acoes">
                      <button className="ap-btn-edit" onClick={() => abrirEdicao(i)}>Editar</button>
                      <button className="ap-btn-delete" onClick={() => handleDeletar(i.id)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <ModalIngrediente
          ingrediente={ingredienteEditando}
          onSalvo={aoSalvar}
          onCancelar={fecharModal}
        />
      )}
    </div>
  );
}