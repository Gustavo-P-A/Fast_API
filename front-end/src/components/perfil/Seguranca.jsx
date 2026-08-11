import { useState } from "react";
import { FEATURE_FLAGS } from "../../services/featureFlags.js";
import "../../styles/perfil/FormasPagamento.css";

export function Seguranca() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  function validar() {
    const novosErros = {};
    if (!senhaAtual) novosErros.senhaAtual = "Informe sua senha atual";
    if (!novaSenha) novosErros.novaSenha = "Informe a nova senha";
    else if (novaSenha.length < 8) novosErros.novaSenha = "Mínimo de 8 caracteres";
    if (novaSenha !== confirmarSenha) novosErros.confirmarSenha = "As senhas não coincidem";
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function handleSalvar() {
    if (!validar()) return;
    setSalvando(true);
    try {
      await trocar_senha({ senha_atual: senhaAtual, nova_senha: novaSenha });
      alert("Senha alterada com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setErros({});
    } catch (err) {
      const msg = err.response?.data?.detail || "Erro ao alterar senha.";
      setErros({ senhaAtual: msg });
    } finally {
      setSalvando(false);
    }
  }

  // Backend ainda não existe — enquanto a flag estiver desligada,
  // mostra o placeholder de "em construção" pro usuário comum.
  if (!FEATURE_FLAGS.seguranca) {
    return (
      <div className="fp-page">
        <div className="fp-header">
          <div>
            <h1 className="fp-titulo">Segurança</h1>
            <p className="fp-subtitulo">Em breve: redefinição de senha e outras configurações.</p>
          </div>
        </div>
        <div className="fp-card">
          <p style={{ color: "#6b7280", margin: 0 }}>Essa seção ainda está em construção.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fp-page">
      <div className="fp-header">
        <div>
          <h1 className="fp-titulo">Segurança</h1>
          <p className="fp-subtitulo">Altere sua senha de acesso.</p>
        </div>
      </div>

      <div className="fp-card">
        <div className="fp-field">
          <label className="fp-label">Senha atual</label>
          <input
            className="fp-input"
            type="password"
            value={senhaAtual}
            onChange={e => setSenhaAtual(e.target.value)}
          />
          {erros.senhaAtual && <span className="fp-erro">{erros.senhaAtual}</span>}
        </div>

        <div className="fp-field">
          <label className="fp-label">Nova senha</label>
          <input
            className="fp-input"
            type="password"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
          />
          {erros.novaSenha && <span className="fp-erro">{erros.novaSenha}</span>}
        </div>

        <div className="fp-field">
          <label className="fp-label">Confirmar nova senha</label>
          <input
            className="fp-input"
            type="password"
            value={confirmarSenha}
            onChange={e => setConfirmarSenha(e.target.value)}
          />
          {erros.confirmarSenha && <span className="fp-erro">{erros.confirmarSenha}</span>}
        </div>

        <button className="fp-btn-primary" onClick={handleSalvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Alterar senha"}
        </button>
      </div>
    </div>
  );
}