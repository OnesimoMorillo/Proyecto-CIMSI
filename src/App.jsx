import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Board from './components/Board';
import Matchmaking from './components/Matchmaking';
import LoginRegister from './pages/LoginRegister';
import './styles/App.css';

// Conectar al servidor Socket.IO
const SOCKET_URL = 'http://localhost:3000'; // Cambiar por tu servidor
const socket = io(SOCKET_URL, {
    autoConnect: false
});

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [gameData, setGameData] = useState(null);
    const [inGame, setInGame] = useState(false);

    // Verificar sesión guardada
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (savedUser && token) {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            
            // Conectar socket
            socket.connect();
        }
        setLoading(false);
    }, []);

    // Escuchar eventos de partida
    useEffect(() => {
        if (!user) return;

        socket.on('waiting-opponent', () => {
            console.log('Esperando oponente...');
        });

        socket.on('game-start', (data) => {
            console.log('¡Partida encontrada!', data);
            setGameData(data);
            setInGame(true);
        });

        return () => {
            socket.off('waiting-opponent');
            socket.off('game-start');
        };
    }, [user]);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        socket.connect();
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        socket.disconnect();
        setUser(null);
        setInGame(false);
        setGameData(null);
    };

    const handleGameEnd = () => {
        setInGame(false);
        setGameData(null);
    };

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
                    {/* Header con usuario y logout */}
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
                    
                    {/* Mostrar pantalla según estado */}
                    {inGame ? (
                        <Board 
                            gameData={gameData} 
                            socket={socket} 
                            user={user}
                            onGameEnd={handleGameEnd}
                        />
                    ) : (
                        <Matchmaking 
                            user={user} 
                            socket={socket}
                            onGameStart={(data) => {
                                setGameData(data);
                                setInGame(true);
                            }}
                        />
                    )}
                </>
            ) : (
                <LoginRegister onLoginSuccess={handleLoginSuccess} />
            )}
        </div>
    );
}

export default App;
