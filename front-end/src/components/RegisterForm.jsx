import { useState } from 'react';
import '../styles/cadastro.css';

export function FormCadastro({ onCadastroSucesso, irParaLogin }) {
  const [formCad, setFormCad] = useState({
    nome: '',
    email: '',
    senha: '',
    ativo: true
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [senhaError, setSenhaError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'senha') {
      setSenhaError(value.length > 0 && value.length < 8 ? 'A senha deve ter no mínimo 8 caracteres' : '');
    }

    setFormCad(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formCad.senha.length < 8) {
      setSenhaError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:8000/auth/criar_usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formCad)
      });

      const Cad = await response.json();

      if (response.status === 400) {
        setMessage('E-mail ou senha inválido');
        setMessageType('error');
        return;
      }

      if (response.ok) {
        setMessage(Cad.mensagem);
        setMessageType('success');
        setFormCad({ nome: '', email: '', senha: '', ativo: true });

        // Aguarda 1.5s para o usuário ver a mensagem de sucesso e redireciona
        setTimeout(() => {
          onCadastroSucesso();
        }, 1500);
      } else {
        setMessage(Cad.mensagem || 'Erro ao cadastrar');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erro:', error);
      setMessage('Erro ao conectar com o servidor');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <div className="cadastro-header">
          <h1>Criar Conta</h1>
          <p>Preencha os dados para se registrar</p>
        </div>

        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="form-group">
            <label htmlFor="nome">Nome</label>
            <input
              id="nome"
              type="text"
              name="nome"
              placeholder="Seu nome completo"
              value={formCad.nome}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="seu@email.com"
              value={formCad.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <div className="input-senha-wrapper">
              <input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                name="senha"
                placeholder="Mínimo 8 caracteres"
                value={formCad.senha}
                onChange={handleChange}
                required
                className={`form-input ${senhaError ? 'input-error' : ''}`}
              />
              <button
                type="button"
                className="btn-ver-senha"
                onClick={() => setMostrarSenha(prev => !prev)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {senhaError && <span className="error-text">{senhaError}</span>}
          </div>

          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <p className="link-login">
          Já tem uma conta?{' '}
          <button type="button" className="btn-link" onClick={irParaLogin}>
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}