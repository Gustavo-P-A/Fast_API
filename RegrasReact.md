my-rocketseat-app/
├── public/
│   └── index.html
├── src/
│   ├── assets/                  # Imagens e arquivos estáticos
│   ├── components/              # Componentes reutilizáveis
│   │   ├── Button/
│   │   │   ├── Button.js
│   │   │   ├── Button.test.js
│   │   │   └── Button.css
│   │   └── Modal/
│   │       ├── Modal.js
│   │       ├── Modal.test.js
│   │       └── Modal.css
│   ├── context/                 # Contextos para estado global
│   │   └── AuthContext.js
│   ├── features/                # Funcionalidades específicas da aplicação
│   │   ├── Auth/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   └── authSlice.js
│   │   └── Dashboard/
│   │       ├── Dashboard.js
│   │       ├── Dashboard.css
│   │       └── Dashboard.test.js
│   ├── hooks/                   # Hooks personalizados
│   │   ├── useAuth.js
│   │   └── useFetch.js
│   ├── pages/                   # Páginas principais da aplicação
│   │   ├── Home.js
│   │   └── Profile.js
│   ├── services/                # Serviços de API e outras integrações externas
│   │   ├── api.js
│   │   └── authService.js
│   ├── styles/                  # Estilos globais
│   │   ├── variables.css
│   │   └── main.css
│   ├── utils/                   # Utilitários e funções auxiliares
│   │   ├── formatDate.js
│   │   └── slugify.js
│   ├── App.js
│   ├── index.js
│   └── setupTests.js            # Configurações globais para testes
├── .env                         # Variáveis de ambiente
├── package.json
└── README.md




import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUsuario({ id: decoded.sub });
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = (tokens) => {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    const decoded = jwtDecode(tokens.access_token);
    setUsuario({ id: decoded.sub });
  };

  const logout = () => {
    localStorage.clear();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);