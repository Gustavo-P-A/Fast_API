import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Perfil } from "../../src/pages/Perfil";
import { AuthContext } from "../../src/contexts/AuthContext";

vi.mock("../../src/components/perfil/FormasPagamento", () => ({ FormasPagamento: () => <div>Seção Pagamento</div> }));
vi.mock("../../src/components/perfil/Historico", () => ({ Historico: () => <div>Seção Histórico</div> }));
vi.mock("../../src/components/perfil/Enderecos", () => ({ Enderecos: () => <div>Seção Endereços</div> }));
vi.mock("../../src/components/perfil/DadosConta", () => ({ DadosConta: () => <div>Seção Dados</div> }));
vi.mock("../../src/components/perfil/Seguranca", () => ({ Seguranca: () => <div>Seção Segurança</div> }));

function renderPerfil(handleLogout = vi.fn()) {
  render(
    <AuthContext.Provider value={{ usuario: { nome: "Fulano da Silva" }, handleLogout }}>
      <Perfil />
    </AuthContext.Provider>
  );
  return handleLogout;
}

describe("Perfil", () => {
  it("mostra a seção de Formas de Pagamento por padrão", () => {
    renderPerfil();
    expect(screen.getByText("Seção Pagamento")).toBeInTheDocument();
  });

  it("mostra o nome do usuário e a inicial no avatar", () => {
    renderPerfil();
    expect(screen.getByText("Fulano da Silva")).toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("clicar em cada item do menu troca a seção exibida", () => {
    renderPerfil();

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
    const handleLogout = renderPerfil();
    fireEvent.click(screen.getByText("Sair"));
    expect(handleLogout).toHaveBeenCalled();
  });
});
