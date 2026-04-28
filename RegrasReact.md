my-rocketseat-app/
├── public/
│ └── index.html
├── src/
│ ├── assets/ # Imagens e arquivos estáticos
│ ├── components/ # Componentes reutilizáveis
│ │ ├── Button/
│ │ │ ├── Button.js
│ │ │ ├── Button.test.js
│ │ │ └── Button.css
│ │ └── Modal/
│ │ ├── Modal.js
│ │ ├── Modal.test.js
│ │ └── Modal.css
│ ├── context/ # Contextos para estado global
│ │ └── AuthContext.js
│ ├── features/ # Funcionalidades específicas da aplicação
│ │ ├── Auth/
│ │ │ ├── Login.js
│ │ │ ├── Register.js
│ │ │ └── authSlice.js
│ │ └── Dashboard/
│ │ ├── Dashboard.js
│ │ ├── Dashboard.css
│ │ └── Dashboard.test.js
│ ├── hooks/ # Hooks personalizados
│ │ ├── useAuth.js
│ │ └── useFetch.js
│ ├── pages/ # Páginas principais da aplicação
│ │ ├── Home.js
│ │ └── Profile.js
│ ├── services/ # Serviços de API e outras integrações externas
│ │ ├── api.js
│ │ └── authService.js
│ ├── styles/ # Estilos globais
│ │ ├── variables.css
│ │ └── main.css
│ ├── utils/ # Utilitários e funções auxiliares
│ │ ├── formatDate.js
│ │ └── slugify.js
│ ├── App.js
│ ├── index.js
│ └── setupTests.js # Configurações globais para testes
├── .env # Variáveis de ambiente
├── package.json
└── README.md

# 1. Gera o arquivo de migração novo com base nos seus models atuais

> > python -m alembic revision --autogenerate -m "Ajuste no Pedidos"
> >
> > # 2. Cria o arquivo banco.db novo com todas as tabelas
> >
> > python -m alembic upgrade head

Para que serve cada pasta

api — funções que chamam seu backend FastAPI
components — peças reutilizáveis como botões, cards, navbar
contexts — estado global como o usuário logado e o carrinho
pages — as telas completas como Home, Login, Cardápio
services — lógica de negócio separada
styles — arquivos CSS

Por onde começar
A ordem certa é:

api — configura a conexão com o backend
contexts — cria o contexto de autenticação
pages — cria as telas
components — cria os componentes reutilizáveis
