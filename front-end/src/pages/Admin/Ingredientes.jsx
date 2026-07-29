import { useState, useEffect } from "react";
import "../../styles/admin/Ingredientes.css";
import { listar_item_simples, toggle_status_item_simples, deletar_item_simples } from "../../api/auth";
import { ModalIngrediente } from "../../components/Ingrediente/ModalIngrediente";

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
    <div className="ing-page">
      <div className="ing-header">
        <div>
          <h1 className="ing-titulo">Adicionais</h1>
          <p className="ing-subtitulo">Gerencie os adicionais do cardápio.</p>
        </div>
        <button className="ing-btn-primary" onClick={abrirNovo}>+ Novo Adicional</button>
      </div>

      <div className="ing-card">
        <div className="ing-filtros">
          <input
            className="ing-input"
            placeholder="Buscar por nome..."
            value={filtroNome}
            onChange={e => setFiltroNome(e.target.value)}
          />
          <select className="ing-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
          <button className="ing-btn-ghost" onClick={() => { setFiltroNome(""); setFiltroStatus(""); }}>
            Limpar
          </button>
        </div>

        <div className="ing-resumo-linha">
          <span>{ingredientesFiltrados.length} ingrediente(s)</span>
          <span className="ing-resumo-ativo">{ingredientes.filter(i => i.ativo).length} ativos</span>
          <span className="ing-resumo-inativo">{ingredientes.filter(i => !i.ativo).length} inativos</span>
        </div>

        <div className="ing-table-wrap">
          <table className="ing-table ing-table-ingredientes">
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col className="ing-col-filler" />
            </colgroup>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Preço</th>
                <th className="text-center">Status</th>
                <th className="text-center">Ações</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {carregando && <tr><td colSpan={5} className="ing-vazio">Carregando...</td></tr>}
              {!carregando && ingredientesFiltrados.length === 0 && (
                <tr><td colSpan={5} className="ing-vazio">Nenhum adicional encontrado.</td></tr>
              )}
              {!carregando && ingredientesFiltrados.map(i => (
                <tr key={i.id} className={!i.ativo ? "ing-row-inativo" : ""}>
                  <td className="ing-nome">{i.nome}</td>
                  <td>R$ {i.preco.toFixed(2)}</td>
                  <td className="text-center">
                    <button
                      className={`ing-btn-status ${i.ativo ? "ing-status-ativo" : "ing-status-inativo"}`}
                      onClick={() => handleToggle(i.id)}
                    >
                      {i.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="text-center">
                    <div className="ing-acoes">
                      <button className="ing-btn-edit" onClick={() => abrirEdicao(i)}>Editar</button>
                      <button className="ing-btn-delete" onClick={() => handleDeletar(i.id)}>Excluir</button>
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
        <ModalIngrediente
          ingrediente={ingredienteEditando}
          onSalvo={aoSalvar}
          onCancelar={fecharModal}
        />
      )}
    </div>
  );
}