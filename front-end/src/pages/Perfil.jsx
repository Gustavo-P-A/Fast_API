import { useContext } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/perfil/Perfil.css";

const MENU = [
  { chave: "pagamento",  label: "Formas de Pagamento",   icon: "💳" },
  { chave: "historico",  label: "Histórico de Compras",  icon: "🧾" },
  { chave: "enderecos",  label: "Endereços",              icon: "📍" },
  { chave: "dados",      label: "Meus Dados",            icon: "👤" },
  { chave: "seguranca",  label: "Segurança",             icon: "🔒" },
];

export function Perfil() {
  const { usuario, handleLogout } = useContext(AuthContext);

  return (
    <div className="perfil-wrap">
      <aside className="perfil-sidebar">
        <div className="perfil-sidebar-logo">
          <span className="perfil-logo-text">Minha Conta</span>
        </div>

        <nav className="perfil-sidebar-nav">
          <p className="perfil-sidebar-section-label">CONTA</p>

          {MENU.map(item => (
            <NavLink
              key={item.chave}
              to={`/perfil/${item.chave}`}
              className={({ isActive }) => `perfil-sidebar-link ${isActive ? "active" : ""}`}
            >
              <span className="perfil-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="perfil-sidebar-footer">
          <div className="perfil-sidebar-user">
            <div className="perfil-user-avatar">{usuario?.nome?.[0]?.toUpperCase()}</div>
            <div className="perfil-user-info">
              <span className="perfil-user-name">{usuario?.nome}</span>
              <span className="perfil-user-role">Cliente</span>
            </div>
          </div>
          <button className="perfil-btn-logout" onClick={handleLogout}>Sair</button>
        </div>
      </aside>

      <main className="perfil-main">
        <Outlet />
      </main>
    </div>
  );
}