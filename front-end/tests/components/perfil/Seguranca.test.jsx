import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Seguranca } from "../../../src/components/perfil/Seguranca";

describe("Seguranca", () => {
  it("renderiza o título e o aviso de 'em construção'", () => {
    render(<Seguranca />);
    expect(screen.getByText("Segurança")).toBeInTheDocument();
    expect(screen.getByText("Essa seção ainda está em construção.")).toBeInTheDocument();
  });
});
