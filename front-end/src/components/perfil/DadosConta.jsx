import { useEffect, useState } from "react";
import { me, atualizar_meus_dados } from "../../api/auth";
import "../../styles/perfil/FormasPagamento.css";
import "../../styles/perfil/DadosConta.css";

function formatarCpf(valorDigitado) {
  const digitos = valorDigitado.replace(/\D/g, "").slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarTelefone(valorDigitado) {
  const digitos = valorDigitado.replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 10) {
    return digitos
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return digitos
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function DadosConta() {
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erroCarregar, setErroCarregar] = useState(false);

  const [dadosOriginais, setDadosOriginais] = useState(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setErroCarregar(false);
    try {
      const data = await me();
      if (!data) {
        setErroCarregar(true);
        return;
      }
      setDadosOriginais(data);
      preencherForm(data);
    } catch {
      setErroCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  function preencherForm(data) {
    setNome(data.nome || "");
    setEmail(data.email || "");
    setCpf(data.cpf ? formatarCpf(data.cpf) : "");
    setTelefone(data.telefone ? formatarTelefone(data.telefone) : "");
  }

  function abrirEdicao() {
    setSucesso(false);
    setErros({});
    setErroGeral("");
    if (dadosOriginais) preencherForm(dadosOriginais);
    setEditando(true);
  }

  function cancelarEdicao() {
    if (dadosOriginais) preencherForm(dadosOriginais);
    setErros({});
    setErroGeral("");
    setEditando(false);
  }

  async function handleSalvar() {
    const novosErros = {};
    if (!nome.trim()) novosErros.nome = "Informe seu nome completo";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) novosErros.email = "Informe um e-mail válido";
    if (cpf.trim() && cpf.replace(/\D/g, "").length !== 11) novosErros.cpf = "CPF incompleto";
    if (telefone.trim() && ![10, 11].includes(telefone.replace(/\D/g, "").length)) novosErros.telefone = "Telefone incompleto";
    if (Object.keys(novosErros).length > 0) { setErros(novosErros); return; }

    const payload = {
      nome: nome.trim(),
      email: email.trim(),
      cpf: cpf.trim() ? cpf.replace(/\D/g, "") : null,
      telefone: telefone.trim() ? telefone.replace(/\D/g, "") : null,
    };

    setSalvando(true);
    setErroGeral("");
    try {
      const atualizado = await atualizar_meus_dados(payload);
      setDadosOriginais(atualizado);
      preencherForm(atualizado);
      setEditando(false);
      setSucesso(true);
    } catch (error) {
      setErroGeral(error.response?.data?.detail || "Erro ao atualizar seus dados.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fp-page">
      <div className="fp-header">
        <div>
          <h1 className="fp-titulo">Meus Dados</h1>
          <p className="fp-subtitulo">Nome completo, CPF, e-mail e telefone da sua conta.</p>
        </div>
        {!editando && !carregando && !erroCarregar && (
          <button className="fp-btn-primary" onClick={abrirEdicao}>Editar dados</button>
        )}
      </div>

      {sucesso && <div className="dc-sucesso">Seus dados foram atualizados com sucesso.</div>}

      {carregando && <div className="fp-card fp-vazio">Carregando...</div>}

      {!carregando && erroCarregar && (
        <div className="fp-card fp-vazio">Não foi possível carregar seus dados.</div>
      )}

      {!carregando && !erroCarregar && !editando && dadosOriginais && (
        <div className="fp-card dc-view">
          <div className="dc-linha">
            <span className="dc-linha-label">Nome completo</span>
            <span className="dc-linha-valor">{dadosOriginais.nome}</span>
          </div>
          <div className="dc-linha">
            <span className="dc-linha-label">E-mail</span>
            <span className="dc-linha-valor">{dadosOriginais.email}</span>
          </div>
          <div className="dc-linha">
            <span className="dc-linha-label">CPF</span>
            <span className={`dc-linha-valor ${!dadosOriginais.cpf ? "dc-linha-vazio" : ""}`}>
              {dadosOriginais.cpf ? formatarCpf(dadosOriginais.cpf) : "Não informado"}
            </span>
          </div>
          <div className="dc-linha">
            <span className="dc-linha-label">Telefone</span>
            <span className={`dc-linha-valor ${!dadosOriginais.telefone ? "dc-linha-vazio" : ""}`}>
              {dadosOriginais.telefone ? formatarTelefone(dadosOriginais.telefone) : "Não informado"}
            </span>
          </div>
        </div>
      )}

      {editando && (
        <div className="fp-card fp-form-card">
          <h2 className="fp-section-titulo">Editar meus dados</h2>

          {erroGeral && <span className="fp-erro" style={{ display: "block", marginBottom: 8 }}>{erroGeral}</span>}

          <div className="fp-grid-2">
            <div className="fp-field">
              <label className="fp-label">Nome completo *</label>
              <input
                className="fp-input"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Seu nome completo"
              />
              {erros.nome && <span className="fp-erro">{erros.nome}</span>}
            </div>
            <div className="fp-field">
              <label className="fp-label">E-mail *</label>
              <input
                className="fp-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
              />
              {erros.email && <span className="fp-erro">{erros.email}</span>}
            </div>
          </div>

          <div className="fp-grid-2">
            <div className="fp-field">
              <label className="fp-label">CPF</label>
              <input
                className="fp-input"
                value={cpf}
                onChange={e => setCpf(formatarCpf(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
              />
              {erros.cpf && <span className="fp-erro">{erros.cpf}</span>}
            </div>
            <div className="fp-field">
              <label className="fp-label">Telefone</label>
              <input
                className="fp-input"
                value={telefone}
                onChange={e => setTelefone(formatarTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
                inputMode="numeric"
                maxLength={15}
              />
              {erros.telefone && <span className="fp-erro">{erros.telefone}</span>}
            </div>
          </div>

          <div className="fp-form-acoes">
            <button className="fp-btn-ghost" onClick={cancelarEdicao}>Cancelar</button>
            <button className="fp-btn-primary" onClick={handleSalvar} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}