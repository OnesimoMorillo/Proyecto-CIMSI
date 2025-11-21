import { useState, useEffect } from 'react';
import Board from './components/Board';
import LoginRegister from './pages/LoginRegister';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay sesión guardada al cargar
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Callback cuando el login es exitoso
  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Mostrar loading mientras verifica sesión
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f2027 0%, #202443 50%, #0c0e0e 100%)',
        color: 'white'
      }}>
        Cargando...
      </div>
    );
  }

  return (
    <div className="App" style={{ minHeight: '100vh' }}>
      {user ? (
        <>
          {/* Header con info del usuario y botón logout */}
          <div style={{ 
            position: 'fixed', 
            top: '20px', 
            right: '20px', 
            zIndex: 1000,
            display: 'flex',
            gap: '15px',
            alignItems: 'center'
          }}>
            <span style={{
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '10px 20px',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)'
            }}>
              👤 {user.username}
            </span>
            <button 
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              🚪 Cerrar Sesión
            </button>
          </div>
          
          {/* Mostrar tablero solo si está autenticado */}
          <Board />
        </>
      ) : (
        /* Mostrar login si NO está autenticado */
        <LoginRegister onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;