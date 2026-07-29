const PASSOS = [
  { numero: 1, label: "Sabores" },
  { numero: 2, label: "Borda" },
  { numero: 3, label: "Adicionais" },
  { numero: 4, label: "Bebidas" },
];

export function PassosIndicador({ passoAtual }) {
  return (
    <div className="mmp-passos">
      {PASSOS.map(p => (
        <span
          key={p.numero}
          className={`mmp-passo ${passoAtual === p.numero ? "mmp-passo-ativo" : ""}`}
        >
          {p.numero}. {p.label}
        </span>
      ))}
    </div>
  );
}
