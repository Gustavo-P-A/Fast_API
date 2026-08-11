import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SeletorTamanho } from "../../../src/components/sabor/SeletorTamanho";

const PRECOS = [
  { id: 1, preco: 40, tamanho_rel: { id: 10, nome: "Grande" } },
  { id: 2, preco: 30, tamanho_rel: { id: 11, nome: "Média" } },
];

describe("SeletorTamanho", () => {
  it("lista um botão por tamanho com nome e preço formatado", () => {
    render(<SeletorTamanho precos={PRECOS} selecionado={null} onSelecionar={() => {}} />);

    expect(screen.getByText("Grande")).toBeInTheDocument();
    expect(screen.getByText("R$ 40,00")).toBeInTheDocument();
    expect(screen.getByText("Média")).toBeInTheDocument();
    expect(screen.getByText("R$ 30,00")).toBeInTheDocument();
  });

  it("marca como selecionado o item cujo id bate com 'selecionado'", () => {
    render(<SeletorTamanho precos={PRECOS} selecionado={PRECOS[0]} onSelecionar={() => {}} />);

    expect(screen.getByText("Grande").closest("button")).toHaveClass("selecionado");
    expect(screen.getByText("Média").closest("button")).not.toHaveClass("selecionado");
  });

  it("clicar em um tamanho chama onSelecionar com o preço inteiro", () => {
    const onSelecionar = vi.fn();
    render(<SeletorTamanho precos={PRECOS} selecionado={null} onSelecionar={onSelecionar} />);

    fireEvent.click(screen.getByText("Média").closest("button"));

    expect(onSelecionar).toHaveBeenCalledWith(PRECOS[1]);
  });

  it("não renderiza nada quando a lista de preços está vazia", () => {
    const { container } = render(<SeletorTamanho precos={[]} selecionado={null} onSelecionar={() => {}} />);
    expect(container.querySelector(".sabor-preco-item")).not.toBeInTheDocument();
  });
});
