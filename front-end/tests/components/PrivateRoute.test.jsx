import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PrivateRoute } from "../../src/components/PrivateRoute";
import { AuthContext } from "../../src/contexts/AuthContext";

function renderComContexto(valorContexto) {
  render(
    <MemoryRouter initialEntries={["/protegida"]}>
      <AuthContext.Provider value={valorContexto}>
        <Routes>
          <Route path="/protegida" element={<PrivateRoute><div>Conteúdo protegido</div></PrivateRoute>} />
          <Route path="/login" element={<div>Página de login</div>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("PrivateRoute", () => {
  it("enquanto carrega, mostra 'Carregando...' sem redirecionar", () => {
    renderComContexto({ usuario: null, carregando: true });
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("sem usuário logado, redireciona pro login", () => {
    renderComContexto({ usuario: null, carregando: false });
    expect(screen.getByText("Página de login")).toBeInTheDocument();
  });

  it("com usuário logado, mostra o conteúdo protegido", () => {
    renderComContexto({ usuario: { id: 1, nome: "Fulano" }, carregando: false });
    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
  });
});
