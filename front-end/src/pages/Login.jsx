import { useState, useContext } from "react"
import { AuthContext } from '../contexts/AuthContext'
import "../styles/Login.css"; 

export function Login() {
    const [Email, setEmail] = useState('')
    const [Senha, setSenha] = useState('')
    const { handleLogin } = useContext(AuthContext)

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="logo-area">
                    <h1>Pizza<span>App</span></h1>
                </div>
                
                <h2>Bem-vindo de volta!</h2>
                
                <div className="login-form">
                    <div className="input-group">
                        <label>E-mail</label>
                        <input 
                            type="text" 
                            placeholder="exemplo@email.com" 
                            value={Email} 
                            onChange={(e) => setEmail(e.target.value)} 
                        />  
                    </div>

                    <div className="input-group">
                        <label>Senha</label>
                        <input 
                            type="password" 
                            placeholder="Sua senha" 
                            value={Senha} 
                            onChange={(e) => setSenha(e.target.value)}
                        />
                    </div>

                    <button className="btn-login" onClick={() => handleLogin(Email, Senha)}>
                        Entrar
                    </button>
                </div>

                <div className="login-footer">
                    <p>Não tem uma conta? <a href="/cadastro">Cadastre-se</a></p>
                </div>
            </div>
        </div>
    )
}
