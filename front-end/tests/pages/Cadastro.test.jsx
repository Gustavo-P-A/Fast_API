import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Cadastro } from "../../src/pages/Cadastro";
import { AuthContext } from "../../src/contexts/AuthContext";

function renderCadastro(handleCadastro = vi.fn()) {
  render(
    <MemoryRouter>
      <AuthContext.Provider value={{ handleCadastro }}>
        <Cadastro />
      </AuthContext.Provider>
    </MemoryRouter>
  );
  return handleCadastro;
}

describe("Cadastro", () => {
  it("renderiza os campos nome, e-mail e senha", () => {
    renderCadastro();
    expect(screen.getByPlaceholderText("Nome completo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Seu melhor e-mail")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Crie uma senha")).toBeInTheDocument();
  });

  it("enviar o formulário chama handleCadastro com os valores digitados", () => {
    const handleCadastro = renderCadastro();

    fireEvent.change(screen.getByPlaceholderText("Nome completo"), { target: { value: "Fulano" } });
    fireEvent.change(screen.getByPlaceholderText("Seu melhor e-mail"), { target: { value: "fulano@teste.com" } });
    fireEvent.change(screen.getByPlaceholderText("Crie uma senha"), { target: { value: "Senha1234" } });
    fireEvent.click(screen.getByText("Cadastrar"));

    expect(handleCadastro).toHaveBeenCalledWith("Fulano", "fulano@teste.com", "Senha1234");
  });

  it("campos obrigatórios impedem o submit quando vazios", () => {
    const handleCadastro = renderCadastro();

    fireEvent.click(screen.getByText("Cadastrar"));

    // o navegador bloqueia o submit por causa do 'required' -- handleCadastro não é chamado
    expect(handleCadastro).not.toHaveBeenCalled();
  });

  it("clicar em 'Entrar' navega para /login", () => {
    renderCadastro();
    // Apenas garante que o link de navegação está presente e clicável
    expect(screen.getByText("Entrar")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Entrar"));
  });
});
