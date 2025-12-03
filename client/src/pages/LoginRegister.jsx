import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function LoginRegister({ onLoginSuccess}) {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">♛ Chess Online</h1>
                
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

                {isLogin ? (
                    <LoginForm onLoginSuccess={onLoginSuccess} />
                ) : (
                    <RegisterForm onRegisterSuccess={() => setIsLogin(true)} />
                )}

                <p className="auth-footer">
                    {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                    <button onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Regístrate aquí" : "Inicia Sesión"}
                    </button>
                </p>
            </div>
        </div>
    );
}

// ==================== LOGIN FORM ====================
function LoginForm({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar sesión');
            }

            // Guardar token y datos del usuario
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Callback de éxito
            if (onLoginSuccess) {
                onLoginSuccess(data.user);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
                <label className="form-label">Nombre de Usuario</label>
                <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                    disabled={loading}
                />
            </div>
            <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    disabled={loading}
                />
            </div>
            <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
        </form>
    );
}

// ==================== REGISTER FORM ====================
function RegisterForm({ onRegisterSuccess }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validaciones del frontend
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al registrar');
            }

            setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
            
            // Limpiar formulario
            setUsername('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');

            // Cambiar a login después de 2 segundos
            setTimeout(() => {
                if (onRegisterSuccess) onRegisterSuccess();
            }, 2000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="form-group">
                <label className="form-label">Nombre de Usuario (Único)</label>
                <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                    disabled={loading}
                />
            </div>
            <div className="form-group">
                <label className="form-label">Email</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    disabled={loading}
                />
            </div>
            <div className="form-group">
                <label className="form-label">Contraseña (Mín. 6 chars)</label>
                <input
                    type="password"
                    required
                    minLength="6"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    disabled={loading}
                />
            </div>
            <div className="form-group">
                <label className="form-label">Confirmar Contraseña</label>
                <input
                    type="password"
                    required
                    minLength="6"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                    disabled={loading}
                />
            </div>
            <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrarse'}
            </button>
        </form>
    );
}