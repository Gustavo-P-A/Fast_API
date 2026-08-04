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

  function abrirProduto(produto) {
    if (produto.tipo === "bebida") {
      navigate(`/bebida/${produto.id}`);
    } else if (produto.tipo === "monte_pizza") {
      navigate(`/monte-pizza/${produto.id}`);
    } else {
      navigate(`/sabores/${produto.id}`);
    }
  }

  return (
    <div className="home-page">
      {grades.map(grade => (
        <section key={grade.grade_id} className="home-secao">
          <h2 className="home-secao-titulo">
            {grade.posicao === 0 ? "⭐ " : ""}{grade.grade_nome}
          </h2>
          <div className="home-grid">
            {grade.produtos.map(produto => (
              <div
                key={`${produto.tipo}-${produto.id}`}
                className="home-card"
                onClick={() => abrirProduto(produto)}
              >
                <div className="home-card-foto">
                  {produto.imagem_url
                    ? <img src={produto.imagem_url} alt={produto.nome} />
                    : <div className="home-card-sem-foto">{produto.tipo === "bebida" ? "🥤" : "🍕"}</div>
                  }
                </div>
                <div className="home-card-info">
                  <p className="home-card-nome">{produto.nome}</p>
                  <p className="home-card-descricao">{produto.descricao}</p>
                  <p className="home-card-preco">
                    {produto.tipo === "bebida"
                      ? <>R$ {Number(produto.menor_preco).toFixed(2).replace(".", ",")}</>
                      : produto.menor_preco
                        ? <><span className="home-card-preco-label">A partir de </span>R$ {Number(produto.menor_preco).toFixed(2).replace(".", ",")}</>
                        : produto.tipo === "monte_pizza"
                          ? "Monte do seu jeito"
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