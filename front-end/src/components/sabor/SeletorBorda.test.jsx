import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SeletorBorda } from "./SeletorBorda";

// Duas opções de borda de exemplo, no mesmo formato que a API devolve
const OPCOES = [
  { id: 1, preco: 5.0, adicional_rel: { id: 10, nome: "Catupiry" } },
  { id: 2, preco: 6.5, adicional_rel: { id: 20, nome: "Cheddar" } },
];

// Componente "controlado": em vez de recriar um estado React aqui,
// simulamos o pai com um wrapper simples que guarda o estado e repassa,
// exatamente como Sabor.jsx faz de verdade.
function Wrapper({ qtdBordas, onChange }) {
  const [bordas, setBordas] = useState([]);
  return (
    <SeletorBorda
      opcoes={OPCOES}
      qtdBordas={qtdBordas}
      bordasSelecionadas={bordas}
      setBordasSelecionadas={(updater) => {
        setBordas((prev) => {
          const novo = typeof updater === "function" ? updater(prev) : updater;
          onChange?.(novo);
          return novo;
        });
      }}
    />
  );
}

describe("SeletorBorda", () => {
  it("não renderiza nada se qtdBordas for 0", () => {
    const { container } = render(<Wrapper qtdBordas={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mostra o total de partes disponíveis no início", () => {
    render(<Wrapper qtdBordas={2} />);
    expect(screen.getByText("2 de 2 parte(s)")).toBeInTheDocument();
  });

  it("clicar em + adiciona uma parte à borda escolhida", () => {
    const onChange = vi.fn();
    render(<Wrapper qtdBordas={2} onChange={onChange} />);

    const botoesMais = screen.getAllByText("+");
    fireEvent.click(botoesMais[0]); // + na Catupiry

    expect(onChange).toHaveBeenCalledWith([
      { adicional_id: 10, partes: 1 },
    ]);
  });

  it("não deixa passar do limite de partes do tamanho", () => {
    // qtdBordas = 1: só dá pra escolher 1 parte no total, em qualquer borda
    render(<Wrapper qtdBordas={1} />);

    const [maisCatupiry, maisCheddar] = screen.getAllByText("+");
    fireEvent.click(maisCatupiry); // usa a única parte disponível

    // Agora o botão "+" do Cheddar deve estar desabilitado,
    // porque "restante" chegou a 0
    expect(maisCheddar).toBeDisabled();
  });

  it("clicar em − remove a borda quando as partes chegam a 0", () => {
    const onChange = vi.fn();
    render(<Wrapper qtdBordas={2} onChange={onChange} />);

    const botoesMais = screen.getAllByText("+");
    fireEvent.click(botoesMais[0]); // partes = 1

    const botoesMenos = screen.getAllByText("−");
    fireEvent.click(botoesMenos[0]); // partes = 0 -> deve remover do array

    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
