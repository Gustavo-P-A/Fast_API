import { SeletorIngrediente } from "../sabor/SeletorIngrediente";

export function PassoIngredientes({
  opcoes, ingredientesSelecionados, setIngredientesSelecionados, onVoltar, onContinuar,
}) {
  return (
    <div className="mmp-secao">
      <SeletorIngrediente
        opcoes={opcoes}
        ingredientesSelecionados={ingredientesSelecionados}
        setIngredientesSelecionados={setIngredientesSelecionados}
      />
      <div className="mmp-botoes-passo">
        <button className="np-btn-ghost" onClick={onVoltar}>Voltar</button>
        <button className="sabor-btn-finalizar ativo" onClick={onContinuar}>Continuar</button>
      </div>
    </div>
  );
}
