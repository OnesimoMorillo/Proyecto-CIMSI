import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

function Board({ gameData, socket, user, onGameEnd }) {
    const [game, setGame] = useState(new Chess(gameData.fen));
    const [myColor, setMyColor] = useState(gameData.color);
    const [boardOrientation, setBoardOrientation] = useState(gameData.color === 'white' ? 'white' : 'black');

    useEffect(() => {
        // Escuchar movimientos del oponente
        socket.on('opponent-move', ({ move, newFen }) => {
            const gameCopy = new Chess(newFen);
            setGame(gameCopy);
            
            // Verificar fin de juego
            checkGameEnd(gameCopy);
        });

        // Oponente se desconectó
        socket.on('opponent-disconnected', () => {
            alert('Tu oponente se ha desconectado. Has ganado por abandono.');
            onGameEnd();
        });

        // Juego terminado
        socket.on('game-ended', ({ result, winner }) => {
            if (result === 'draw') {
                alert('La partida ha terminado en empate.');
            } else if (result === 'resignation') {
                const youWon = (winner === 'white' && myColor === 'white') || 
                               (winner === 'black' && myColor === 'black');
                alert(youWon ? '¡Has ganado! Tu oponente se rindió.' : 'Has perdido. Te rendiste.');
            }
            onGameEnd();
        });

        return () => {
            socket.off('opponent-move');
            socket.off('opponent-disconnected');
            socket.off('game-ended');
        };
    }, [socket, myColor, onGameEnd]);

    function checkGameEnd(gameCopy) {
        setTimeout(() => {
            if (gameCopy.isGameOver()) {
                if (gameCopy.isCheckmate()) {
                    const winner = gameCopy.turn() === 'w' ? 'Negras' : 'Blancas';
                    alert(`¡Jaque mate! Ganaron las ${winner}`);
                    onGameEnd();
                } else if (gameCopy.isDraw() || gameCopy.isStalemate()) {
                    alert('¡La partida terminó en empate!');
                    onGameEnd();
                }
            }
        }, 100);
    }

    function onDrop(sourceSquare, targetSquare) {
        // Verificar que sea tu turno
        const isMyTurn = (game.turn() === 'w' && myColor === 'white') || 
                        (game.turn() === 'b' && myColor === 'black');
        
        if (!isMyTurn) {
            return false;
        }

        const gameCopy = new Chess(game.fen());
        
        try {
            const move = gameCopy.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q'
            });

            if (move === null) return false;

            setGame(gameCopy);

            // Enviar movimiento al servidor
            socket.emit('make-move', {
                gameId: gameData.gameId,
                move: move.san,
                newFen: gameCopy.fen()
            });

            // Verificar fin de juego
            checkGameEnd(gameCopy);

            return true;
        } catch (error) {
            console.error('Error en el movimiento:', error);
            return false;
        }
    }

    function handleResign() {
        if (window.confirm('¿Estás seguro de que quieres rendirte?')) {
            socket.emit('resign', { gameId: gameData.gameId });
        }
    }

    const isMyTurn = (game.turn() === 'w' && myColor === 'white') || 
                     (game.turn() === 'b' && myColor === 'black');

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f2027 0%, #202443ff 50%, #0c0e0eff 100%)',
            padding: '20px',
            gap: '20px'
        }}>
            {/* Info del oponente */}
            <div style={{
                padding: '15px 30px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: '10px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold'
            }}>
                🎯 VS {gameData.opponent.username}
            </div>

            {/* Tablero */}
            <div style={{ 
                maxWidth: '600px', 
                width: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '3px solid rgba(255,255,255,0.1)'
            }}>
                <Chessboard 
                    position={game.fen()}
                    onPieceDrop={onDrop}
                    boardWidth={600}
                    boardOrientation={boardOrientation}
                    customBoardStyle={{
                        borderRadius: '8px'
                    }}
                />
            </div>

            {/* Información del turno */}
            <div style={{ 
                display: 'flex', 
                gap: '15px', 
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                <div style={{ 
                    padding: '12px 24px',
                    fontSize: '18px',
                    backgroundColor: isMyTurn ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(10px)',
                    border: isMyTurn ? '2px solid #4CAF50' : '1px solid rgba(255,255,255,0.2)'
                }}>
                    {isMyTurn ? '✅ Tu turno' : '⏳ Turno del oponente'}
                </div>

                <div style={{ 
                    padding: '12px 24px',
                    fontSize: '18px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    Tú: {myColor === 'white' ? '⚪ Blancas' : '⚫ Negras'}
                </div>

                {game.isCheck() && (
                    <div style={{ 
                        padding: '12px 24px',
                        fontSize: '18px',
                        backgroundColor: 'rgba(220, 38, 38, 0.3)',
                        color: '#fca5a5',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(220, 38, 38, 0.5)',
                        animation: 'pulse 1s infinite'
                    }}>
                        ⚠️ ¡JAQUE!
                    </div>
                )}
            </div>

            {/* Botones de control */}
            <div style={{ 
                display: 'flex', 
                gap: '15px',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                <button 
                    onClick={() => setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white')}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.3s'
                    }}
                >
                    🔄 Rotar Tablero
                </button>

                <button 
                    onClick={handleResign}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
                        transition: 'all 0.3s'
                    }}
                >
                    🏳️ Rendirse
                </button>
            </div>

            {/* Historial */}
            {game.history().length > 0 && (
                <div style={{
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    padding: '15px 20px',
                    borderRadius: '10px',
                    maxWidth: '600px',
                    width: '100%',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <h3 style={{ 
                        color: '#fff', 
                        margin: '0 0 10px 0',
                        fontSize: '16px'
                    }}>
                        📜 Movimientos: {game.history().length}
                    </h3>
                    <div style={{
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '14px',
                        maxHeight: '100px',
                        overflowY: 'auto'
                    }}>
                        {game.history().join(', ')}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Board;
