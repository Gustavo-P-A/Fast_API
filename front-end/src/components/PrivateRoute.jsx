import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function PrivateRoute({children}){
    const { verificar_token}= useContext(AuthContext)

    if (!verificar_token){
        return <Navigate to='/login' replace />
    }

    return children
}