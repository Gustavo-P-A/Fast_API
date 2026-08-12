import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { Perfil } from "../../src/pages/Perfil";
import { AuthContext } from "../../src/contexts/AuthContext";

function renderPerfil({ path = "/perfil/pagamento", handleLogout = vi.fn() } = {}) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthContext.Provider value={{ usuario: { nome: "Fulano da Silva" }, handleLogout }}>
        <Routes>
          <Route path="/perfil" element={<Perfil />}>
            <Route index element={<Navigate to="dados" replace />} />
            <Route path="pagamento" element={<div>Seção Pagamento</div>} />
            <Route path="historico" element={<div>Seção Histórico</div>} />
            <Route path="enderecos" element={<div>Seção Endereços</div>} />
            <Route path="dados" element={<div>Seção Dados</div>} />
            <Route path="seguranca" element={<div>Seção Segurança</div>} />
          </Route>
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
  return { handleLogout };
}

describe("Perfil", () => {
  it("renderiza a seção correspondente à URL atual (Outlet)", () => {
    renderPerfil({ path: "/perfil/pagamento" });
    expect(screen.getByText("Seção Pagamento")).toBeInTheDocument();
  });

  it("mostra o nome do usuário e a inicial no avatar", () => {
    renderPerfil();
    expect(screen.getByText("Fulano da Silva")).toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("clicar em cada item do menu navega pra URL daquela seção", () => {
    renderPerfil({ path: "/perfil/pagamento" });

    fireEvent.click(screen.getByText("Histórico de Compras"));
    expect(screen.getByText("Seção Histórico")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Endereços"));
    expect(screen.getByText("Seção Endereços")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Meus Dados"));
    expect(screen.getByText("Seção Dados")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Segurança"));
    expect(screen.getByText("Seção Segurança")).toBeInTheDocument();
  });

  it("botão Sair chama handleLogout", () => {
    const { handleLogout } = renderPerfil();
    fireEvent.click(screen.getByText("Sair"));
    expect(handleLogout).toHaveBeenCalled();
  });
});
