import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Sabor } from "../../src/pages/Sabor";
import { AuthContext } from "../../src/contexts/AuthContext";
import { CartContext } from "../../src/contexts/CartContext";

vi.mock("../../src/api/auth", () => ({
  saborId: vi.fn(),
  preco_adicional: vi.fn(),
  itens_simples_publico: vi.fn(),
}));

import * as api from "../../src/api/auth";

const SABOR = {
  id: 1,
  nome: "Calabresa",
  descricao: "Molho, calabresa e cebola",
  imagem_url: null,
  permite_borda: true,
  permite_ingrediente: true,
  preco_float: [
    { id: 1, preco: 40.0, tamanho_rel: { id: 10, nome: "Grande", qtd_bordas: 2 } },
    { id: 2, preco: 30.0, tamanho_rel: { id: 11, nome: "Média", qtd_bordas: 1 } },
  ],
};

const BEBIDA = { id: 5, nome: "Coca-Cola", descricao: "Lata 350ml", imagem_url: null, preco: 8 };

function renderPagina({ path = "/sabores/1", usuario = { id: 1, nome: "Fulano" }, adicionarItem = vi.fn(), adicionarBebida = vi.fn() } = {}) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthContext.Provider value={{ usuario }}>
        <CartContext.Provider value={{ adicionarItem, adicionarBebida }}>
          <Routes>
            <Route path="/sabores/:id" element={<Sabor />} />
            <Route path="/bebida/:id" element={<Sabor />} />
            <Route path="/cadastro" element={<div>Página de cadastro</div>} />
            <Route path="/carrinho" element={<div>Página do carrinho</div>} />
          </Routes>
        </CartContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
  return { adicionarItem, adicionarBebida };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.saborId.mockResolvedValue(SABOR);
  api.preco_adicional.mockResolvedValue([
    { id: 1, preco: 10, adicional_rel: { id: 100, nome: "Catupiry" } },
  ]);
  api.itens_simples_publico.mockResolvedValue([]);
});

describe("Sabor - fluxo pizza", () => {
  it("busca o sabor pelo id e mostra nome/descrição", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());
    expect(api.saborId).toHaveBeenCalledWith("1");
    expect(screen.getByText("Molho, calabresa e cebola")).toBeInTheDocument();
  });

  it("item não encontrado mostra mensagem e botão de voltar", async () => {
    api.saborId.mockResolvedValue(false);
    renderPagina();

    await waitFor(() => expect(screen.getByText("Item não encontrado.")).toBeInTheDocument());
  });

  it("tamanhos aparecem ordenados do mais barato pro mais caro", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());

    const botoes = screen.getAllByText(/Grande|Média/);
    expect(botoes[0].textContent).toBe("Média");
  });

  it("selecionar um tamanho busca os adicionais e mostra o total estimado", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Grande"));

    await waitFor(() => expect(api.preco_adicional).toHaveBeenCalledWith(10));
    await waitFor(() => expect(screen.getByText(/Total estimado/)).toBeInTheDocument());
    expect(screen.getByText("R$ 40,00", { selector: "strong" })).toBeInTheDocument();
  });

  it("escolher uma borda soma no total estimado", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Grande"));
    await waitFor(() => expect(screen.getByText("Catupiry")).toBeInTheDocument());

    fireEvent.click(screen.getAllByText("+")[0]);

    await waitFor(() => expect(screen.getByText("R$ 50,00", { selector: "strong" })).toBeInTheDocument());
  });

  it("botão Adicionar ao Carrinho fica desabilitado sem tamanho escolhido", async () => {
    renderPagina();
    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());

    expect(screen.getByText("Adicionar ao Carrinho")).toBeDisabled();
  });

  it("usuário logado: finalizar adiciona no carrinho e navega pro /carrinho", async () => {
    const { adicionarItem } = renderPagina();
    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Grande"));
    await waitFor(() => expect(screen.getByText(/Total estimado/)).toBeInTheDocument());

    fireEvent.click(screen.getByText("Adicionar ao Carrinho"));

    expect(adicionarItem).toHaveBeenCalledWith(
      expect.objectContaining({ tamanho_id: 10, sabor_ids: [1], preco_sabor: 40 })
    );
    await waitFor(() => expect(screen.getByText("Página do carrinho")).toBeInTheDocument());
  });

  it("visitante (sem login) vê 'Criar Conta' e é levado pro cadastro", async () => {
    renderPagina({ usuario: null });
    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Grande"));
    await waitFor(() => expect(screen.getByText("Criar Conta")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Criar Conta"));

    await waitFor(() => expect(screen.getByText("Página de cadastro")).toBeInTheDocument());
  });

  it("sabor que não permite borda não mostra o seletor de borda", async () => {
    api.saborId.mockResolvedValue({ ...SABOR, permite_borda: false });
    renderPagina();
    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Grande"));

    await waitFor(() => expect(screen.getByText(/Total estimado/)).toBeInTheDocument());
    expect(screen.queryByText(/^Borda/)).not.toBeInTheDocument();
  });
});

describe("Sabor - fluxo bebida", () => {
  beforeEach(() => {
    api.itens_simples_publico.mockResolvedValue([BEBIDA]);
  });

  it("busca a bebida na lista pública e mostra nome/preço", async () => {
    renderPagina({ path: "/bebida/5" });

    await waitFor(() => expect(screen.getByText("Coca-Cola")).toBeInTheDocument());
    expect(api.itens_simples_publico).toHaveBeenCalledWith("BEBIDA");
    expect(screen.getByText("R$ 8,00")).toBeInTheDocument();
  });

  it("+ e − alteram a quantidade sem passar de 1", async () => {
    renderPagina({ path: "/bebida/5" });
    await waitFor(() => expect(screen.getByText("Coca-Cola")).toBeInTheDocument());

    fireEvent.click(screen.getByText("−"));
    expect(screen.getByText("1")).toBeInTheDocument();

    fireEvent.click(screen.getByText("+"));
    fireEvent.click(screen.getByText("+"));
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("usuário logado: adicionar bebida ao carrinho com a quantidade certa", async () => {
    const { adicionarBebida } = renderPagina({ path: "/bebida/5" });
    await waitFor(() => expect(screen.getByText("Coca-Cola")).toBeInTheDocument());

    fireEvent.click(screen.getByText("+")); // quantidade = 2
    fireEvent.click(screen.getByText(/Adicionar ao Carrinho/));

    expect(adicionarBebida).toHaveBeenCalledWith(
      { item_simples_id: 5, nome: "Coca-Cola", preco: 8 }, 2
    );
    await waitFor(() => expect(screen.getByText("Página do carrinho")).toBeInTheDocument());
  });

  it("bebida inexistente mostra 'Item não encontrado'", async () => {
    api.itens_simples_publico.mockResolvedValue([]);
    renderPagina({ path: "/bebida/999" });

    await waitFor(() => expect(screen.getByText("Item não encontrado.")).toBeInTheDocument());
  });
});
