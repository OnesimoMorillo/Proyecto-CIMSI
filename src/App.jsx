import { useState } from 'react';
import Board from './components/Board';
import LoginRegister from './pages/LoginRegister';
import './styles/App.css';

function App() {
  const [showBoard, setShowBoard] = useState(false); // Empieza mostrando Login

  return (
    <div className="App" style={{ minHeight: '100vh' }}>
      {/* Botones de navegación (temporal para desarrollo) */}
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 1000,
        display: 'flex',
        gap: '10px'
      }}>
        <button 
          onClick={() => setShowBoard(false)}
          style={{
            padding: '10px 20px',
            backgroundColor: showBoard ? '#5865F2' : '#4a54c4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          👤 Login
        </button>
        <button 
          onClick={() => setShowBoard(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: showBoard ? '#3d8b40' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          ♟️ Tablero
        </button>
      </div>

      {/* Contenido principal centrado */}
      {showBoard ? <Board /> : <LoginRegister />}
    </div>
  );
}

export default App;