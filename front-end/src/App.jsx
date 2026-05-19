import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Cadastro } from "./pages/Cadastro";
import { Home } from "./pages/Home";
import { Sabor } from "./pages/Sabor";
import { AuthProvider } from "./contexts/AuthProvider";
import { PrivateRoute } from "./components/PrivateRoute";
import { AdminRoute } from "./components/AdminRoute";
import { AreaAdmin } from "./pages/Admin";
import { Navbar } from "./components/Navbar";
import { Perfil } from "./pages/Perfil";
import { MeusPedidos } from "./pages/MeusPedidos";
import { FinalizarPedido } from "./pages/FinalizarPedido"

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sabores/:id" element= {<Sabor />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/meus-pedidos" element={<PrivateRoute><MeusPedidos /></PrivateRoute>}/>
          <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>}/>
          <Route path="/admin" element={<AdminRoute><AreaAdmin /></AdminRoute>}/>
          <Route path="/finalizar-pedido/:id" element={<PrivateRoute><FinalizarPedido/></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
