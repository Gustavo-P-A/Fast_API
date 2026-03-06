import { useState } from 'react';
import { login } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const { login: fazerLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    
    try {
      const data = await login(email, senha);
      fazerLogin(data);
    } catch (error) {
      setErro(error.response?.data?.detail || 'Email ou senha inválidos');
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="form-box">
        <h2>🍕 Pizzaria Login</h2>
        
        {erro && <div className="error">{erro}</div>}
        
        <div className="input-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="input-group">
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>
          Entrar
        </button>
      </form>
    </div>
  );
}

export default LoginForm;