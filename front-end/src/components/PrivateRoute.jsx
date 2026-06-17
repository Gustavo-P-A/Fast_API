import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function PrivateRoute({children}){
    const { usuario, carregando } = useContext(AuthContext)

    if (carregando) {
        return <div>Carregando...</div>
    }

    if (!usuario) {
        return <Navigate to='/login' replace />
    }

    return children
}