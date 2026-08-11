import { useEffect, useState } from "react";
import {
  listar_formas_pagamento,
  criar_forma_pagamento,
  editar_forma_pagamento,
  definir_forma_pagamento_padrao,
  deletar_forma_pagamento,
} from "../../api/auth";
import "../../styles/perfil/FormasPagamento.css";

const TIPOS = [
  { valor: "CREDITO",          label: "Cartão de Crédito", icon: "💳" },
  { valor: "DEBITO",           label: "Cartão de Débito",  icon: "💳" },
  { valor: "VALE_ALIMENTACAO", label: "Vale-Alimentação",  icon: "🍽️" },
  { valor: "VALE_REFEICAO",    label: "Vale-Refeição",     icon: "🍴" },
];

function labelTipo(tipo) {
  return TIPOS.find(t => t.valor === tipo)?.label || tipo;
}

function iconeTipo(tipo) {
  return TIPOS.find(t => t.valor === tipo)?.icon || "💳";
}

// Padrão sempre primeiro na lista
function ordenar(formas) {
  return [...formas].sort((a, b) => (a.padrao === b.padrao ? 0 : a.padrao ? -1 : 1));
}

// Detecta a bandeira pelos primeiros dígitos do número (faixas de BIN públicas, não é dado sigiloso)
function detectarBandeira(numeroDigitado) {
  const n = numeroDigitado.replace(/\D/g, "");
  if (!n) return "";
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "American Express";
  if (/^(4011|4312|4389|4514|4573|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(n)) return "Elo";
  if (/^(606282|3841)/.test(n)) return "Hipercard";
  if (/^3(0[0-5]|[68])/.test(n)) return "Diners Club";
  return "";
}

// Agrupa o número em blocos de 4 dígitos, com espaço automático
function formatarNumero(valorDigitado) {
  const digitos = valorDigitado.replace(/\D/g, "").slice(0, 19);
  return digitos.replace(/(.{4})(?=.)/g, "$1 ");
}

// Insere a barra automaticamente após o mês (MM/AA)
function formatarValidade(valorDigitado) {
  const digitos = valorDigitado.replace(/\D/g, "").slice(0, 4);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
}

export function FormasPagamento() {
  const [formas, setFormas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [tipo, setTipo] = useState("CREDITO");
  const [numero, setNumero] = useState("");
  const [nomeImpresso, setNomeImpresso] = useState("");
  const [bandeira, setBandeira] = useState("");
  const [bandeiraManual, setBandeiraManual] = useState(false);
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [erros, setErros] = useState({});

  const ehCartao = tipo === "CREDITO" || tipo === "DEBITO";

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (ehCartao && !bandeiraManual) {
      const detectada = detectarBandeira(numero);
      if (detectada) setBandeira(detectada);
    }
  }, [numero, ehCartao, bandeiraManual]);

  async function carregar() {
    setCarregando(true);
    try {
      const data = await listar_formas_pagamento();
      setFormas(data || []);
    } catch {
      alert("Erro ao carregar formas de pagamento.");
    } finally {
      setCarregando(false);
    }
  }

  function limparForm() {
    setEditandoId(null);
    setTipo("CREDITO");
    setNumero("");
    setNomeImpresso("");
    setBandeira("");
    setBandeiraManual(false);
    setValidade("");
    setCvv("");
    setErros({});
  }

  function abrirNovo() {
    limparForm();
    setFormAberto(true);
  }

  function abrirEdicao(f) {
    setEditandoId(f.id);
    setTipo(f.tipo);
    setBandeira(f.bandeira || "");
    setBandeiraManual(true); // já tem bandeira definida, não sobrescreve sozinho
    setNumero(f.final_numero || "");
    setNomeImpresso(f.nome_impresso || "");
    setValidade(f.validade || "");
    setCvv("");
    setErros({});
    setFormAberto(true);
  }

  function fecharForm() {
    limparForm();
    setFormAberto(false);
  }

  function handleChangeNumero(e) {
    setNumero(formatarNumero(e.target.value));
  }

  function handleChangeValidade(e) {
    setValidade(formatarValidade(e.target.value));
  }

  async function handleSalvar() {
    const novosErros = {};
    if (!numero.trim() || numero.replace(/\D/g, "").length < 4) novosErros.numero = "Informe o número completo";
    if (!nomeImpresso.trim()) novosErros.nomeImpresso = "Informe o nome impresso";
    if (ehCartao && !validade.trim()) novosErros.validade = "Informe a validade";
    if (ehCartao && (!cvv.trim() || cvv.trim().length < 3)) novosErros.cvv = "CVV inválido";
    if (Object.keys(novosErros).length > 0) { setErros(novosErros); return; }

    const payload = {
      tipo,
      bandeira: bandeira.trim() || null,
      nome_impresso: nomeImpresso.trim().toUpperCase(),
      numero: numero.replace(/\D/g, ""),
      validade: ehCartao ? validade.trim() : null,
      padrao: false,
    };

    setSalvando(true);
    try {
      if (editandoId) {
        await editar_forma_pagamento(editandoId, payload);
      } else {
        await criar_forma_pagamento(payload);
      }
      await carregar();
      fecharForm();
    } catch {
      alert(`Erro ao ${editandoId ? "editar" : "cadastrar"} forma de pagamento.`);
    } finally {
      setSalvando(false);
    }
  }

  async function handleDefinirPadrao(id) {
    try {
      await definir_forma_pagamento_padrao(id);
      await carregar();
    } catch {
      alert("Erro ao definir forma de pagamento padrão.");
    }
  }

  async function handleRemover(id) {
    try {
      await deletar_forma_pagamento(id);
      await carregar();
    } catch {
      alert("Erro ao remover forma de pagamento.");
    }
  }

  const formasOrdenadas = ordenar(formas);
  const listaVisivel = formasOrdenadas.filter(f => f.id !== editandoId);

  return (
    <div className="fp-page">
      <div className="fp-header">
        <div>
          <h1 className="fp-titulo">Formas de Pagamento</h1>
          <p className="fp-subtitulo">Gerencie os cartões e vales cadastrados na sua conta.</p>
        </div>
        <button className="fp-btn-primary" onClick={() => (formAberto ? fecharForm() : abrirNovo())}>
          {formAberto ? "Cancelar" : "+ Adicionar forma de pagamento"}
        </button>
      </div>

      {formAberto && (
        <div className="fp-card fp-form-card">
          <h2 className="fp-section-titulo">{editandoId ? "Editar forma de pagamento" : "Nova forma de pagamento"}</h2>

          <div className="fp-field">
            <label className="fp-label">Tipo *</label>
            <div className="fp-tipo-opcoes">
              {TIPOS.map(t => (
                <button
                  type="button"
                  key={t.valor}
                  className={`fp-tipo-opcao ${tipo === t.valor ? "selecionado" : ""}`}
                  onClick={() => setTipo(t.valor)}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>


          <div className="fp-grid-2">
            <div className="fp-field">
              <label className="fp-label">Número *</label>
              <input
                className="fp-input"
                placeholder="0000 0000 0000 0000"
                value={numero}
                onChange={handleChangeNumero}
                inputMode="numeric"
                maxLength={19}
              />
              {erros.numero && <span className="fp-erro">{erros.numero}</span>}
              {editandoId && <span className="fp-dica">Por segurança só guardamos os 4 últimos dígitos. Se não trocar de cartão, pode deixar como está.</span>}
            </div>
            <div className="fp-field">
              <label className="fp-label">Nome no cartão *</label>
              <input
                className="fp-input"
                placeholder="Como está no cartão"
                value={nomeImpresso}
                onChange={e => setNomeImpresso(e.target.value)}
              />
              {erros.nomeImpresso && <span className="fp-erro">{erros.nomeImpresso}</span>}
            </div>
          </div>

          {ehCartao && (
            <div className="fp-grid-2">
              <div className="fp-field">
                <label className="fp-label">Validade *</label>
                <input
                  className="fp-input"
                  placeholder="MM/AA"
                  value={validade}
                  onChange={handleChangeValidade}
                  inputMode="numeric"
                  maxLength={5}
                />
                {erros.validade && <span className="fp-erro">{erros.validade}</span>}
              </div>
              <div className="fp-field">
                <label className="fp-label">CVV *</label>
                <input
                  className="fp-input"
                  placeholder="123"
                  value={cvv}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  inputMode="numeric"
                  maxLength={4}
                />
                {erros.cvv && <span className="fp-erro">{erros.cvv}</span>}
              </div>
            </div>
          )}

          <div className="fp-form-acoes">
            <button className="fp-btn-ghost" onClick={fecharForm}>Cancelar</button>
            <button className="fp-btn-primary" onClick={handleSalvar} disabled={salvando}>
              {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Salvar forma de pagamento"}
            </button>
          </div>
        </div>
      )}

      <div className="fp-lista">
        {carregando && <div className="fp-vazio">Carregando...</div>}

        {!carregando && formas.length === 0 && (
          <div className="fp-vazio">Nenhuma forma de pagamento cadastrada ainda.</div>
        )}

        {!carregando && formas.length > 0 && listaVisivel.length === 0 && (
          <div className="fp-vazio">Editando a forma de pagamento acima...</div>
        )}

        {!carregando && listaVisivel.map(f => (
          <div key={f.id} className={`fp-card fp-metodo ${f.padrao ? "fp-metodo-padrao" : ""}`}>
            <div className="fp-metodo-icone">{iconeTipo(f.tipo)}</div>

            <div className="fp-metodo-info">
              <div className="fp-metodo-linha1">
                <span className="fp-metodo-titulo">{labelTipo(f.tipo)}</span>
                {f.padrao && <span className="fp-badge-padrao">Padrão</span>}
              </div>
              <div className="fp-metodo-detalhe">
                {f.bandeira ? `${f.bandeira} ` : ""}•••• {f.final_numero}
                {f.validade && ` · Validade ${f.validade}`}
              </div>
              <div className="fp-metodo-nome">{f.nome_impresso}</div>
            </div>

            <div className="fp-metodo-acoes">
              {!f.padrao && (
                <button className="fp-btn-definir-padrao" onClick={() => handleDefinirPadrao(f.id)}>
                  Definir como padrão
                </button>
              )}
              <div className="fp-acoes-secundarias">
                <button className="fp-btn-icone" onClick={() => abrirEdicao(f)}>
                   Editar
                </button>
                <button className="fp-btn-icone fp-btn-icone-remover" onClick={() => handleRemover(f.id)}>
                   Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}