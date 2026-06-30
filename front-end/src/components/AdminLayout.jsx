import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import "../styles/AdminLayout.css";

const SUBMENU_PRODUTOS = [
  { to: "/admin/produtos",     label: "Pizzas",     icon: "🍕" },
  { to: "/admin/bordas",       label: "Bordas",     icon: "🧀" },
  { to: "/admin/ingredientes", label: "Adicionais", icon: "📦" },
  { to: "/admin/bebidas",      label: "Bebidas",    icon: "🥤" },
];

const MENU = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "📊" },
];

const MENU_DEPOIS_PRODUTOS = [
  { to: "/admin/grades",   label: "Grades",   icon: "☰" },
  { to: "/admin/pedidos",  label: "Pedidos",  icon: "📋" },
  { to: "/admin/clientes", label: "Clientes", icon: "👥" },
];

export function AdminLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const estaEmProdutos = SUBMENU_PRODUTOS.some(item => location.pathname === item.to);
  const [produtosAberto, setProdutosAberto] = useState(estaEmProdutos);

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

          <button
            type="button"
            className={`sidebar-link sidebar-link-btn ${estaEmProdutos ? "active" : ""}`}
            onClick={() => setProdutosAberto(prev => !prev)}
          >
            <span className="link-icon">💼</span>
            <span>Produtos</span>
            <span className={`sidebar-seta ${produtosAberto ? "sidebar-seta-aberta" : ""}`}>▾</span>
          </button>

          {produtosAberto && (
            <div className="sidebar-submenu">
              {SUBMENU_PRODUTOS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link sidebar-sublink ${isActive ? "active" : ""}`}
                >
                  <span className="link-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}

          {MENU_DEPOIS_PRODUTOS.map(item => (
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