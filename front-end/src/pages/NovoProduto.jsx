import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  listar_categoria, listar_grade, listar_tamanho,
  criar_novo_produto, editar_produto, listar_novo_produto,
  admin_tamanho, upload_imagem
} from "../api/auth";
import { InfoBasicas } from "../components/produto/InfoBasicas";
import { SelectComCriar } from "../components/produto/SelectComCriar";
import { ToggleAtivo } from "../components/produto/ToggleAtivo";
import { FormPrecos } from "../components/produto/FormPrecos";
import { ListaPrecos } from "../components/produto/ListaPrecos";
import { ModalTamanho } from "../components/produto/ModalTamanho";
import { ModalCriarCategoria } from "../components/produto/ModalCriarCategoria";
import { ModalCriarGrade } from "../components/produto/ModalCriarGrade.jsx";
import "../styles/NovoProduto.css";

export function NovoProduto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [grade_id, setGrade_id] = useState("");
  const [categoria_id, setCategoria_id] = useState("");
  const [precos, setPrecos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [grades, setGrades] = useState([]);
  const [tamanhos, setTamanhos] = useState([]);
  const [imagem, setImagem] = useState(null);
  const [imagemAtual, setImagemAtual] = useState(null);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [modal, setModal] = useState(null); // 'tamanho' | 'categoria' | 'grade'

  async function buscarTodos() {
    const [cats, grs, tams] = await Promise.all([listar_categoria(), listar_grade(), listar_tamanho()]);
    setCategorias(cats || []);
    setGrades(grs || []);
    setTamanhos(tams || []);
  }

  useEffect(() => { buscarTodos(); }, []);

  useEffect(() => {
    if (!id || grades.length === 0) return;
    async function carregar() {
      try {
        const data = await listar_novo_produto(id);
        setNome(data.nome);
        setDescricao(data.descricao);
        setAtivo(data.ativo);
        setCategoria_id(String(data.categoria_id));
        setGrade_id(String(data.grade_id));
        setImagemAtual(data.imagem_url || null);
        setPrecos((data.precos || []).map(p => ({ ...p, tamanho_id: String(p.tamanho_id) })));
      } catch { alert("Erro ao carregar produto."); }
    }
    carregar();
  }, [id, grades.length]);

  function handleAdicionarPreco({ tamanho_id, preco }) {
    if (precos.some(p => p.tamanho_id === tamanho_id)) {
      alert("Este tamanho já foi adicionado."); return;
    }
    setPrecos(prev => [...prev, { tamanho_id, preco }]);
  }

  function handlePrecoChange(index, field, value) {
    setPrecos(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

  function handleRemoverPreco(index) {
    setPrecos(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSalvar() {
    const novosErros = {};
    if (!nome) novosErros.nome = "Nome é obrigatório";
    if (!descricao) novosErros.descricao = "Descrição é obrigatória";
    if (!categoria_id) novosErros.categoria = "Categoria é obrigatória";
    if (!grade_id) novosErros.grade = "Grade é obrigatória";
    if (precos.length === 0) novosErros.precos = "Adicione pelo menos 1 preço";
    if (Object.keys(novosErros).length > 0) { setErros(novosErros); return; }

    setSalvando(true);
    try {
      let imagem_url = imagemAtual;
      if (imagem) {
        const data = await upload_imagem(imagem);
        imagem_url = data.url;
      }

      const precosParaEnviar = precos.map(p => ({
        tamanho_id: Number(p.tamanho_id),
        preco: Number(String(p.preco).replace(",", ".")),
      }));

      if (isEditing) {
        await editar_produto(id, nome, descricao, ativo, Number(grade_id), Number(categoria_id), precosParaEnviar, imagem_url);
        alert("Produto atualizado com sucesso!");
      } else {
        await criar_novo_produto(nome, descricao, ativo, Number(categoria_id), Number(grade_id), precosParaEnviar, imagem_url);
        alert("Produto criado com sucesso!");
        navigate("/admin/produtos");
      }
    } catch { alert("Erro ao salvar o produto."); }
    finally { setSalvando(false); }
  }

  return (
    <div className="np-page">
      {/* Header */}
      <div className="np-header">
        <div>
          <button className="np-btn-voltar" onClick={() => navigate("/admin/produtos")}>← Voltar</button>
          <h1 className="np-titulo">{isEditing ? "Editar Produto" : "Novo Produto"}</h1>
          <p className="np-subtitulo">{isEditing ? "Edite as informações do produto." : "Preencha as informações para criar um novo produto."}</p>
        </div>
        <button className="np-btn-primary np-btn-salvar-topo" onClick={handleSalvar} disabled={salvando}>
          {salvando ? "Salvando..." : isEditing ? "Salvar Alterações" : "Salvar Produto"}
        </button>
      </div>

      <div className="np-grid-principal">
        {/* Coluna esquerda */}
        <div className="np-coluna">
          <InfoBasicas
            nome={nome} setNome={setNome}
            descricao={descricao} setDescricao={setDescricao}
            imagem={imagem} setImagem={setImagem}
            imagemAtual={imagemAtual}
            erros={erros}
          />

          <div className="np-section">
            <h2 className="np-section-titulo">Organização</h2>
            <div className="np-grid-2">
              <SelectComCriar
                label="Categoria *"
                valor={categoria_id}
                onChange={setCategoria_id}
                opcoes={categorias}
                onCriar={() => setModal("categoria")}
                erro={erros.categoria}
              />
              <SelectComCriar
                label="Grade (posição no site) *"
                valor={grade_id}
                onChange={setGrade_id}
                opcoes={grades.map(g => ({ ...g, nome: `${g.nome} — Posição ${g.posicao}` }))}
                onCriar={() => setModal("grade")}
                erro={erros.grade}
              />
            </div>
          </div>

          <div className="np-section">
            <ToggleAtivo ativo={ativo} onChange={setAtivo} />
          </div>
        </div>

        {/* Coluna direita */}
        <div className="np-coluna">
          <FormPrecos tamanhos={tamanhos} onAdicionar={handleAdicionarPreco} onNovoTamanho={() => setModal("tamanho")} />
          {erros.precos && <span className="np-erro">{erros.precos}</span>}
          <ListaPrecos precos={precos} tamanhos={tamanhos} onChange={handlePrecoChange} onRemover={handleRemoverPreco} />
        </div>
      </div>

      {/* Modais */}
      {modal === "tamanho" && (
        <ModalTamanho
          onCriar={async (nome, qtdSabores, qtdBordas) => {
            await admin_tamanho(nome, qtdSabores, qtdBordas);
            await buscarTodos();
            setModal(null);
          }}
          onCancelar={() => setModal(null)}
        />
      )}
      {modal === "categoria" && (
        <ModalCriarCategoria onCriado={async () => { await buscarTodos(); setModal(null); }} onCancelar={() => setModal(null)} />
      )}
      {modal === "grade" && (
        <ModalCriarGrade onCriado={async () => { await buscarTodos(); setModal(null); }} onCancelar={() => setModal(null)} />
      )}
    </div>
  );
}