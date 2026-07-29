import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  listar_categoria, listar_grade, listar_tamanho, upload_imagem,
  criar_monte_pizza, editar_monte_pizza, buscar_monte_pizza,
  importar_sabores_monte_pizza, adicionar_sabores_monte_pizza, remover_sabor_monte_pizza,
  sincronizar_sabores_monte_pizza,
  listar_todos_produtos, excluir_categoria, excluir_grade,
} from "../../api/auth";
import { InfoBasicas } from "../../components/produto/InfoBasicas";
import { ModalCriarCategoria } from "../../components/produto/ModalCriarCategoria";
import { ModalCriarGrade } from "../../components/produto/ModalCriarGrade.jsx";
import { OrganizacaoMontePizza } from "../../components/MonteSuaPizza/OrganizacaoMontePizza";
import { SaboresVinculados } from "../../components/MonteSuaPizza/SaboresVinculados";
import { StatusRegrasMontePizza } from "../../components/MonteSuaPizza/StatusRegrasMontePizza";
import "../../styles/admin/NovoProduto.css";

export function NovoMonteSuaPizza() {
  const { id: idDaUrl } = useParams();
  const navigate = useNavigate();
  const [idAtual, setIdAtual] = useState(idDaUrl || null);
  const isEditing = !!idAtual;
  const criandoRascunho = useRef(false);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [tamanho_id, setTamanho_id] = useState("");
  const [grade_id, setGrade_id] = useState("");
  const [categoria_id, setCategoria_id] = useState("");
  const [qtdOverride, setQtdOverride] = useState("");
  const [permiteBorda, setPermiteBorda] = useState(true);
  const [permiteIngrediente, setPermiteIngrediente] = useState(true);
  const [categorias, setCategorias] = useState([]);
  const [grades, setGrades] = useState([]);
  const [tamanhos, setTamanhos] = useState([]);
  const [imagem, setImagem] = useState(null);
  const [imagemAtual, setImagemAtual] = useState(null);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [modal, setModal] = useState(null);
  const [itemEditando, setItemEditando] = useState(null);

  const [sabores, setSabores] = useState([]);
  const [importando, setImportando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [todosSabores, setTodosSabores] = useState([]);
  const [saborParaAdicionar, setSaborParaAdicionar] = useState("");

  async function buscarTodos() {
    const [cats, grs, tams] = await Promise.all([listar_categoria(), listar_grade(), listar_tamanho()]);
    setCategorias(cats || []);
    setGrades(grs || []);
    setTamanhos(tams || []);
  }

  useEffect(() => { buscarTodos(); }, []);

  useEffect(() => {
    listar_todos_produtos().then(setTodosSabores).catch(() => {});
  }, []);

  async function carregarProduto(produtoId) {
    try {
      const data = await buscar_monte_pizza(produtoId);
      setNome(data.nome);
      setDescricao(data.descricao || "");
      setAtivo(data.ativo);
      setTamanho_id(String(data.tamanho_id));
      setCategoria_id(data.categoria_id ? String(data.categoria_id) : "");
      setGrade_id(data.grade_id ? String(data.grade_id) : "");
      setQtdOverride(data.qtd_sabores_override ? String(data.qtd_sabores_override) : "");
      setPermiteBorda(data.permite_borda ?? true);
      setPermiteIngrediente(data.permite_ingrediente ?? true);
      setImagemAtual(data.imagem_url || null);
      setSabores(data.sabores || []);
    } catch { alert("Erro ao carregar Monte Sua Pizza."); }
  }

  useEffect(() => {
    if (!idDaUrl) return;
    carregarProduto(idDaUrl);
  }, [idDaUrl]);

  // Cria um rascunho automaticamente assim que o tamanho é escolhido,
  // pra não precisar salvar manualmente antes de liberar a seção de sabores.
  useEffect(() => {
    if (isEditing || !tamanho_id || criandoRascunho.current) return;

    criandoRascunho.current = true;
    (async () => {
      try {
        const criado = await criar_monte_pizza({
          nome: nome || "Novo Monte Sua Pizza",
          tamanho_id: Number(tamanho_id),
          categoria_id: categoria_id ? Number(categoria_id) : null,
          grade_id: grade_id ? Number(grade_id) : null,
          imagem_url: null,
          descricao: descricao || null,
          ativo,
          qtd_sabores_override: qtdOverride ? Number(qtdOverride) : null,
          permite_borda: permiteBorda,
          permite_ingrediente: permiteIngrediente,
        });
        setIdAtual(criado.id);
        navigate(`/admin/novo-monte-pizza/${criado.id}`, { replace: true });
      } catch {
        criandoRascunho.current = false;
      }
    })();
  }, [tamanho_id]);

  const tamanhoSelecionado = tamanhos.find(t => String(t.id) === tamanho_id);

  async function handleSalvar() {
    const novosErros = {};
    if (!nome) novosErros.nome = "Nome é obrigatório";
    if (!tamanho_id) novosErros.tamanho = "Tamanho é obrigatório";
    if (!grade_id) novosErros.grade = "Grade é obrigatória — sem ela o item não aparece no cardápio";
    if (qtdOverride && Number(qtdOverride) < 1) novosErros.qtdOverride = "Mínimo 1 sabor";
    if (Object.keys(novosErros).length > 0) { setErros(novosErros); return; }

    setSalvando(true);
    try {
      let imagem_url = imagemAtual;
      if (imagem) {
        const data = await upload_imagem(imagem);
        imagem_url = data.url;
      }

      const payload = {
        nome,
        tamanho_id: Number(tamanho_id),
        categoria_id: categoria_id ? Number(categoria_id) : null,
        grade_id: grade_id ? Number(grade_id) : null,
        imagem_url,
        descricao: descricao || null,
        ativo,
        qtd_sabores_override: qtdOverride ? Number(qtdOverride) : null,
        permite_borda: permiteBorda,
        permite_ingrediente: permiteIngrediente,
      };

      if (isEditing) {
        await editar_monte_pizza(idAtual, payload);
        alert("Monte Sua Pizza salvo com sucesso!");
      } else {
        const criado = await criar_monte_pizza(payload);
        setIdAtual(criado.id);
        navigate(`/admin/novo-monte-pizza/${criado.id}`, { replace: true });
        alert("Monte Sua Pizza criado com sucesso!");
      }
    } catch { alert("Erro ao salvar."); }
    finally { setSalvando(false); }
  }

  async function handleImportarAutomatico() {
    setImportando(true);
    try {
      const resultado = await importar_sabores_monte_pizza(idAtual);
      alert(resultado.mensagem);
      await carregarProduto(idAtual);
    } catch {
      alert("Erro ao importar sabores.");
    } finally {
      setImportando(false);
    }
  }

  async function handleSincronizar() {
    setSincronizando(true);
    try {
      const resultado = await sincronizar_sabores_monte_pizza(idAtual);
      alert(resultado.mensagem);
      await carregarProduto(idAtual);
    } catch {
      alert("Erro ao atualizar sabores.");
    } finally {
      setSincronizando(false);
    }
  }

  async function handleAdicionarManual() {
    if (!saborParaAdicionar) return;
    try {
      await adicionar_sabores_monte_pizza(idAtual, [Number(saborParaAdicionar)]);
      setSaborParaAdicionar("");
      await carregarProduto(idAtual);
    } catch {
      alert("Erro ao adicionar sabor.");
    }
  }

  async function handleRemoverSabor(sabor_id) {
    if (!confirm("Remover este sabor do Monte Sua Pizza?")) return;
    try {
      await remover_sabor_monte_pizza(idAtual, sabor_id);
      setSabores(prev => prev.filter(s => s.id !== sabor_id));
    } catch {
      alert("Erro ao remover sabor.");
    }
  }

  const saboresDisponiveisParaAdicionar = todosSabores.filter(
    s => s.disponivel_monte_sua_pizza && !sabores.some(v => v.id === s.id)
  );

  return (
    <div className="np-page">
      <div className="np-header">
        <div>
          <button className="np-btn-voltar" onClick={() => navigate("/admin/produtos")}>← Voltar</button>
          <h1 className="np-titulo">{isEditing ? "Editar Monte Sua Pizza" : "Novo Monte Sua Pizza"}</h1>
          <p className="np-subtitulo">
            {isEditing ? "Edite as informações deste Monte Sua Pizza." : "Preencha as informações para criar um novo Monte Sua Pizza."}
          </p>
        </div>
        <button className="np-btn-primary np-btn-salvar-topo" onClick={handleSalvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>

      <div className="np-grid-principal">
        {/* Coluna esquerda — Info básica + Sabores */}
        <div className="np-coluna">
          <InfoBasicas
            nome={nome} setNome={setNome}
            descricao={descricao} setDescricao={setDescricao}
            imagem={imagem} setImagem={setImagem}
            imagemAtual={imagemAtual}
            erros={erros}
            descricaoObrigatoria={false}
          />

          <SaboresVinculados
            isEditing={isEditing}
            sabores={sabores}
            saboresDisponiveisParaAdicionar={saboresDisponiveisParaAdicionar}
            saborParaAdicionar={saborParaAdicionar}
            setSaborParaAdicionar={setSaborParaAdicionar}
            importando={importando}
            sincronizando={sincronizando}
            onImportarAutomatico={handleImportarAutomatico}
            onSincronizar={handleSincronizar}
            onAdicionarManual={handleAdicionarManual}
            onRemoverSabor={handleRemoverSabor}
          />
        </div>

        {/* Coluna direita — Organização + Status */}
        <div className="np-coluna">
          <OrganizacaoMontePizza
            tamanho_id={tamanho_id} setTamanho_id={setTamanho_id}
            tamanhos={tamanhos} tamanhoSelecionado={tamanhoSelecionado}
            erroTamanho={erros.tamanho}
            qtdOverride={qtdOverride} setQtdOverride={setQtdOverride}
            erroQtdOverride={erros.qtdOverride}
            categoria_id={categoria_id} setCategoria_id={setCategoria_id}
            categorias={categorias}
            onCriarCategoria={() => { setItemEditando(null); setModal("categoria"); }}
            onEditarCategoria={(cat) => { setItemEditando(cat); setModal("categoria"); }}
            onExcluirCategoria={async (cat) => {
              if (!window.confirm(`Excluir a categoria "${cat.nome}"?`)) return;
              try {
                await excluir_categoria(cat.id);
                if (String(categoria_id) === String(cat.id)) setCategoria_id("");
                await buscarTodos();
              } catch (e) { alert(e?.response?.data?.detail || "Erro ao excluir categoria."); }
            }}
            grade_id={grade_id} setGrade_id={setGrade_id}
            grades={grades}
            onCriarGrade={() => { setItemEditando(null); setModal("grade"); }}
            onEditarGrade={(gr) => {
              const original = grades.find(g => g.id === gr.id) || gr;
              setItemEditando(original);
              setModal("grade");
            }}
            onExcluirGrade={async (gr) => {
              const original = grades.find(g => g.id === gr.id) || gr;
              if (!window.confirm(`Excluir a grade "${original.nome}"?`)) return;
              try {
                await excluir_grade(original.id);
                if (String(grade_id) === String(original.id)) setGrade_id("");
                await buscarTodos();
              } catch (e) { alert(e?.response?.data?.detail || "Erro ao excluir grade."); }
            }}
            erroGrade={erros.grade}
          />

          <StatusRegrasMontePizza
            ativo={ativo} setAtivo={setAtivo}
            permiteBorda={permiteBorda} setPermiteBorda={setPermiteBorda}
            permiteIngrediente={permiteIngrediente} setPermiteIngrediente={setPermiteIngrediente}
          />
        </div>
      </div>

      {modal === "categoria" && (
        <ModalCriarCategoria
          categoriaEditando={itemEditando}
          onCriado={async () => { await buscarTodos(); setModal(null); setItemEditando(null); }}
          onCancelar={() => { setModal(null); setItemEditando(null); }}
        />
      )}
      {modal === "grade" && (
        <ModalCriarGrade
          gradeEditando={itemEditando}
          onCriado={async () => { await buscarTodos(); setModal(null); setItemEditando(null); }}
          onCancelar={() => { setModal(null); setItemEditando(null); }}
        />
      )}
    </div>
  );
}
