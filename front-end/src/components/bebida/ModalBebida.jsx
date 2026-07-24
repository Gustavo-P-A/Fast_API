  import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  listar_categoria, listar_grade, criar_item_simples, editar_item_simples,
  upload_imagem, buscar_item_simples
} from "../../api/auth";
import { getImagemUrl } from "../../api/axios";
import { ModalCriarCategoria } from "../produto/ModalCriarCategoria";
import { ModalCriarGrade } from "../produto/ModalCriarGrade";
import { SelectComCriar } from "../produto/SelectComCriar";
import "../../styles/NovoProduto.css";

export function ModalBebida({ tipo, titulo, rotaVoltar, placeholderNome, placeholderDescricao, iconePreview }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const precisaGrade = tipo === "BEBIDA";

  const [nome, setNome] = useState("");
  const [categoria_id, setCategoria_id] = useState("");
  const [grade_id, setGrade_id] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [categorias, setCategorias] = useState([]);
  const [grades, setGrades] = useState([]);
  const [imagem, setImagem] = useState(null);
  const [imagemAtual, setImagemAtual] = useState(null);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false);
  const [modalGradeAberto, setModalGradeAberto] = useState(false);

  async function buscarCategorias() {
    const cats = await listar_categoria();
    setCategorias(cats || []);
  }

  async function buscarGrades() {
    const grs = await listar_grade();
    setGrades(grs || []);
  }

  useEffect(() => {
    buscarCategorias();
    if (precisaGrade) buscarGrades();
  }, []);

  useEffect(() => {
    if (!id) return;
    async function carregar() {
      try {
        const data = await buscar_item_simples(id);
        setNome(data.nome);
        setCategoria_id(String(data.categoria_id));
        if (data.grade_id) setGrade_id(String(data.grade_id));
        setPreco(String(data.preco));
        setDescricao(data.descricao || "");
        setAtivo(data.ativo);
        setImagemAtual(data.imagem_url || null);
      } catch {
        alert("Erro ao carregar item.");
      }
    }
    carregar();
  }, [id]);

  function handleSalvar() {
    const novosErros = {};
    if (!nome.trim()) novosErros.nome = "Nome é obrigatório";
    if (!categoria_id) novosErros.categoria = "Categoria é obrigatória";
    if (precisaGrade && !grade_id) novosErros.grade = "Grade é obrigatória";
    if (!preco) novosErros.preco = "Preço é obrigatório";
    if (Object.keys(novosErros).length > 0) { setErros(novosErros); return; }

    salvar();
  }

  async function salvar() {
    setSalvando(true);
    try {
      let imagem_url = imagemAtual;
      if (imagem) {
        const data = await upload_imagem(imagem);
        imagem_url = data.url;
      }

      const payload = {
        tipo,
        nome: nome.trim(),
        categoria_id: Number(categoria_id),
        grade_id: precisaGrade ? Number(grade_id) : null,
        preco: Number(String(preco).replace(",", ".")),
        descricao: descricao.trim() || null,
        ativo,
        imagem_url,
      };

      if (isEditing) {
        await editar_item_simples(id, payload);
        alert(`${titulo} atualizado com sucesso!`);
      } else {
        await criar_item_simples(payload);
        alert(`${titulo} criado com sucesso!`);
      }
      navigate(rotaVoltar);
    } catch {
      alert(`Erro ao salvar ${titulo.toLowerCase()}.`);
    } finally {
      setSalvando(false);
    }
  }

  const categoriaSelecionada = categorias.find(c => String(c.id) === categoria_id);

  return (
    <div className="np-page">
      <div className="np-header">
        <div>
          <button className="np-btn-voltar" onClick={() => navigate(rotaVoltar)}>← Voltar</button>
          <h1 className="np-titulo">{isEditing ? `Editar ${titulo}` : `Cadastro de Nova ${titulo}`}</h1>
          <p className="np-subtitulo">Preencha os dados abaixo para {isEditing ? "editar" : "adicionar"} {titulo.toLowerCase()} ao cardápio.</p>
        </div>
      </div>

      <div className="np-grid-principal">
        <div className="np-coluna">
          <div className="np-section">
            <h2 className="np-section-titulo">Dados {tipo === "BEBIDA" ? "da Bebida" : "do Ingrediente"}</h2>

            <div className="np-field">
              <label className="np-label">Nome *</label>
              <input
                className="np-input"
                placeholder={placeholderNome}
                value={nome}
                onChange={e => setNome(e.target.value)}
              />
              {erros.nome && <span className="np-erro">{erros.nome}</span>}
            </div>

            <div className="np-grid-2">
              <div className="np-field">
                <div className="np-field-header">
                  <label className="np-label">Categoria *</label>
                  <button type="button" className="np-btn-link" onClick={() => setModalCategoriaAberto(true)}>
                    + Criar nova
                  </button>
                </div>
                <select className="np-select" value={categoria_id} onChange={e => setCategoria_id(e.target.value)}>
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(c => <option key={c.id} value={String(c.id)}>{c.nome}</option>)}
                </select>
                {erros.categoria && <span className="np-erro">{erros.categoria}</span>}
              </div>
              <div className="np-field">
                <label className="np-label">Preço *</label>
                <input
                  className="np-input"
                  type="text"
                  placeholder="0,00"
                  value={preco}
                  onChange={e => setPreco(e.target.value)}
                />
                {erros.preco && <span className="np-erro">{erros.preco}</span>}
              </div>
            </div>

            {precisaGrade && (
              <SelectComCriar
                label="Grade (posição no site) *"
                valor={grade_id}
                onChange={setGrade_id}
                opcoes={grades.map(g => ({ ...g, nome: `${g.nome} — Posição ${g.posicao}` }))}
                onCriar={() => setModalGradeAberto(true)}
                erro={erros.grade}
              />
            )}

            <div className="np-field">
              <label className="np-label">Descrição (opcional)</label>
              <textarea
                className="np-input np-textarea"
                placeholder={placeholderDescricao}
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                maxLength={300}
              />
            </div>

            <div className="np-field">
              <label className="np-label">Status *</label>
              <select className="np-select" value={ativo ? "ativo" : "inativo"} onChange={e => setAtivo(e.target.value === "ativo")}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>

            <div className="np-field">
              <label className="np-label">Imagem {tipo === "BEBIDA" ? "da Bebida" : "do Ingrediente"}</label>
              <div className="np-upload-area" onClick={() => document.getElementById('item-simples-file').click()}>
                {imagem ? (
                  <img src={URL.createObjectURL(imagem)} alt="Preview" className="np-img-preview" />
                ) : imagemAtual ? (
                  <img src={getImagemUrl(imagemAtual)} alt="Atual" className="np-img-preview" />
                ) : (
                  <div className="np-upload-placeholder">
                    <span className="np-upload-icon">📷</span>
                    <span>Clique para enviar uma imagem ou arraste e solte aqui</span>
                    <span className="np-upload-hint">PNG, JPG ou WebP. Máx. 2MB.</span>
                  </div>
                )}
              </div>
              <input
                id="item-simples-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={e => setImagem(e.target.files[0])}
              />
            </div>
          </div>
        </div>

        <div className="np-coluna">
          <div className="np-section">
            <h2 className="np-section-titulo">Pré-visualização</h2>
            <div className="np-preview-card">
              <div className="np-preview-img-wrap">
                {imagem
                  ? <img src={URL.createObjectURL(imagem)} alt="" className="np-preview-img" />
                  : imagemAtual
                    ? <img src={getImagemUrl(imagemAtual)} alt="" className="np-preview-img" />
                    : <span className="np-preview-icon">{iconePreview}</span>
                }
              </div>
              <span className="np-preview-nome">{nome || `Nome ${tipo === "BEBIDA" ? "da Bebida" : "do Ingrediente"}`}</span>
              {categoriaSelecionada && <span className="np-preview-categoria">{categoriaSelecionada.nome}</span>}
              <span className="np-preview-preco">R$ {preco ? Number(String(preco).replace(",", ".")).toFixed(2) : "0,00"}</span>
              <span className={`np-preview-status ${ativo ? "np-status-ativo" : "np-status-inativo"}`}>
                {ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="np-acoes-rodape">
        <button className="np-btn-ghost" onClick={() => navigate(rotaVoltar)}>Cancelar</button>
        <button className="np-btn-primary" onClick={handleSalvar} disabled={salvando}>
          {salvando ? "Salvando..." : `Salvar ${titulo}`}
        </button>
      </div>

      {modalCategoriaAberto && (
        <ModalCriarCategoria
          onCriado={async () => { await buscarCategorias(); setModalCategoriaAberto(false); }}
          onCancelar={() => setModalCategoriaAberto(false)}
        />
      )}

      {modalGradeAberto && (
        <ModalCriarGrade
          onCriado={async () => { await buscarGrades(); setModalGradeAberto(false); }}
          onCancelar={() => setModalGradeAberto(false)}
        />
      )}
    </div>
  );
}