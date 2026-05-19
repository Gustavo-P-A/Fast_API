import { useNavigate, useLocation  } from 'react-router-dom';
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext"



export function Navbar(){
    const { verificar_token, usuario } = useContext(AuthContext);

    const navigate = useNavigate();
    
    const location = useLocation()
    const esconder = ['/login', '/cadastro'].includes(location.pathname)

    if (usuario === null && verificar_token) return null
    if (esconder) return null

 

    return(
        <div>
            <div>
                <button onClick={() => navigate('/')} > Logo pizza </button>
                <button onClick={() => verificar_token ? navigate('/meus-pedidos') : navigate('/login')} >Meus pedidos</button>
                <button onClick={() => verificar_token ? navigate('/perfil') : navigate('/login')} > Minha conta </button>
                { usuario?.adm &&(
                    <button onClick={() => navigate('/admin')} > Area admin </button>
                )}
            </div>
        </div>
    )
}