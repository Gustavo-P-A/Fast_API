import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AdminRoute } from "../../src/components/AdminRoute";
import { AuthContext } from "../../src/contexts/AuthContext";

function renderComContexto(valorContexto) {
  render(
    <MemoryRouter initialEntries={["/admin/protegida"]}>
      <AuthContext.Provider value={valorContexto}>
        <Routes>
          <Route path="/admin/protegida" element={<AdminRoute><div>Conteúdo admin</div></AdminRoute>} />
          <Route path="/" element={<div>Página inicial</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("AdminRoute", () => {
  it("sem usuário logado, redireciona pra home", () => {
    renderComContexto({ usuario: null });
    expect(screen.getByText("Página inicial")).toBeInTheDocument();
  });

  it("usuário logado mas não-admin, redireciona pra home", () => {
    renderComContexto({ usuario: { id: 1, nome: "Fulano", adm: false } });
    expect(screen.getByText("Página inicial")).toBeInTheDocument();
  });

  it("usuário admin, mostra o conteúdo", () => {
    renderComContexto({ usuario: { id: 1, nome: "Admin", adm: true } });
    expect(screen.getByText("Conteúdo admin")).toBeInTheDocument();
  });
});
