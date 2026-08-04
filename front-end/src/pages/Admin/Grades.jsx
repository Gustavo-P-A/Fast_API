import { useState, useEffect } from "react";
import "../../styles/admin/AdminLista.css";
import {
  listar_todos_produtos,
  listar_categoria,
  listar_grade,
  listar_produtos_por_grade,
  mover_produtos_grade,
  listar_monte_pizza,
  listar_item_simples,
} from "../../api/auth";
import { PreviewCardapio } from "../../components/grades/PreviewCardapio";
import { FiltrosGrades } from "../../components/grades/FiltrosGrades";
import { BarraMovimentacaoGrade } from "../../components/grades/BarraMovimentacaoGrade";
import { TabelaGrades } from "../../components/grades/TabelaGrades";

export function AdminGrades() {
  const [produtos, setProdutos] = useState([]);
  const [montePizzas, setMontePizzas] = useState([]);
  const [bebidas, setBebidas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [grades, setGrades] = useState([]);
  const [preview, setPreview] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroIdMin, setFiltroIdMin] = useState("");
  const [filtroIdMax, setFiltroIdMax] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [selecionados, setSelecionados] = useState([]);
  const [gradeDestino, setGradeDestino] = useState("");
  const [movendo, setMovendo] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscar();
  }, []);

  async function buscar() {
    setCarregando(true);
    try {
      const [prods, cats, grs, prev, mps, bebs] = await Promise.all([
        listar_todos_produtos(),
        listar_categoria(),
        listar_grade(),
        listar_produtos_por_grade(),
        listar_monte_pizza(),
        listar_item_simples("BEBIDA"),
      ]);

      setProdutos(prods);
      setCategorias(cats);
      setGrades(grs.slice().sort((a, b) => a.posicao - b.posicao));
      setPreview(prev);
      setMontePizzas(mps);
      setBebidas(bebs);
    } finally {
      setCarregando(false);
    }
  }

  const produtoGradeMap = Object.fromEntries(
    preview.flatMap((g) =>
      g.produtos.map((p) => [
        `${p.tipo}-${p.id}`,
        { nome: g.grade_nome, posicao: g.posicao },
      ])
    )
  );

  const listaUnificada = [
    ...produtos.map((p) => ({ ...p, tipo: "sabor" })),
    ...montePizzas.map((mp) => ({
      id: mp.id,
      nome: mp.nome,
      descricao: `${mp.tamanho_nome} — até ${mp.qtd_sabores_efetiva} sabor(es)`,
      imagem_url: mp.imagem_url,
      ativo: mp.ativo,
      categoria_id: mp.categoria_id,
      tipo: "monte_pizza",
    })),
    ...bebidas.map((b) => ({
      id: b.id,
      nome: b.nome,
      descricao: b.descricao || `R$ ${Number(b.preco).toFixed(2)}`,
      imagem_url: b.imagem_url,
      ativo: b.ativo,
      categoria_id: b.categoria_id,
      tipo: "bebida",
    })),
  ];

  const produtosFiltradosBase = listaUnificada.filter((p) => {
    const nomeOk = p.nome.toLowerCase().includes(filtroNome.toLowerCase());
    const catOk = filtroCategoria ? String(p.categoria_id) === filtroCategoria : true;
    const statusOk = filtroStatus === "" ? true : filtroStatus === "ativo" ? p.ativo : !p.ativo;
    const tipoOk = filtroTipo ? p.tipo === filtroTipo : true;
    return nomeOk && catOk && statusOk && tipoOk;
  });

  const produtosNumerados = produtosFiltradosBase.map((p, index) => ({
    ...p,
    numeroExibido: index + 1,
  }));

  const produtosFiltrados = produtosNumerados.filter((p) => {
    const idMinOk = filtroIdMin !== "" ? p.numeroExibido >= Number(filtroIdMin) : true;
    const idMaxOk = filtroIdMax !== "" ? p.numeroExibido <= Number(filtroIdMax) : true;
    return idMinOk && idMaxOk;
  });

  const todosSelecionados =
    produtosFiltrados.length > 0 && selecionados.length === produtosFiltrados.length;

  function handleCheckbox(tipo, id) {
    setSelecionados((prev) => {
      const existe = prev.some((s) => s.tipo === tipo && s.id === id);
      return existe
        ? prev.filter((s) => !(s.tipo === tipo && s.id === id))
        : [...prev, { tipo, id }];
    });
  }

  function handleSelecionarTodos() {
    setSelecionados(
      todosSelecionados ? [] : produtosFiltrados.map((p) => ({ tipo: p.tipo, id: p.id }))
    );
  }

  async function handleMoverGrade() {
    if (!gradeDestino) return alert("Selecione a grade destino.");
    if (!selecionados.length) return alert("Selecione ao menos um produto.");

    setMovendo(true);
    try {
      const sabor_ids = selecionados.filter((s) => s.tipo === "sabor").map((s) => s.id);
      const monte_pizza_ids = selecionados.filter((s) => s.tipo === "monte_pizza").map((s) => s.id);
      const item_simples_ids = selecionados.filter((s) => s.tipo === "bebida").map((s) => s.id);

      await mover_produtos_grade(sabor_ids, Number(gradeDestino), monte_pizza_ids, item_simples_ids);

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
    setFiltroNome("");
    setFiltroCategoria("");
    setFiltroStatus("");
    setFiltroIdMin("");
    setFiltroIdMax("");
    setFiltroTipo("");
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
          <FiltrosGrades
            categorias={categorias}
            filtroNome={filtroNome} setFiltroNome={setFiltroNome}
            filtroCategoria={filtroCategoria} setFiltroCategoria={setFiltroCategoria}
            filtroTipo={filtroTipo} setFiltroTipo={setFiltroTipo}
            filtroStatus={filtroStatus} setFiltroStatus={setFiltroStatus}
            filtroIdMin={filtroIdMin} setFiltroIdMin={setFiltroIdMin}
            filtroIdMax={filtroIdMax} setFiltroIdMax={setFiltroIdMax}
            onLimpar={limparFiltros}
          />

          <BarraMovimentacaoGrade
            selecionados={selecionados}
            grades={grades}
            gradeDestino={gradeDestino}
            setGradeDestino={setGradeDestino}
            movendo={movendo}
            onConfirmar={handleMoverGrade}
            onCancelar={() => setSelecionados([])}
          />

          <div className="ap-resumo-linha">
            <span>{produtosFiltrados.length} produto(s)</span>
          </div>

          <TabelaGrades
            produtos={produtosFiltrados}
            categorias={categorias}
            produtoGradeMap={produtoGradeMap}
            carregando={carregando}
            selecionados={selecionados}
            todosSelecionados={todosSelecionados}
            onSelecionarTodos={handleSelecionarTodos}
            onCheckbox={handleCheckbox}
          />
        </div>
      </div>

      <PreviewCardapio preview={preview} />
    </div>
  );
}