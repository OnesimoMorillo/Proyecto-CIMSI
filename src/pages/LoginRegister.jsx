// src/components/auth/LoginRegister.jsx
import React, { useState } from 'react';
// IMPORTANTE: Asegúrate de que el CSS esté importado globalmente
// (Normalmente en main.jsx o App.jsx, pero aquí solo usamos las clases)

// NO NECESITAS DEFINIR CONSTANTES DE COLOR AQUÍ si usas variables CSS
// const primaryDark = 'bg-gray-900'; 
// const secondaryDark = 'bg-gray-800'; 
// const accentColor = 'bg-indigo-600 hover:bg-indigo-700'; 


export default function LoginRegister() {
    const [isLogin, setIsLogin] = useState(true); 

    const toggleForm = () => {
        setIsLogin(!isLogin);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">
                    ♛ Chess Online
                </h1>
                
                {/* Selector de Pestaña */}
                <div className="tab-selector">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`tab-button ${isLogin ? 'active' : ''}`}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`tab-button ${!isLogin ? 'active' : ''}`}
                    >
                        Registrarse
                    </button>
                </div>

                {isLogin ? <LoginForm /> : <RegisterForm />}

                {/* Pie de página con link de alternancia */}
                <p className="auth-footer">
                    {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                    <button onClick={toggleForm}>
                        {isLogin ? "Regístrate aquí" : "Inicia Sesión"}
                    </button>
                </p>
            </div>
        </div>
    );
}

// Componente para Iniciar Sesión (RF-002)
function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Login intentado:', { username, password });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label className="form-label">
                    Nombre de Usuario
                </label>
                <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                />
            </div>
            <div className="form-group">
                <label className="form-label">
                    Contraseña
                </label>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                />
            </div>
            <button
                type="submit"
                className="submit-button"
            >
                Iniciar Sesión
            </button>
        </form>
    );
}

// Componente para Registro de Usuario (RF-001)
function RegisterForm() {
    // ... Estados y lógica
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Registro intentado:', { username, email, password, confirmPassword });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label className="form-label">
                    Nombre de Usuario (Único)
                </label>
                <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                />
            </div>
            <div className="form-group">
                <label className="form-label">
                    Email
                </label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                />
            </div>
            <div className="form-group">
                <label className="form-label">
                    Contraseña (Mín. 6 chars)
                </label>
                <input
                    type="password"
                    required
                    minLength="6"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                />
            </div>
            <div className="form-group">
                <label className="form-label">
                    Confirmar Contraseña
                </label>
                <input
                    type="password"
                    required
                    minLength="6"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                />
            </div>
            <button
                type="submit"
                className="submit-button"
            >
                Registrarse
            </button>
        </form>
    );
}