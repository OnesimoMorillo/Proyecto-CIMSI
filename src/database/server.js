import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const PORT = 3000;
const JWT_SECRET = 'tu_clave_secreta_muy_segura'; // Cambiar en producción

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5173';

// Configurar CORS
const corsOptions = {
    origin: SERVER_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Configurar Socket.IO
const io = new Server(httpServer, {
    cors: corsOptions
});

// Conexión a la base de datos
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'usuarioCimsi',
    password: process.env.DB_PASSWORD || 'cimsi',
    database: process.env.DB_NAME || 'proyecto_cimsi_db',
    port: process.env.DB_PORT || 3307,
    waitForConnections: true,
    connectionLimit: 10,
});

// ==================== GESTIÓN DE PARTIDAS ====================
const games = new Map(); // Almacena las partidas activas
const waitingPlayers = []; // Jugadores esperando partida

io.on('connection', (socket) => {
    console.log(`✅ Usuario conectado: ${socket.id}`);

    // Jugador busca partida
    socket.on('find-game', (userData) => {
        console.log(`🔍 ${userData.username} busca partida`);
        
        // Si hay alguien esperando, crear partida
        if (waitingPlayers.length > 0) {
            const opponent = waitingPlayers.shift();
            const gameId = `game-${Date.now()}`;
            
            // Asignar colores aleatoriamente
            const isPlayer1White = Math.random() > 0.5;
            
            const game = {
                id: gameId,
                white: isPlayer1White ? socket.id : opponent.id,
                black: isPlayer1White ? opponent.id : socket.id,
                whiteUser: isPlayer1White ? userData : opponent.userData,
                blackUser: isPlayer1White ? opponent.userData : userData,
                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Posición inicial
                turn: 'w',
                history: []
            };
            
            games.set(gameId, game);
            
            // Unir ambos jugadores a la sala
            socket.join(gameId);
            opponent.socket.join(gameId);
            
            // Notificar a ambos jugadores
            io.to(socket.id).emit('game-start', {
                gameId,
                color: isPlayer1White ? 'white' : 'black',
                opponent: opponent.userData,
                fen: game.fen
            });
            
            io.to(opponent.id).emit('game-start', {
                gameId,
                color: isPlayer1White ? 'black' : 'white',
                opponent: userData,
                fen: game.fen
            });
            
            console.log(`🎮 Partida creada: ${gameId}`);
            console.log(`  ⚪ Blancas: ${game.whiteUser.username}`);
            console.log(`  ⚫ Negras: ${game.blackUser.username}`);
            
        } else {
            // Añadir a lista de espera
            waitingPlayers.push({
                id: socket.id,
                socket: socket,
                userData: userData
            });
            socket.emit('waiting-opponent');
            console.log(`⏳ ${userData.username} en lista de espera`);
        }
    });

    // Movimiento realizado
    socket.on('make-move', ({ gameId, move, newFen }) => {
        const game = games.get(gameId);
        if (!game) return;
        
        // Verificar que sea el turno del jugador correcto
        const isWhiteTurn = game.turn === 'w';
        const isPlayerWhite = socket.id === game.white;
        
        if ((isWhiteTurn && !isPlayerWhite) || (!isWhiteTurn && isPlayerWhite)) {
            socket.emit('invalid-move', 'No es tu turno');
            return;
        }
        
        // Actualizar estado del juego
        game.fen = newFen;
        game.turn = game.turn === 'w' ? 'b' : 'w';
        game.history.push(move);
        
        // Enviar movimiento al oponente
        socket.to(gameId).emit('opponent-move', { move, newFen });
        
        console.log(`♟️  Movimiento en ${gameId}: ${move}`);
    });

    // Jugador ofrece empate
    socket.on('offer-draw', ({ gameId }) => {
        socket.to(gameId).emit('draw-offered');
    });

    // Jugador acepta empate
    socket.on('accept-draw', ({ gameId }) => {
        io.to(gameId).emit('game-ended', { result: 'draw' });
        games.delete(gameId);
    });

    // Jugador se rinde
    socket.on('resign', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;
        
        const winner = socket.id === game.white ? 'black' : 'white';
        io.to(gameId).emit('game-ended', { result: 'resignation', winner });
        games.delete(gameId);
    });

    // Cancelar búsqueda
    socket.on('cancel-search', () => {
        const index = waitingPlayers.findIndex(p => p.id === socket.id);
        if (index !== -1) {
            waitingPlayers.splice(index, 1);
            console.log(`❌ Búsqueda cancelada por ${socket.id}`);
        }
    });

    // Desconexión
    socket.on('disconnect', () => {
        console.log(`❌ Usuario desconectado: ${socket.id}`);
        
        // Remover de lista de espera
        const waitingIndex = waitingPlayers.findIndex(p => p.id === socket.id);
        if (waitingIndex !== -1) {
            waitingPlayers.splice(waitingIndex, 1);
        }
        
        // Notificar oponente si estaba en partida
        games.forEach((game, gameId) => {
            if (game.white === socket.id || game.black === socket.id) {
                socket.to(gameId).emit('opponent-disconnected');
                games.delete(gameId);
                console.log(`🔌 Partida ${gameId} terminada por desconexión`);
            }
        });
    });
});

// ==================== RUTAS REST (LOGIN/REGISTER) ====================
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const [existing] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                error: 'El usuario o email ya está registrado' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            userId: result.insertId 
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users] = await pool.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                error: 'Usuario o contraseña incorrectos' 
            });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ 
                error: 'Usuario o contraseña incorrectos' 
            });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Iniciar servidor HTTP (no app.listen)
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en ${SERVER_URL}`);
    console.log(`🎮 Socket.IO listo para conexiones`);
});
