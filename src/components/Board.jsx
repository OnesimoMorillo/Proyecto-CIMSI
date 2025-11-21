import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

function Board() {
  const [game, setGame] = useState(new Chess());

  function onDrop(sourceSquare, targetSquare) {
    const gameCopy = new Chess(game.fen());
    
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      if (move === null) return false;

      setGame(gameCopy);

      // Verificar estado del juego
      setTimeout(() => {
        if (gameCopy.isGameOver()) {
          if (gameCopy.isCheckmate()) {
            alert(`¡Jaque mate! Ganaron las ${gameCopy.turn() === 'w' ? 'Negras' : 'Blancas'}`);
          } else if (gameCopy.isDraw()) {
            alert('¡Empate!');
          } else if (gameCopy.isStalemate()) {
            alert('¡Tablas por ahogado!');
          }
        } else if (gameCopy.isCheck()) {
          console.log('¡Jaque!');
        }
      }, 100);

      return true;
    } catch (error) {
      console.error('Error en el movimiento:', error);
      return false;
    }
  }

  function resetGame() {
    setGame(new Chess());
  }

  function undoMove() {
    const gameCopy = new Chess(game.fen());
    gameCopy.undo();
    setGame(gameCopy);
  }

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
      <h1 style={{ 
        margin: '0', 
        color: '#fff',
        fontSize: '36px',
        textShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        ♟️ Ajedrez Online
      </h1>
      
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
          customBoardStyle={{
            borderRadius: '8px'
          }}
        />
      </div>

      {/* Información del juego */}
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
          backgroundColor: 'rgba(255,255,255,0.1)',
          color: '#fff',
          borderRadius: '10px',
          fontWeight: 'bold',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          Turno: {game.turn() === 'w' ? '⚪ Blancas' : '⚫ Negras'}
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
          onClick={undoMove}
          disabled={game.history().length === 0}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            cursor: game.history().length === 0 ? 'not-allowed' : 'pointer',
            backgroundColor: game.history().length === 0 ? '#555' : '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
            transition: 'all 0.3s',
            opacity: game.history().length === 0 ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (game.history().length > 0) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.3)';
          }}
        >
          ↶ Deshacer
        </button>

        <button 
          onClick={resetGame}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
          }}
        >
          🔄 Nueva Partida
        </button>
      </div>

      {/* Historial de movimientos */}
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