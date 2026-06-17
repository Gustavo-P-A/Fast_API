import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import { Navbar } from "./components/Navbar";
import { PrivateRoute } from "./components/PrivateRoute";
import { AdminRoute } from "./components/AdminRoute";

const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const Login = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));
const Cadastro = lazy(() => import("./pages/Cadastro").then(m => ({ default: m.Cadastro })));
const Sabor = lazy(() => import("./pages/Sabor").then(m => ({ default: m.Sabor })));
const Perfil = lazy(() => import("./pages/Perfil").then(m => ({ default: m.Perfil })));
const MeusPedidos = lazy(() => import("./pages/MeusPedidos").then(m => ({ default: m.MeusPedidos })));
const FinalizarPedido = lazy(() => import("./pages/FinalizarPedido").then(m => ({ default: m.FinalizarPedido })));
const NovoProduto = lazy(() => import("./pages/NovoProduto").then(m => ({ default: m.NovoProduto })));

const AdminLayout = lazy(() => import("./components/AdminLayout.jsx").then(m => ({ default: m.AdminLayout })));
const AdminProdutos = lazy(() => import("./pages/Admin/Produtos.jsx").then(m => ({ default: m.AdminProdutos })));
const AdminGrades = lazy(() => import("./pages/Admin/Grades.jsx").then(m => ({ default: m.AdminGrades })));
const AdminPedidos = lazy(() => import("./pages/Admin/Pedidos.jsx").then(m => ({ default: m.AdminPedidos })));
const AdminClientes = lazy(() => import("./pages/Admin/Clientes.jsx").then(m => ({ default: m.AdminClientes })));
const AdminDashboard = lazy(() => import("./pages/Admin/Dashboard.jsx").then(m => ({ default: m.AdminDashboard })));

function PageLoader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <span>Carregando...</span>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Rotas públicas e de cliente */}
            <Route path="/" element={<Home />} />
            <Route path="/sabores/:id" element={<Sabor />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/meus-pedidos" element={<PrivateRoute><MeusPedidos /></PrivateRoute>} />
            <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
            <Route path="/finalizar-pedido" element={<PrivateRoute><FinalizarPedido /></PrivateRoute>} />

            {/* Rotas admin com sidebar */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<Navigate to="produtos" replace />} />
              <Route path="produtos" element={<AdminProdutos />} />
              <Route path="grades" element={<AdminGrades />} />
              <Route path="pedidos" element={<AdminPedidos />} />
              <Route path="clientes" element={<AdminClientes />} />
              <Route path="dashboard" element={<AdminDashboard />} />
            </Route>

            {/* Criar/editar produto fora do layout admin (página cheia) */}
            <Route path="/novo-produto" element={<AdminRoute><NovoProduto /></AdminRoute>} />
            <Route path="/novo-produto/:id" element={<AdminRoute><NovoProduto /></AdminRoute>} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}