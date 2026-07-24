import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/Navbar.css";

export function Navbar() {
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const esconder = ['/login', '/cadastro'].includes(location.pathname)
  || location.pathname.startsWith('/admin')
  || location.pathname.startsWith('/novo-produto');

  if (esconder) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <button className="navbar-logo" onClick={() => navigate('/')}>
          <span className="navbar-logo-icon">🍕</span>
          <span className="navbar-logo-texto">Pizza <span>Italia</span></span>
        </button>

        <div className="navbar-acoes">
          {!usuario?.adm && (
            <button className="navbar-btn" onClick={() => usuario ? navigate('/meus-pedidos') : navigate('/login')}>
              Meus pedidos
            </button>
          )}
          <button className="navbar-btn" onClick={() => usuario ? navigate('/perfil') : navigate('/login')}>
            {usuario ? usuario.nome.split(' ')[0] : 'Entrar'}
          </button>
          {usuario?.adm && (
            <button className="navbar-btn navbar-btn-admin" onClick={() => navigate('/admin')}>
              Área Admin
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}