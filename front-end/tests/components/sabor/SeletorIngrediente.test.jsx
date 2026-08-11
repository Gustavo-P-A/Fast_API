import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SeletorIngrediente } from "../../../src/components/sabor/SeletorIngrediente";

const OPCOES = [
  { id: 1, nome: "Bacon Extra", preco: 6 },
  { id: 2, nome: "Cebola Caramelizada", preco: 3 },
];

function Wrapper({ onChange }) {
  const [ingredientes, setIngredientes] = useState([]);
  return (
    <SeletorIngrediente
      opcoes={OPCOES}
      ingredientesSelecionados={ingredientes}
      setIngredientesSelecionados={(updater) => {
        setIngredientes((prev) => {
          const novo = typeof updater === "function" ? updater(prev) : updater;
          onChange?.(novo);
          return novo;
        });
      }}
    />
  );
}

describe("SeletorIngrediente", () => {
  it("não renderiza nada quando não há opções", () => {
    const { container } = render(
      <SeletorIngrediente opcoes={[]} ingredientesSelecionados={[]} setIngredientesSelecionados={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lista as opções com preço e quantidade inicial zero", () => {
    render(<Wrapper />);
    expect(screen.getByText("Bacon Extra")).toBeInTheDocument();
    expect(screen.getByText("+ R$ 6.00")).toBeInTheDocument();
    const contadores = screen.getAllByText("0");
    expect(contadores).toHaveLength(2);
  });

  it("clicar em + adiciona 1 e habilita o botão de −", () => {
    const onChange = vi.fn();
    render(<Wrapper onChange={onChange} />);

    fireEvent.click(screen.getAllByText("+")[0]);

    expect(onChange).toHaveBeenCalledWith([{ item_simples_id: 1, quantidade: 1 }]);
  });

  it("clicar em + de novo no mesmo ingrediente soma a quantidade", () => {
    const onChange = vi.fn();
    render(<Wrapper onChange={onChange} />);

    fireEvent.click(screen.getAllByText("+")[0]);
    fireEvent.click(screen.getAllByText("+")[0]);

    expect(onChange).toHaveBeenLastCalledWith([{ item_simples_id: 1, quantidade: 2 }]);
  });

  it("clicar em − até 0 remove o ingrediente da lista", () => {
    const onChange = vi.fn();
    render(<Wrapper onChange={onChange} />);

    fireEvent.click(screen.getAllByText("+")[0]);
    fireEvent.click(screen.getAllByText("−")[0]);

    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("botão − começa desabilitado quando a quantidade é 0", () => {
    render(<Wrapper />);
    const botoesMenos = screen.getAllByText("−");
    expect(botoesMenos[0]).toBeDisabled();
  });
});
