import { useEffect, useState } from "react";
import {
  endereco as listar_enderecos,
  criar_endereco,
  editar_endereco,
  delete_endereco,
} from "../../api/auth";
import "../../styles/perfil/FormasPagamento.css";
import "../../styles/perfil/Enderecos.css";

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

function formatarCep(valorDigitado) {
  const digitos = valorDigitado.replace(/\D/g, "").slice(0, 8);
  return digitos.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

function enderecoResumo(e) {
  return `${e.rua}, ${e.numero}${e.complemento ? ` - ${e.complemento}` : ""}`;
}

function enderecoDetalhe(e) {
  return `${e.bairro} · ${e.cidade}/${e.estado} · CEP ${e.cep}`;
}

export function Enderecos() {
  const [enderecos, setEnderecos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState(false);
  const [formAberto, setFormAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [removendoId, setRemovendoId] = useState(null);

  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErroCarregar(false);
    try {
      const data = await listar_enderecos();
      setEnderecos(data || []);
    } catch {
      setErroCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  function limparForm() {
    setEditandoId(null);
    setRua("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setEstado("");
    setCep("");
    setErros({});
    setErroGeral("");
  }

  function abrirNovo() {
    limparForm();
    setFormAberto(true);
  }

  function abrirEdicao(e) {
    setEditandoId(e.id);
    setRua(e.rua || "");
    setNumero(e.numero || "");
    setComplemento(e.complemento || "");
    setBairro(e.bairro || "");
    setCidade(e.cidade || "");
    setEstado(e.estado || "");
    setCep(e.cep ? formatarCep(e.cep) : "");
    setErros({});
    setErroGeral("");
    setFormAberto(true);
  }

  function fecharForm() {
    limparForm();
    setFormAberto(false);
  }

  async function handleSalvar() {
    const novosErros = {};
    if (!rua.trim()) novosErros.rua = "Informe a rua";
    if (!numero.trim()) novosErros.numero = "Informe o número";
    if (!bairro.trim()) novosErros.bairro = "Informe o bairro";
    if (!cidade.trim()) novosErros.cidade = "Informe a cidade";
    if (!estado.trim()) novosErros.estado = "Selecione o estado";
    if (!cep.trim() || cep.replace(/\D/g, "").length !== 8) novosErros.cep = "CEP inválido";
    if (Object.keys(novosErros).length > 0) { setErros(novosErros); return; }

    const payload = {
      rua: rua.trim(),
      numero: numero.trim(),
      complemento: complemento.trim() || null,
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      estado: estado.trim(),
      cep: cep.replace(/\D/g, ""),
    };

    setSalvando(true);
    setErroGeral("");
    try {
      if (editandoId) {
        await editar_endereco(editandoId, payload);
      } else {
        await criar_endereco(payload);
      }
      await carregar();
      fecharForm();
    } catch (error) {
      setErroGeral(error.response?.data?.detail || `Erro ao ${editandoId ? "editar" : "cadastrar"} endereço.`);
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(id) {
    setRemovendoId(id);
    try {
      await delete_endereco(id);
      await carregar();
    } catch {
      alert("Erro ao remover endereço.");
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <div className="fp-page">
      <div className="fp-header">
        <div>
          <h1 className="fp-titulo">Endereços</h1>
          <p className="fp-subtitulo">Gerencie os endereços de entrega cadastrados na sua conta.</p>
        </div>
        <button className="fp-btn-primary" onClick={() => (formAberto ? fecharForm() : abrirNovo())}>
          {formAberto ? "Cancelar" : "+ Adicionar endereço"}
        </button>
      </div>

      {formAberto && (
        <div className="fp-card fp-form-card">
          <h2 className="fp-section-titulo">{editandoId ? "Editar endereço" : "Novo endereço"}</h2>

          {erroGeral && <span className="fp-erro" style={{ display: "block", marginBottom: 8 }}>{erroGeral}</span>}

          <div className="fp-grid-2">
            <div className="fp-field">
              <label className="fp-label">Rua *</label>
              <input className="fp-input" value={rua} onChange={e => setRua(e.target.value)} placeholder="Nome da rua" />
              {erros.rua && <span className="fp-erro">{erros.rua}</span>}
            </div>
            <div className="fp-field">
              <label className="fp-label">Número *</label>
              <input className="fp-input" value={numero} onChange={e => setNumero(e.target.value)} placeholder="Nº" />
              {erros.numero && <span className="fp-erro">{erros.numero}</span>}
            </div>
          </div>

          <div className="fp-grid-2">
            <div className="fp-field">
              <label className="fp-label">Complemento</label>
              <input className="fp-input" value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Apto, bloco, referência..." />
            </div>
            <div className="fp-field">
              <label className="fp-label">Bairro *</label>
              <input className="fp-input" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" />
              {erros.bairro && <span className="fp-erro">{erros.bairro}</span>}
            </div>
          </div>

          <div className="fp-grid-2">
            <div className="fp-field">
              <label className="fp-label">Cidade *</label>
              <input className="fp-input" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" />
              {erros.cidade && <span className="fp-erro">{erros.cidade}</span>}
            </div>
            <div className="fp-field">
              <label className="fp-label">Estado *</label>
              <select className="fp-input" value={estado} onChange={e => setEstado(e.target.value)}>
                <option value="">Selecione...</option>
                {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
              {erros.estado && <span className="fp-erro">{erros.estado}</span>}
            </div>
          </div>

          <div className="fp-field">
            <label className="fp-label">CEP *</label>
            <input
              className="fp-input"
              value={cep}
              onChange={e => setCep(formatarCep(e.target.value))}
              placeholder="00000-000"
              inputMode="numeric"
              maxLength={9}
            />
            {erros.cep && <span className="fp-erro">{erros.cep}</span>}
          </div>

          <div className="fp-form-acoes">
            <button className="fp-btn-ghost" onClick={fecharForm}>Cancelar</button>
            <button className="fp-btn-primary" onClick={handleSalvar} disabled={salvando}>
              {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Salvar endereço"}
            </button>
          </div>
        </div>
      )}

      <div className="end-lista">
        {carregando && <div className="fp-card fp-vazio">Carregando...</div>}

        {!carregando && erroCarregar && (
          <div className="fp-card fp-vazio">Não foi possível carregar seus endereços.</div>
        )}

        {!carregando && !erroCarregar && enderecos.length === 0 && (
          <div className="fp-card fp-vazio">Nenhum endereço cadastrado ainda.</div>
        )}

        {!carregando && !erroCarregar && enderecos
          .filter(e => e.id !== editandoId)
          .map(e => (
            <div key={e.id} className="fp-card end-card">
              <div className="end-info">
                <span className="end-icone">📍</span>
                <div>
                  <div className="end-linha1">{enderecoResumo(e)}</div>
                  <div className="end-detalhe">{enderecoDetalhe(e)}</div>
                </div>
              </div>
              <div className="end-acoes">
                <button className="fp-btn-icone" onClick={() => abrirEdicao(e)}>
                   Editar
                </button>
                <button
                  className="fp-btn-icone fp-btn-icone-remover"
                  onClick={() => handleRemover(e.id)}
                  disabled={removendoId === e.id}
                >
                  {removendoId === e.id ? "Removendo..." : " Remover"}
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}