import { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { FormasPagamento } from "../components/perfil/FormasPagamento";
import { Historico } from "../components/perfil/Historico";
import { Enderecos } from "../components/perfil/Enderecos";
import { DadosConta } from "../components/perfil/DadosConta";
import { Seguranca } from "../components/perfil/Seguranca";
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
  const [secaoAtiva, setSecaoAtiva] = useState("pagamento");

  function renderSecao() {
    switch (secaoAtiva) {
      case "pagamento": return <FormasPagamento />;
      case "historico": return <Historico />;
      case "enderecos": return <Enderecos />;
      case "dados": return <DadosConta />;
      case "seguranca": return <Seguranca />;
      default: return null;
    }
  }

  return (
    <div className="perfil-wrap">
      <aside className="perfil-sidebar">
        <div className="perfil-sidebar-logo">
          <span className="perfil-logo-text">Minha Conta</span>
        </div>

        <nav className="perfil-sidebar-nav">
          <p className="perfil-sidebar-section-label">CONTA</p>

          {MENU.map(item => (
            <button
              key={item.chave}
              type="button"
              className={`perfil-sidebar-link ${secaoAtiva === item.chave ? "active" : ""}`}
              onClick={() => setSecaoAtiva(item.chave)}
            >
              <span className="perfil-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
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
        {renderSecao()}
      </main>
    </div>
  );
}