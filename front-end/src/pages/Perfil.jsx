import { useContext } from "react"
import { AuthContext } from "../contexts/AuthContext"



export function Perfil(){

    const { usuario, handleLogout} = useContext(AuthContext);


    return(
        <div>
            <h1>Olá, {usuario.nome}</h1>
            <button onClick={handleLogout} >Sair</button>
        </div>
    )
}