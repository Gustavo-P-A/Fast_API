import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Login } from "../../src/pages/Login";
import { AuthContext } from "../../src/contexts/AuthContext";

function renderLogin(handleLogin = vi.fn()) {
  render(
    <AuthContext.Provider value={{ handleLogin }}>
      <Login />
    </AuthContext.Provider>
  );
  return handleLogin;
}

describe("Login", () => {
  it("renderiza os campos de e-mail e senha", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("exemplo@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Sua senha")).toBeInTheDocument();
  });

  it("digitar atualiza os campos", () => {
    renderLogin();
    const email = screen.getByPlaceholderText("exemplo@email.com");
    const senha = screen.getByPlaceholderText("Sua senha");

    fireEvent.change(email, { target: { value: "user@teste.com" } });
    fireEvent.change(senha, { target: { value: "MinhaSenha1" } });

    expect(email.value).toBe("user@teste.com");
    expect(senha.value).toBe("MinhaSenha1");
  });

  it("clicar em Entrar chama handleLogin com e-mail e senha digitados", () => {
    const handleLogin = renderLogin();

    fireEvent.change(screen.getByPlaceholderText("exemplo@email.com"), { target: { value: "user@teste.com" } });
    fireEvent.change(screen.getByPlaceholderText("Sua senha"), { target: { value: "MinhaSenha1" } });
    fireEvent.click(screen.getByText("Entrar"));

    expect(handleLogin).toHaveBeenCalledWith("user@teste.com", "MinhaSenha1");
  });

  it("tem um link para a página de cadastro", () => {
    renderLogin();
    expect(screen.getByText("Cadastre-se").closest("a")).toHaveAttribute("href", "/cadastro");
  });
});
