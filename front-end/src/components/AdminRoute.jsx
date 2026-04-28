import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function AdminRoute({children}){
   const { usuario } = useContext(AuthContext)

    if (!usuario || !usuario.adm) {
    return <Navigate to='/login' replace />
}

    return children
}