import { useState, useEffect } from "react";
import {
  listar_todos_produtos, listar_categoria,
  listar_grade, listar_produtos_por_grade, mover_produtos_grade,
} from "../../api/auth";
import { PreviewCardapio } from "../../components/produto/PreviewCardapio";
import "../../styles/AdminPaginas.css";

export function AdminGrades() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [grades, setGrades] = useState([]);
  const [preview, setPreview] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroIdMin, setFiltroIdMin] = useState("");
  const [filtroIdMax, setFiltroIdMax] = useState("");
  const [selecionados, setSelecionados] = useState([]);
  const [gradeDestino, setGradeDestino] = useState("");
  const [movendo, setMovendo] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => { buscar(); }, []);

  async function buscar() {
    setCarregando(true);
    try {
      const [prods, cats, grs, prev] = await Promise.all([
        listar_todos_produtos(), listar_categoria(),
        listar_grade(), listar_produtos_por_grade(),
      ]);
      setProdutos(prods);
      setCategorias(cats);
      setGrades(grs.slice().sort((a, b) => a.posicao - b.posicao));
      setPreview(prev);
    } finally {
      setCarregando(false);
    }
  }

  const produtoGradeMap = Object.fromEntries(
    preview.flatMap(g => g.produtos.map(p => [p.id, { nome: g.grade_nome, posicao: g.posicao }]))
  );

  // ← declaração única com todos os filtros
  const produtosFiltrados = produtos.filter(p => {
    const catOk = filtroCategoria ? String(p.categoria_id) === filtroCategoria : true;
    const statusOk = filtroStatus === "" ? true : filtroStatus === "ativo" ? p.ativo : !p.ativo;
    const idMinOk = filtroIdMin !== "" ? p.id >= Number(filtroIdMin) : true;
    const idMaxOk = filtroIdMax !== "" ? p.id <= Number(filtroIdMax) : true;
    return catOk && statusOk && idMinOk && idMaxOk;
  });

  const todosSelecionados =
    produtosFiltrados.length > 0 && selecionados.length === produtosFiltrados.length;

  function handleCheckbox(id) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  async function handleMoverGrade() {
    if (!gradeDestino) return alert("Selecione a grade destino.");
    if (!selecionados.length) return alert("Selecione ao menos um produto.");
    setMovendo(true);
    try {
      await mover_produtos_grade(selecionados, Number(gradeDestino));
      setSelecionados([]);
      setGradeDestino("");
      await buscar();
    } catch {
      alert("Erro ao mover produtos.");
    } finally {
      setMovendo(false);
    }
  }

  function limparFiltros() {
    setFiltroCategoria("");
    setFiltroStatus("");
    setFiltroIdMin("");
    setFiltroIdMax("");
  }

  return (
    <div className="ag-layout">
      <div className="ag-left">
        <div className="ap-header">
          <div>
            <h1 className="ap-titulo">Grades</h1>
            <p className="ap-subtitulo">Posicionamento dos produtos no cardápio.</p>
          </div>
        </div>

        <div className="ap-card">
          <div className="ap-filtros">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "0.85rem", color: "#888", whiteSpace: "nowrap" }}>ID</span>
              <input
                className="ap-input"
                style={{ width: 70 }}
                type="number"
                placeholder="de"
                value={filtroIdMin}
                onChange={e => setFiltroIdMin(e.target.value)}
              />
              <span style={{ color: "#888", fontSize: "0.85rem" }}>até</span>
              <input
                className="ap-input"
                style={{ width: 70 }}
                type="number"
                placeholder="9999"
                value={filtroIdMax}
                onChange={e => setFiltroIdMax(e.target.value)}
              />
            </div>

            <select className="ap-select" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
              <option value="">Todas categorias</option>
              {categorias.map(c => <option key={c.id} value={String(c.id)}>{c.nome}</option>)}
            </select>

            <select className="ap-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>

            <button className="ap-btn-ghost" onClick={limparFiltros}>Limpar</button>
          </div>

          {selecionados.length > 0 && (
            <div className="ap-massa-bar">
              <span className="ap-massa-info">{selecionados.length} produto(s) selecionado(s)</span>
              <select className="ap-select" value={gradeDestino} onChange={e => setGradeDestino(e.target.value)}>
                <option value="">Mover para grade...</option>
                {grades.map(g => (
                  <option key={g.id} value={String(g.id)}>
                    {g.posicao === 0 ? `⭐ ${g.nome} (Promoção)` : `${g.nome} — Pos. ${g.posicao}`}
                  </option>
                ))}
              </select>
              <button className="ap-btn-primary" onClick={handleMoverGrade} disabled={movendo}>
                {movendo ? "Movendo..." : "Confirmar"}
              </button>
              <button className="ap-btn-ghost" onClick={() => setSelecionados([])}>Cancelar</button>
            </div>
          )}

          <div className="ap-resumo-linha">
            <span>{produtosFiltrados.length} produto(s)</span>
          </div>

          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" checked={todosSelecionados}
                      onChange={() => todosSelecionados ? setSelecionados([]) : setSelecionados(produtosFiltrados.map(p => p.id))} />
                  </th>
                  <th>ID</th>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Grade Atual</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {carregando && <tr><td colSpan={6} className="ap-vazio">Carregando...</td></tr>}
                {!carregando && produtosFiltrados.length === 0 && (
                  <tr><td colSpan={6} className="ap-vazio">Nenhum produto encontrado.</td></tr>
                )}
                {!carregando && produtosFiltrados.map(p => {
                  const gradeInfo = produtoGradeMap[p.id];
                  const catNome = categorias.find(c => c.id === p.categoria_id)?.nome || "—";
                  return (
                    <tr key={p.id} className={[!p.ativo ? "ap-row-inativo" : "", selecionados.includes(p.id) ? "ap-row-selecionado" : ""].join(" ")}>
                      <td><input type="checkbox" checked={selecionados.includes(p.id)} onChange={() => handleCheckbox(p.id)} /></td>
                      <td style={{ color: "#aaa", fontSize: "0.85rem", fontWeight: 600 }}>#{p.id}</td>
                      <td>
                        <div className="ag-produto-cell">
                          {p.imagem_url ? <img src={p.imagem_url} alt={p.nome} className="ap-thumb" /> : <div className="ap-thumb-empty">🍕</div>}
                          <div>
                            <div className="ap-nome">{p.nome}</div>
                            <div className="ap-desc">{p.descricao}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="ag-badge-cat">{catNome}</span></td>
                      <td>
                        {gradeInfo
                          ? <span className="ag-badge-grade">{gradeInfo.posicao === 0 ? "⭐ " : ""}{gradeInfo.nome}</span>
                          : <span className="ag-sem-grade">Sem grade</span>}
                      </td>
                      <td className="text-center">
                        <span className={`ap-btn-status ${p.ativo ? "ap-status-ativo" : "ap-status-inativo"}`}>
                          {p.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PreviewCardapio preview={preview} />
    </div>
  );
}