import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Cadastro } from "./pages/Cadastro";
import { Home } from "./pages/Home";
import { Sabor } from "./pages/Sabor";
import { AuthProvider } from "./contexts/AuthProvider";
import { PrivateRoute } from "./components/PrivateRoute";
import { AdminRoute } from "./components/AdminRoute";
import { AreaAdmin } from "./pages/Admin";


export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sabores/:id" element= {<Sabor />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/meus-pedidos" element={<PrivateRoute><h1>meus pedidos</h1></PrivateRoute>}/>
          <Route path="/perfil" element={<PrivateRoute><h1>perfil</h1></PrivateRoute>}/>
          <Route path="/admin" element={<AdminRoute><AreaAdmin /></AdminRoute>}/>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
