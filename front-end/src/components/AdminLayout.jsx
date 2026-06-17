import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import "../styles/AdminLayout.css";

const MENU = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/admin/produtos",  label: "Produtos",  icon: "💼" },
  { to: "/admin/grades",    label: "Grades",    icon: "☰" },  
  { to: "/admin/pedidos",   label: "Pedidos",   icon: "📋" },
  { to: "/admin/clientes",  label: "Clientes",  icon: "👥" },
];

export function AdminLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon"></span>
          <span className="logo-text">Pizza Itália</span>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-section-label">MENU ADMIN</p>
          {MENU.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <span className="link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Links para voltar ao site */}
        <div className="sidebar-site-links">
          <p className="sidebar-section-label">SITE</p>
          <button className="sidebar-link sidebar-link-btn" onClick={() => navigate('/')}>
            <span>Ver cardápio</span>
          </button>
          <button className="sidebar-link sidebar-link-btn" onClick={() => navigate('/perfil')}>
            <span>Minha conta</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{usuario?.nome?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name">{usuario?.nome}</span>
              <span className="user-role">Administrador</span>
            </div>
          </div>
          <button className="btn-logout" onClick={logout}>Sair</button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}