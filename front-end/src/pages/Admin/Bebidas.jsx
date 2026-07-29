import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/admin/Bebidas.css";
import { listar_item_simples, toggle_status_item_simples, deletar_item_simples, listar_categoria } from "../../api/auth";

export function AdminBebidas() {
  const [bebidas, setBebidas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  async function buscar() {
    setCarregando(true);
    try {
      const [itens, cats] = await Promise.all([
        listar_item_simples("BEBIDA"),
        listar_categoria(),
      ]);
      setBebidas(itens);
      setCategorias(cats);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { buscar(); }, []);

  async function handleToggle(id) {
    try {
      const data = await toggle_status_item_simples(id);
      setBebidas(prev => prev.map(b => b.id === id ? { ...b, ativo: data.ativo } : b));
    } catch {
      alert("Erro ao alterar status.");
    }
  }

  async function handleDeletar(id) {
    if (!confirm("Deseja realmente excluir esta bebida?")) return;
    try {
      await deletar_item_simples(id);
      setBebidas(prev => prev.filter(b => b.id !== id));
    } catch {
      alert("Erro ao excluir bebida.");
    }
  }

  const bebidasFiltradas = bebidas.filter(b => {
    const nomeOk = b.nome.toLowerCase().includes(filtroNome.toLowerCase());
    const catOk = filtroCategoria ? String(b.categoria_id) === filtroCategoria : true;
    const statusOk = filtroStatus === "" ? true : filtroStatus === "ativo" ? b.ativo : !b.ativo;
    return nomeOk && catOk && statusOk;
  });

  return (
    <div className="beb-page">
      <div className="beb-header">
        <div>
          <h1 className="beb-titulo">Bebidas</h1>
          <p className="beb-subtitulo">Gerencie as bebidas do cardápio.</p>
        </div>
        <button className="beb-btn-primary" onClick={() => navigate("/admin/nova-bebida")}>
          + Nova Bebida
        </button>
      </div>

      <div className="beb-card">
        <div className="beb-filtros">
          <input
            className="beb-input"
            placeholder="Buscar por nome..."
            value={filtroNome}
            onChange={e => setFiltroNome(e.target.value)}
          />
          <select className="beb-select" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
            <option value="">Todas categorias</option>
            {categorias.map(c => <option key={c.id} value={String(c.id)}>{c.nome}</option>)}
          </select>
          <select className="beb-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
          <button className="beb-btn-ghost" onClick={() => { setFiltroNome(""); setFiltroCategoria(""); setFiltroStatus(""); }}>
            Limpar
          </button>
        </div>

        <div className="beb-resumo-linha">
          <span>{bebidasFiltradas.length} bebida(s)</span>
          <span className="beb-resumo-ativo">{bebidas.filter(b => b.ativo).length} ativas</span>
          <span className="beb-resumo-inativo">{bebidas.filter(b => !b.ativo).length} inativas</span>
        </div>

        <div className="beb-table-wrap">
          <table className="beb-table beb-table-bebidas">
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col />
              <col className="beb-col-filler" />
            </colgroup>
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Nome</th>
                <th>Preço</th>
                <th className="text-center">Status</th>
                <th className="text-center">Ações</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {carregando && <tr><td colSpan={6} className="beb-vazio">Carregando...</td></tr>}
              {!carregando && bebidasFiltradas.length === 0 && (
                <tr><td colSpan={6} className="beb-vazio">Nenhuma bebida encontrada.</td></tr>
              )}
              {!carregando && bebidasFiltradas.map(b => (
                <tr key={b.id} className={!b.ativo ? "beb-row-inativo" : ""}>
                  <td>
                    {b.imagem_url
                      ? <img src={b.imagem_url} alt={b.nome} className="beb-thumb" />
                      : <div className="beb-thumb-empty">🥤</div>
                    }
                  </td>
                  <td className="beb-nome">{b.nome}</td>
                  <td>R$ {b.preco.toFixed(2)}</td>
                  <td className="text-center">
                    <button
                      className={`beb-btn-status ${b.ativo ? "beb-status-ativo" : "beb-status-inativo"}`}
                      onClick={() => handleToggle(b.id)}
                    >
                      {b.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="text-center">
                    <div className="beb-acoes">
                      <button className="beb-btn-edit" onClick={() => navigate(`/admin/nova-bebida/${b.id}`)}>Editar</button>
                      <button className="beb-btn-delete" onClick={() => handleDeletar(b.id)}>Excluir</button>
                    </div>
                  </td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}