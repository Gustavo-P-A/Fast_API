import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "../../src/components/AdminLayout";
import { AuthContext } from "../../src/contexts/AuthContext";

function renderLayout({ path = "/admin/dashboard", usuario = { nome: "Admin Fulano", adm: true }, logout = vi.fn() } = {}) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthContext.Provider value={{ usuario, logout }}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<div>Conteúdo do Dashboard</div>} />
            <Route path="bordas" element={<div>Conteúdo de Bordas</div>} />
          </Route>
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
  return { logout };
}

describe("AdminLayout", () => {
  it("renderiza o conteúdo da rota filha dentro do Outlet", () => {
    renderLayout();
    expect(screen.getByText("Conteúdo do Dashboard")).toBeInTheDocument();
  });

  it("mostra o nome do admin e a inicial no avatar", () => {
    renderLayout();
    expect(screen.getByText("Admin Fulano")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("submenu de Produtos começa fechado quando a rota atual não é uma das dele", () => {
    renderLayout({ path: "/admin/dashboard" });
    expect(screen.queryByText("Bordas")).not.toBeInTheDocument();
  });

  it("submenu de Produtos começa aberto quando a rota atual é uma das dele", () => {
    renderLayout({ path: "/admin/bordas" });
    expect(screen.getByText("Bordas")).toBeInTheDocument();
  });

  it("clicar em 'Produtos' abre/fecha o submenu", () => {
    renderLayout({ path: "/admin/dashboard" });

    fireEvent.click(screen.getByText("Produtos"));
    expect(screen.getByText("Bordas")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Produtos"));
    expect(screen.queryByText("Bordas")).not.toBeInTheDocument();
  });

  it("botão Sair chama logout", () => {
    const { logout } = renderLayout();
    fireEvent.click(screen.getByText("Sair"));
    expect(logout).toHaveBeenCalled();
  });
});
