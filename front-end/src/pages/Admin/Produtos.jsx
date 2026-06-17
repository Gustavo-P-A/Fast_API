import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  listar_todos_produtos, deletar_sabor,
  toggle_status_produto, listar_categoria,
  listar_grade, mover_produtos_grade
} from "../../api/auth";
import "../../styles/AdminPaginas.css";

export function AdminProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [grades, setGrades] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [selecionados, setSelecionados] = useState([]);
  const [gradeDestino, setGradeDestino] = useState("");
  const [movendo, setMovendo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function buscar() {
      const [prods, cats, grs] = await Promise.all([
        listar_todos_produtos(),
        listar_categoria(),
        listar_grade(),
      ]);
      setProdutos(prods);
      setCategorias(cats);
      setGrades(grs);
    }
    buscar();
  }, []);

  async function handleDeletar(id) {
    if (!confirm("Deseja realmente excluir este produto?")) return;
    await deletar_sabor(id);
    setProdutos(prev => prev.filter(p => p.id !== id));
    setSelecionados(prev => prev.filter(sid => sid !== id));
  }

  async function handleToggle(id) {
    try {
      const data = await toggle_status_produto(id);
      setProdutos(prev => prev.map(p => p.id === id ? { ...p, ativo: data.ativo } : p));
    } catch {
      alert("Erro ao alterar status.");
    }
  }

  function handleCheckbox(id) {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  function handleSelecionarTodos() {
    if (selecionados.length === produtosFiltrados.length) {
      setSelecionados([]);
    } else {
      setSelecionados(produtosFiltrados.map(p => p.id));
    }
  }

  async function handleMoverGrade() {
    if (!gradeDestino) { alert("Selecione a grade destino."); return; }
    if (selecionados.length === 0) { alert("Selecione ao menos um produto."); return; }
    setMovendo(true);
    try {
      await mover_produtos_grade(selecionados, Number(gradeDestino));
      alert(`${selecionados.length} produto(s) movido(s) com sucesso!`);
      setSelecionados([]);
      setGradeDestino("");
    } catch {
      alert("Erro ao mover produtos.");
    } finally {
      setMovendo(false);
    }
  }

  const produtosFiltrados = produtos.filter(p => {
    const nomeOk = p.nome.toLowerCase().includes(filtroNome.toLowerCase());
    const catOk = filtroCategoria ? String(p.categoria_id) === filtroCategoria : true;
    const statusOk = filtroStatus === "" ? true : filtroStatus === "ativo" ? p.ativo : !p.ativo;
    return nomeOk && catOk && statusOk;
  });

  const todosSelecionados = selecionados.length > 0 && selecionados.length === produtosFiltrados.length;

  return (
    <div className="ap-page">
      <div className="ap-header">
        <div>
          <h1 className="ap-titulo">Produtos</h1>
          <p className="ap-subtitulo">Gerencie os produtos do cardápio da sua pizzaria.</p>
        </div>
        <button className="ap-btn-primary" onClick={() => navigate("/novo-produto")}>
          + Novo Produto
        </button>
      </div>

      <div className="ap-card">
        <div className="ap-filtros">
          <input
            className="ap-input"
            placeholder="Buscar por nome..."
            value={filtroNome}
            onChange={e => setFiltroNome(e.target.value)}
          />
          <select className="ap-select" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
            <option value="">Todas categorias</option>
            {categorias.map(c => <option key={c.id} value={String(c.id)}>{c.nome}</option>)}
          </select>
          <select className="ap-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
          <button className="ap-btn-ghost" onClick={() => { setFiltroNome(""); setFiltroCategoria(""); setFiltroStatus(""); }}>
            Limpar
          </button>
        </div>

        {/* Barra de ação em massa — aparece só quando tem selecionados */}
        {selecionados.length > 0 && (
          <div className="ap-massa-bar">
            <span className="ap-massa-info">{selecionados.length} produto(s) selecionado(s)</span>
            <select
              className="ap-select"
              value={gradeDestino}
              onChange={e => setGradeDestino(e.target.value)}
            >
              <option value="">Mover para grade...</option>
              {grades
                .slice()
                .sort((a, b) => a.posicao - b.posicao)
                .map(g => (
                  <option key={g.id} value={String(g.id)}>
                    {g.posicao === 0 ? `⭐ ${g.nome} (Promoção)` : `${g.nome} — Posição ${g.posicao}`}
                  </option>
                ))}
            </select>
            <button className="ap-btn-primary" onClick={handleMoverGrade} disabled={movendo}>
              {movendo ? "Movendo..." : "Confirmar"}
            </button>
            <button className="ap-btn-ghost" onClick={() => setSelecionados([])}>
              Cancelar
            </button>
          </div>
        )}

        <div className="ap-resumo-linha">
          <span>{produtosFiltrados.length} produto(s)</span>
          <span className="ap-resumo-ativo">{produtos.filter(p => p.ativo).length} ativos</span>
          <span className="ap-resumo-inativo">{produtos.filter(p => !p.ativo).length} inativos</span>
        </div>

        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={todosSelecionados}
                    onChange={handleSelecionarTodos}
                    title="Selecionar todos"
                  />
                </th>
                <th>Imagem</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th className="text-center">Status</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.length === 0 && (
                <tr><td colSpan={6} className="ap-vazio">Nenhum produto encontrado.</td></tr>
              )}
              {produtosFiltrados.map(p => (
                <tr key={p.id} className={`${!p.ativo ? "ap-row-inativo" : ""} ${selecionados.includes(p.id) ? "ap-row-selecionado" : ""}`}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selecionados.includes(p.id)}
                      onChange={() => handleCheckbox(p.id)}
                    />
                  </td>
                  <td>
                    {p.imagem_url
                      ? <img src={p.imagem_url} alt={p.nome} className="ap-thumb" />
                      : <div className="ap-thumb-empty">🍕</div>
                    }
                  </td>
                  <td className="ap-nome">{p.nome}</td>
                  <td className="ap-desc">{p.descricao}</td>
                  <td className="text-center">
                    <button
                      className={`ap-btn-status ${p.ativo ? "ap-status-ativo" : "ap-status-inativo"}`}
                      onClick={() => handleToggle(p.id)}
                    >
                      {p.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td>
                    <div className="ap-acoes">
                      <button className="ap-btn-edit" onClick={() => navigate(`/novo-produto/${p.id}`)}>Editar</button>
                      <button className="ap-btn-delete" onClick={() => handleDeletar(p.id)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}