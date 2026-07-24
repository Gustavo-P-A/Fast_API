import { ToggleAtivo } from "../produto/ToggleAtivo";
import { ToggleGenerico } from "../produto/ToggleGenerico";

export function StatusRegrasMontePizza({
  ativo, setAtivo,
  permiteBorda, setPermiteBorda,
  permiteIngrediente, setPermiteIngrediente,
}) {
  return (
    <div className="np-section">
      <h2 className="np-section-titulo">Status e regras</h2>
      <ToggleAtivo ativo={ativo} onChange={setAtivo} />
      <ToggleGenerico label="Permite borda" valor={permiteBorda} onChange={setPermiteBorda} />
      <ToggleGenerico label="Permite ingrediente" valor={permiteIngrediente} onChange={setPermiteIngrediente} />
    </div>
  );
}
