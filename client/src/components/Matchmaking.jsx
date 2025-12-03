import { useState, useEffect } from 'react';

export default function Matchmaking({ user, socket, onGameStart }) {
    const [searching, setSearching] = useState(false);
    const [view, setView] = useState('menu'); // 'menu', 'random', 'create-room', 'join-room', 'public-rooms'
    const [roomCode, setRoomCode] = useState('');
    const [roomPassword, setRoomPassword] = useState('');
    const [joinRoomCode, setJoinRoomCode] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [createdRoomId, setCreatedRoomId] = useState(null);
    const [publicRooms, setPublicRooms] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        socket.on('room-created', ({ roomId, password }) => {
            setCreatedRoomId(roomId);
            setRoomCode(roomId);
            setView('waiting-room');
        });

        socket.on('room-error', (message) => {
            setError(message);
            setTimeout(() => setError(''), 3000);
        });

        socket.on('public-rooms-list', (rooms) => {
            setPublicRooms(rooms);
        });

        // Pedir lista de salas públicas al entrar
        socket.emit('get-public-rooms');

        return () => {
            socket.off('room-created');
            socket.off('room-error');
            socket.off('public-rooms-list');
        };
    }, [socket]);

    const handleRandomGame = () => {
        setSearching(true);
        setView('random');
        socket.emit('find-game', user);
    };

    const handleCreateRoom = (withPassword) => {
        if (withPassword && !roomPassword) {
            setError('Debes ingresar una contraseña');
            return;
        }
        socket.emit('create-room', { 
            userData: user, 
            password: withPassword ? roomPassword : null 
        });
    };

    const handleJoinRoom = (roomId = null, password = null) => {
        const finalRoomId = roomId || joinRoomCode;
        const finalPassword = password || joinPassword;

        if (!finalRoomId) {
            setError('Debes ingresar un código de sala');
            return;
        }

        socket.emit('join-room', { 
            roomId: finalRoomId, 
            password: finalPassword,
            userData: user 
        });
    };

    const handleCancelSearch = () => {
        setSearching(false);
        setView('menu');
        socket.emit('cancel-search');
    };

    const handleCancelRoom = () => {
        if (createdRoomId) {
            socket.emit('cancel-room', { roomId: createdRoomId });
        }
        setCreatedRoomId(null);
        setRoomCode('');
        setRoomPassword('');
        setView('menu');
    };

    const refreshPublicRooms = () => {
        socket.emit('get-public-rooms');
    };

    if (view === 'random' && searching) {
        return (
            <div style={styles.container}>
                <div style={styles.searchingBox}>
                    <div style={styles.spinner} />
                    <p style={styles.searchingText}>Buscando oponente...</p>
                </div>
                <button onClick={handleCancelSearch} style={styles.cancelButton}>
                    ❌ Cancelar
                </button>
            </div>
        );
    }

    if (view === 'waiting-room' && createdRoomId) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h2 style={styles.title}>🏠 Sala Creada</h2>
                    
                    <div style={styles.roomCodeBox}>
                        <p style={styles.label}>Código de la Sala:</p>
                        <div style={styles.codeDisplay}>{roomCode}</div>
                        <button 
                            onClick={() => navigator.clipboard.writeText(roomCode)}
                            style={styles.copyButton}
                        >
                            📋 Copiar Código
                        </button>
                    </div>

                    {roomPassword && (
                        <div style={styles.roomCodeBox}>
                            <p style={styles.label}>Contraseña:</p>
                            <div style={styles.codeDisplay}>{roomPassword}</div>
                        </div>
                    )}

                    <div style={styles.waitingIndicator}>
                        <div style={styles.spinner} />
                        <p style={styles.waitingText}>Esperando a que alguien se una...</p>
                    </div>

                    <button onClick={handleCancelRoom} style={styles.cancelButton}>
                        ❌ Cancelar Sala
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'create-room') {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h2 style={styles.title}>🏠 Crear Sala</h2>
                    
                    <div style={styles.optionsContainer}>
                        <button 
                            onClick={() => handleCreateRoom(false)}
                            style={styles.primaryButton}
                        >
                            🌐 Crear Sala Pública
                        </button>
                        
                        <div style={styles.divider}>
                            <span>o</span>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Contraseña (opcional):</label>
                            <input
                                type="password"
                                value={roomPassword}
                                onChange={(e) => setRoomPassword(e.target.value)}
                                placeholder="Ingresa una contraseña"
                                style={styles.input}
                            />
                        </div>

                        <button 
                            onClick={() => handleCreateRoom(true)}
                            style={styles.secondaryButton}
                        >
                            🔒 Crear Sala Privada
                        </button>
                    </div>

                    {error && <div style={styles.error}>{error}</div>}

                    <button 
                        onClick={() => { setView('menu'); setRoomPassword(''); }}
                        style={styles.backButton}
                    >
                        ← Volver
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'join-room') {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h2 style={styles.title}>🔗 Unirse a Sala</h2>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Código de Sala:</label>
                        <input
                            type="text"
                            value={joinRoomCode}
                            onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                            placeholder="Ej: ABC123"
                            style={styles.input}
                            maxLength={6}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Contraseña (si es privada):</label>
                        <input
                            type="password"
                            value={joinPassword}
                            onChange={(e) => setJoinPassword(e.target.value)}
                            placeholder="Contraseña"
                            style={styles.input}
                        />
                    </div>

                    <button onClick={() => handleJoinRoom()} style={styles.primaryButton}>
                        ✅ Unirse a Sala
                    </button>

                    {error && <div style={styles.error}>{error}</div>}

                    <button 
                        onClick={() => { 
                            setView('menu'); 
                            setJoinRoomCode(''); 
                            setJoinPassword(''); 
                        }}
                        style={styles.backButton}
                    >
                        ← Volver
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'public-rooms') {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <h2 style={styles.title}>🌐 Salas Públicas</h2>
                        <button onClick={refreshPublicRooms} style={styles.refreshButton}>
                            🔄
                        </button>
                    </div>
                    
                    {publicRooms.length === 0 ? (
                        <p style={styles.noRoomsText}>No hay salas públicas disponibles</p>
                    ) : (
                        <div style={styles.roomsList}>
                            {publicRooms.map(room => (
                                <div key={room.id} style={styles.roomItem}>
                                    <div style={styles.roomInfo}>
                                        <span style={styles.roomCreator}>👤 {room.creator}</span>
                                        <span style={styles.roomCode}>Sala: {room.id}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleJoinRoom(room.id)}
                                        style={styles.joinButton}
                                    >
                                        Unirse
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && <div style={styles.error}>{error}</div>}

                    <button onClick={() => setView('menu')} style={styles.backButton}>
                        ← Volver
                    </button>
                </div>
            </div>
        );
    }

    // Vista del menú principal
    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.mainTitle}>♛ Chess Online</h1>
                <p style={styles.subtitle}>Conectado como <strong>{user.username}</strong></p>
            </div>

            <div style={styles.menuCard}>
                <button onClick={handleRandomGame} style={styles.menuButton}>
                    🎲 Partida Aleatoria
                </button>

                <button onClick={() => setView('create-room')} style={styles.menuButton}>
                    🏠 Crear Sala
                </button>

                <button onClick={() => setView('join-room')} style={styles.menuButton}>
                    🔗 Unirse con Código
                </button>

                <button onClick={() => setView('public-rooms')} style={styles.menuButton}>
                    🌐 Ver Salas Públicas
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f2027 0%, #202443 50%, #0c0e0e 100%)',
        gap: '30px',
        padding: '20px'
    },
    header: {
        textAlign: 'center',
        color: 'white'
    },
    mainTitle: {
        fontSize: '48px',
        margin: '0 0 10px 0'
    },
    subtitle: {
        fontSize: '20px',
        color: '#9ca3af'
    },
    menuCard: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        minWidth: '400px'
    },
    menuButton: {
        padding: '20px 40px',
        fontSize: '20px',
        fontWeight: 'bold',
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: 'white',
        border: '2px solid rgba(255,255,255,0.2)',
        borderRadius: '15px',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s'
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: '40px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255,255,255,0.2)',
        minWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    title: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: 'white',
        margin: 0,
        textAlign: 'center'
    },
    optionsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    primaryButton: {
        padding: '15px 30px',
        fontSize: '18px',
        fontWeight: 'bold',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.3s'
    },
    secondaryButton: {
        padding: '15px 30px',
        fontSize: '18px',
        fontWeight: 'bold',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.3s'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        color: 'white',
        fontSize: '16px',
        fontWeight: '500'
    },
    input: {
        padding: '12px',
        fontSize: '16px',
        borderRadius: '8px',
        border: '2px solid rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(0,0,0,0.3)',
        color: 'white'
    },
    roomCodeBox: {
        textAlign: 'center',
        padding: '20px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: '10px'
    },
    codeDisplay: {
        fontSize: '36px',
        fontWeight: 'bold',
        color: '#4CAF50',
        letterSpacing: '8px',
        margin: '10px 0'
    },
    copyButton: {
        padding: '10px 20px',
        fontSize: '14px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '8px',
        cursor: 'pointer',
        marginTop: '10px'
    },
    waitingIndicator: {
        textAlign: 'center',
        padding: '20px'
    },
    waitingText: {
        color: 'white',
        fontSize: '18px',
        margin: '10px 0'
    },
    divider: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '14px',
        margin: '10px 0'
    },
    error: {
        padding: '12px',
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        border: '1px solid rgba(220, 38, 38, 0.4)',
        borderRadius: '8px',
        color: '#fca5a5',
        fontSize: '14px'
    },
    cancelButton: {
        padding: '12px 30px',
        fontSize: '16px',
        backgroundColor: '#dc2626',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: 'bold'
    },
    backButton: {
        padding: '12px 30px',
        fontSize: '16px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '10px',
        cursor: 'pointer'
    },
    searchingBox: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        padding: '40px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255,255,255,0.2)'
    },
    spinner: {
        width: '60px',
        height: '60px',
        border: '6px solid rgba(255,255,255,0.3)',
        borderTop: '6px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    searchingText: {
        color: 'white',
        fontSize: '20px',
        margin: 0
    },
    refreshButton: {
        padding: '8px 12px',
        fontSize: '20px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '8px',
        cursor: 'pointer',
        color: 'white'
    },
    roomsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxHeight: '400px',
        overflowY: 'auto'
    },
    roomItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)'
    },
    roomInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
    },
    roomCreator: {
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold'
    },
    roomCode: {
        color: '#9ca3af',
        fontSize: '14px'
    },
    joinButton: {
        padding: '8px 20px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold'
    },
    noRoomsText: {
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        fontSize: '16px',
        padding: '40px 20px'
    }
};