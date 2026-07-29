import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import "../styles/ContaLayout.css";

const MENU = [
  { to: "/conta/pagamento",  label: "Formas de Pagamento",   icon: "💳" },
  { to: "/conta/historico",  label: "Histórico de Compras",  icon: "🧾" },
  { to: "/conta/enderecos",  label: "Endereços",              icon: "📍" },
  { to: "/conta/dados",      label: "Meus Dados",            icon: "👤" },
  { to: "/conta/seguranca",  label: "Segurança",             icon: "🔒" },
];

export function ContaLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="conta-wrap">
      <aside className="conta-sidebar">
        <div className="conta-sidebar-logo">
          <span className="conta-logo-text">Minha Conta</span>
        </div>

        <nav className="conta-sidebar-nav">
          <p className="conta-sidebar-section-label">CONTA</p>

          {MENU.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `conta-sidebar-link ${isActive ? "active" : ""}`}
            >
              <span className="conta-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="conta-sidebar-site-links">
          <p className="conta-sidebar-section-label">SITE</p>
          <button className="conta-sidebar-link conta-sidebar-link-btn" onClick={() => navigate('/')}>
            <span>Ver cardápio</span>
          </button>
          <button className="conta-sidebar-link conta-sidebar-link-btn" onClick={() => navigate('/meus-pedidos')}>
            <span>Meus pedidos</span>
          </button>
        </div>

        <div className="conta-sidebar-footer">
          <div className="conta-sidebar-user">
            <div className="conta-user-avatar">{usuario?.nome?.[0]?.toUpperCase()}</div>
            <div className="conta-user-info">
              <span className="conta-user-name">{usuario?.nome}</span>
              <span className="conta-user-role">Cliente</span>
            </div>
          </div>
          <button className="conta-btn-logout" onClick={logout}>Sair</button>
        </div>
      </aside>

      <main className="conta-main">
        <Outlet />
      </main>
    </div>
  );
}