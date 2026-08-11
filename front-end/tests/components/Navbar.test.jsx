import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "../../src/components/Navbar";
import { AuthContext } from "../../src/contexts/AuthContext";
import { CartContext } from "../../src/contexts/CartContext";

function renderNavbar({ path = "/", usuario = null, quantidadeTotal = 0 } = {}) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthContext.Provider value={{ usuario }}>
        <CartContext.Provider value={{ quantidadeTotal }}>
          <Routes>
            <Route path="*" element={<><Navbar /><div>Página: {path}</div></>} />
          </Routes>
        </CartContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("Navbar - visibilidade", () => {
  it("aparece em páginas normais", () => {
    renderNavbar({ path: "/" });
    expect(screen.getByText(/Pizza/)).toBeInTheDocument();
  });

  it("some em /login e /cadastro", () => {
    renderNavbar({ path: "/login" });
    expect(screen.queryByText(/Pizza/)).not.toBeInTheDocument();
  });

  it("some em qualquer rota /admin/...", () => {
    renderNavbar({ path: "/admin/pedidos" });
    expect(screen.queryByText(/Pizza/)).not.toBeInTheDocument();
  });

  it("some em /novo-produto", () => {
    renderNavbar({ path: "/novo-produto" });
    expect(screen.queryByText(/Pizza/)).not.toBeInTheDocument();
  });
});

describe("Navbar - visitante", () => {
  it("mostra 'Entrar' e 'Meus pedidos' pro visitante", () => {
    renderNavbar({ path: "/" });

    expect(screen.getByText("Entrar")).toBeInTheDocument();
    expect(screen.getByText("Meus pedidos")).toBeInTheDocument();
  });

  it("não mostra o botão de Área Admin", () => {
    renderNavbar({ path: "/" });
    expect(screen.queryByText("Área Admin")).not.toBeInTheDocument();
  });
});

describe("Navbar - cliente logado", () => {
  it("mostra 'Meu Perfil' em vez de 'Entrar'", () => {
    renderNavbar({ path: "/", usuario: { id: 1, nome: "Fulano", adm: false } });
    expect(screen.getByText("Meu Perfil")).toBeInTheDocument();
    expect(screen.queryByText("Entrar")).not.toBeInTheDocument();
  });

  it("mostra o badge do carrinho com a quantidade total", () => {
    renderNavbar({ path: "/", usuario: { id: 1, nome: "Fulano", adm: false }, quantidadeTotal: 3 });
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("sem itens no carrinho, não mostra o badge", () => {
    renderNavbar({ path: "/", usuario: { id: 1, nome: "Fulano", adm: false }, quantidadeTotal: 0 });
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});

describe("Navbar - admin logado", () => {
  it("mostra 'Área Admin' e esconde 'Meus pedidos'", () => {
    renderNavbar({ path: "/", usuario: { id: 1, nome: "Admin", adm: true } });
    expect(screen.getByText("Área Admin")).toBeInTheDocument();
    expect(screen.queryByText("Meus pedidos")).not.toBeInTheDocument();
  });
});
