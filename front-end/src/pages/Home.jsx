import { useState, useEffect } from "react";
import { cardapio, precos } from "../api/auth";
import { Navigate, useNavigate } from "react-router-dom";
import "../styles/Home.css";

export function Home() {
  const [sabores, setSabores] = useState([]);
  const [listapreco, setListapreco] = useState([]);

  useEffect(() => {
    async function buscarSabores() {
      const data = await cardapio();
      const data1 = await precos();
      setSabores(data);
      setListapreco(data1);
    }
    buscarSabores();
  }, []);

  const navigate = useNavigate();

  return (
    <div className="container">
      {sabores.map((sabor) => {
        const precosFiltrados = listapreco.filter(
          (p) => p.sabor_rel.nome === sabor.nome,
        );

        const menorPreco =
          precosFiltrados.length > 0
            ? Math.min(...precosFiltrados.map((p) => p.preco))
            : null;

        const nomeImagem = `${sabor.nome.toLowerCase().replace(/ /g, "_")}.png`;

        return (
          <div key={sabor.id} className="card" onClick={() => navigate(`/sabores/${sabor.id}`)}>
            <div className="foto-container">
              <img src={`/${nomeImagem}`} alt={sabor.nome} />
            </div>
            <div className="info">
              <p className="nome">{sabor.nome}</p>
              <p className="descricao">{sabor.descricao}</p>
              <p className="preco">
                {menorPreco
                  ? `A partir de R$ ${menorPreco.toFixed(2).replace(".", ",")}`
                  : "Consulte o preço"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
