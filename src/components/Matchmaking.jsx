import { useState } from 'react';

export default function Matchmaking({ user, socket, onGameStart }) {
    const [searching, setSearching] = useState(false);

    const handleFindGame = () => {
        setSearching(true);
        socket.emit('find-game', user);
    };

    const handleCancel = () => {
        setSearching(false);
        socket.emit('cancel-search');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f2027 0%, #202443 50%, #0c0e0e 100%)',
            gap: '30px',
            padding: '20px'
        }}>
            <div style={{
                textAlign: 'center',
                color: 'white'
            }}>
                <h1 style={{ fontSize: '48px', margin: '0 0 10px 0' }}>♛ Chess Online</h1>
                <p style={{ fontSize: '20px', color: '#9ca3af' }}>
                    Conectado como <strong>{user.username}</strong>
                </p>
            </div>

            {!searching ? (
                <button
                    onClick={handleFindGame}
                    style={{
                        padding: '20px 60px',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '15px',
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(76, 175, 80, 0.4)',
                        transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-5px)';
                        e.target.style.boxShadow = '0 12px 30px rgba(76, 175, 80, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 8px 20px rgba(76, 175, 80, 0.4)';
                    }}
                >
                    🎮 Buscar Partida
                </button>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <div style={{
                        padding: '30px 50px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '15px',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255,255,255,0.2)'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            border: '6px solid rgba(255,255,255,0.3)',
                            borderTop: '6px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 20px'
                        }} />
                        <p style={{
                            color: 'white',
                            fontSize: '20px',
                            margin: 0
                        }}>
                            Buscando oponente...
                        </p>
                    </div>

                    <button
                        onClick={handleCancel}
                        style={{
                            padding: '12px 30px',
                            fontSize: '16px',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        ❌ Cancelar
                    </button>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
