# 🍕 Pizzaria — Sistema Web Completo

> Plataforma completa para gerenciamento e venda online de pizzas, desenvolvida com FastAPI e React.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Backend](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi)
![Frontend](https://img.shields.io/badge/frontend-React-61DAFB?logo=react)
![Banco](https://img.shields.io/badge/banco-SQLite-003B57?logo=sqlite)

---

## 📌 Sobre o Projeto

Sistema web completo para pizzarias, com área de cliente, cardápio interativo, pedidos online e painel administrativo. O cliente consegue montar seu pedido, escolher tamanho, sabores, bordas e adicionais — tudo pelo navegador.

---

## ✅ Funcionalidades Implementadas

### 👤 Autenticação
- Cadastro e login de usuários
- Autenticação via JWT (Access Token + Refresh Token)
- Renovação automática de token (sem precisar logar novamente)
- Controle de acesso por nível (cliente / administrador)

### 🍕 Cardápio
- Listagem de sabores com categoria
- Visualização de preços por tamanho
- Adicionais disponíveis por tamanho
- Filtro de produtos ativos/inativos

### 🛒 Pedidos
- Criação de pedido
- Adição de itens (pizza + adicionais)
- Finalização com endereço e forma de pagamento
- Histórico de pedidos do cliente

### 🏠 Endereços
- Cadastro, edição e remoção de endereços de entrega

### 🔧 Painel Administrativo
- Gerenciamento de produtos (criar, editar, excluir)
- Upload de imagem dos produtos
- Controle de tamanhos e preços
- Ativar/desativar produtos do cardápio
- Gerenciamento de grades e categorias

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Backend | FastAPI (Python) |
| Frontend | React + Vite |
| Banco de dados | SQLite + SQLAlchemy |
| Autenticação | JWT (python-jose) |
| Estilização | CSS puro |
| Roteamento | React Router DOM |
| HTTP Client | Axios |

---

## 🚧 Em Desenvolvimento

- [ ] Upload de imagem dos produtos
- [ ] Preview do produto no painel admin
- [ ] Status do produto (ativo, disponível hoje, em destaque)
- [ ] Dashboard com métricas e relatórios
- [ ] Painel de controle de pedidos em tempo real
- [ ] Integração com meios de pagamento (PIX, cartão)
- [ ] Notificações de status do pedido
- [ ] Versão mobile otimizada

---

## 📁 Estrutura do Projeto

```
/
├── Fast_API/         # Backend (FastAPI)
│   ├── models.py
│   ├── schemas.py
│   ├── main.py
│   ├── auth_routes.py
│   ├── cardapio_routes.py
│   ├── order_routes.py
│   ├── area_admin.py
│   └── uploads/
│
└── front-end/        # Frontend (React + Vite)
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── api/
    │   ├── contexts/
    │   └── styles/
```

---

> 🚧 Projeto em desenvolvimento ativo.