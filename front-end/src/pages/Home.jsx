import { useState, useEffect } from "react";
import { cardapio_por_grade } from "../api/auth";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export function Home() {
  const [grades, setGrades] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    cardapio_por_grade()
      .then(data => setGrades(data || []))
      .catch(() => setGrades([]));
  }, []);

  return (
    <div className="home-page">
      {grades.map(grade => (
        <section key={grade.grade_id} className="home-secao">
          <h2 className="home-secao-titulo">
            {grade.posicao === 0 ? "⭐ " : ""}{grade.grade_nome}
          </h2>
          <div className="home-grid">
            {grade.produtos.map(sabor => (
              <div
                key={sabor.id}
                className="home-card"
                onClick={() => navigate(`/sabores/${sabor.id}`)}
              >
                <div className="home-card-foto">
                  {sabor.imagem_url
                    ? <img src={sabor.imagem_url} alt={sabor.nome} />
                    : <div className="home-card-sem-foto">🍕</div>
                  }
                </div>
                <div className="home-card-info">
                  <p className="home-card-nome">{sabor.nome}</p>
                  <p className="home-card-descricao">{sabor.descricao}</p>
                  <p className="home-card-preco">
                    {sabor.menor_preco
                      ? <><span className="home-card-preco-label">A partir de </span>R$ {Number(sabor.menor_preco).toFixed(2).replace(".", ",")}</>
                      : "Consulte o preço"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}