import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

function Board({ gameData, socket, user, onGameEnd }) {
    const [game, setGame] = useState(new Chess(gameData.fen));
    const [myColor, setMyColor] = useState(gameData.color);
    const [boardOrientation, setBoardOrientation] = useState(gameData.color === 'white' ? 'white' : 'black');
    
    // Estados para la promoción del peón
    const [showPromotionDialog, setShowPromotionDialog] = useState(false);
    const [promotionMove, setPromotionMove] = useState(null);

    useEffect(() => {
        socket.on('opponent-move', ({ move, newFen }) => {
            const gameCopy = new Chess(newFen);
            setGame(gameCopy);
            checkGameEnd(gameCopy);
        });

        socket.on('opponent-disconnected', () => {
            alert('Tu oponente se ha desconectado. Has ganado por abandono.');
            onGameEnd();
        });

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

    function isPromotion(sourceSquare, targetSquare) {
        const piece = game.get(sourceSquare);
        if (!piece || piece.type !== 'p') return false;
        
        const targetRank = targetSquare[1];
        return (piece.color === 'w' && targetRank === '8') || 
               (piece.color === 'b' && targetRank === '1');
    }

    function onDrop(sourceSquare, targetSquare) {
        const isMyTurn = (game.turn() === 'w' && myColor === 'white') || 
                        (game.turn() === 'b' && myColor === 'black');
        
        if (!isMyTurn) return false;

        // Verificar si es una promoción
        if (isPromotion(sourceSquare, targetSquare)) {
            setPromotionMove({ from: sourceSquare, to: targetSquare });
            setShowPromotionDialog(true);
            return false; // Prevenir el movimiento hasta que se elija la pieza
        }

        return makeMove(sourceSquare, targetSquare, null);
    }

    function makeMove(from, to, promotion) {
        const gameCopy = new Chess(game.fen());
        
        try {
            const move = gameCopy.move({
                from,
                to,
                promotion: promotion || undefined
            });

            if (move === null) return false;

            setGame(gameCopy);

            socket.emit('make-move', {
                gameId: gameData.gameId,
                move: move.san,
                newFen: gameCopy.fen()
            });

            checkGameEnd(gameCopy);
            return true;
        } catch (error) {
            console.error('Error en el movimiento:', error);
            return false;
        }
    }

    function handlePromotion(piece) {
        if (promotionMove) {
            makeMove(promotionMove.from, promotionMove.to, piece);
            setShowPromotionDialog(false);
            setPromotionMove(null);
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
            gap: '20px',
            position: 'relative'
        }}>
            {/* Diálogo de Promoción */}
            {showPromotionDialog && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: '#1f2937',
                        padding: '30px',
                        borderRadius: '15px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        border: '2px solid #4CAF50'
                    }}>
                        <h2 style={{ 
                            color: 'white', 
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            Elige la pieza de promoción
                        </h2>
                        <div style={{ 
                            display: 'flex', 
                            gap: '15px',
                            justifyContent: 'center'
                        }}>
                            {['q', 'r', 'b', 'n'].map(piece => (
                                <button
                                    key={piece}
                                    onClick={() => handlePromotion(piece)}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        fontSize: '48px',
                                        backgroundColor: '#374151',
                                        border: '2px solid #4CAF50',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#4CAF50';
                                        e.target.style.transform = 'scale(1.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#374151';
                                        e.target.style.transform = 'scale(1)';
                                    }}
                                >
                                    {piece === 'q' ? '♕' : piece === 'r' ? '♖' : 
                                     piece === 'b' ? '♗' : '♘'}
                                </button>
                            ))}
                        </div>
                        <div style={{
                            marginTop: '15px',
                            textAlign: 'center',
                            color: '#9ca3af',
                            fontSize: '14px'
                        }}>
                            Reina - Torre - Alfil - Caballo
                        </div>
                    </div>
                </div>
            )}

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