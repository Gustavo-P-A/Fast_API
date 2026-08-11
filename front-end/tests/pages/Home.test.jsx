import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Home } from "../../src/pages/Home";

vi.mock("../../src/api/auth", () => ({
  cardapio_por_grade: vi.fn(),
}));

import * as api from "../../src/api/auth";

const GRADES = [
  {
    grade_id: 1,
    grade_nome: "Destaques",
    posicao: 0,
    produtos: [
      { id: 10, tipo: "sabor", nome: "Calabresa", descricao: "Molho e calabresa", imagem_url: null, menor_preco: 40 },
      { id: 20, tipo: "bebida", nome: "Coca-Cola", descricao: "Lata 350ml", imagem_url: null, menor_preco: 8 },
      { id: 30, tipo: "monte_pizza", nome: "Monte a sua", descricao: "Escolha os sabores", imagem_url: null, menor_preco: null },
    ],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sabores/:id" element={<div>Página do sabor</div>} />
        <Route path="/bebida/:id" element={<div>Página da bebida</div>} />
        <Route path="/monte-pizza/:id" element={<div>Página do monte pizza</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Home", () => {
  it("busca o cardápio agrupado e lista as seções", async () => {
    api.cardapio_por_grade.mockResolvedValue(GRADES);
    renderPagina();

    await waitFor(() => expect(screen.getByText("⭐ Destaques")).toBeInTheDocument());
    expect(screen.getByText("Calabresa")).toBeInTheDocument();
  });

  it("grade que não é a de posição 0 não ganha a estrela", async () => {
    api.cardapio_por_grade.mockResolvedValue([{ ...GRADES[0], posicao: 1 }]);
    renderPagina();

    await waitFor(() => expect(screen.getByText("Destaques")).toBeInTheDocument());
    expect(screen.queryByText("⭐ Destaques")).not.toBeInTheDocument();
  });

  it("mostra o preço com 'A partir de' quando o sabor tem preço mínimo", async () => {
    api.cardapio_por_grade.mockResolvedValue(GRADES);
    renderPagina();

    await waitFor(() => expect(screen.getByText(/A partir de/)).toBeInTheDocument());
  });

  it("bebida mostra o preço direto, sem 'A partir de'", async () => {
    api.cardapio_por_grade.mockResolvedValue(GRADES);
    renderPagina();

    await waitFor(() => expect(screen.getByText("R$ 8,00")).toBeInTheDocument());
  });

  it("monte sua pizza sem preço mostra 'Monte do seu jeito'", async () => {
    api.cardapio_por_grade.mockResolvedValue(GRADES);
    renderPagina();

    await waitFor(() => expect(screen.getByText("Monte do seu jeito")).toBeInTheDocument());
  });

  it("clicar num sabor navega pra /sabores/:id", async () => {
    api.cardapio_por_grade.mockResolvedValue(GRADES);
    renderPagina();
    await waitFor(() => expect(screen.getByText("Calabresa")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Calabresa"));

    await waitFor(() => expect(screen.getByText("Página do sabor")).toBeInTheDocument());
  });

  it("clicar numa bebida navega pra /bebida/:id", async () => {
    api.cardapio_por_grade.mockResolvedValue(GRADES);
    renderPagina();
    await waitFor(() => expect(screen.getByText("Coca-Cola")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Coca-Cola"));

    await waitFor(() => expect(screen.getByText("Página da bebida")).toBeInTheDocument());
  });

  it("clicar num monte sua pizza navega pra /monte-pizza/:id", async () => {
    api.cardapio_por_grade.mockResolvedValue(GRADES);
    renderPagina();
    await waitFor(() => expect(screen.getByText("Monte a sua")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Monte a sua"));

    await waitFor(() => expect(screen.getByText("Página do monte pizza")).toBeInTheDocument());
  });

  it("erro na busca não quebra a página -- fica sem seções", async () => {
    api.cardapio_por_grade.mockRejectedValue(new Error("falhou"));
    const { container } = renderPagina();

    await waitFor(() => expect(api.cardapio_por_grade).toHaveBeenCalled());
    expect(container.querySelector(".home-secao")).not.toBeInTheDocument();
  });
});
