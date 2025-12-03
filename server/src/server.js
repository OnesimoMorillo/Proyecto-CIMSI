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
const JWT_SECRET = 'tu_clave_secreta_muy_segura';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5173';

const corsOptions = {
    origin: SERVER_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(httpServer, {
    cors: corsOptions
});

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'usuarioCimsi',
    password: process.env.DB_PASSWORD || 'cimsi',
    database: process.env.DB_NAME || 'proyecto_cimsi_db',
    port: process.env.DB_PORT || 3307,
    waitForConnections: true,
    connectionLimit: 10,
});

// ==================== GESTIÓN DE PARTIDAS Y SALAS ====================
const games = new Map();
const waitingPlayers = [];
const rooms = new Map(); // roomId -> { creator, password, players: [] }

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createGame(player1, player2, gameId) {
    const isPlayer1White = Math.random() > 0.5;
    
    const game = {
        id: gameId,
        white: isPlayer1White ? player1.id : player2.id,
        black: isPlayer1White ? player2.id : player1.id,
        whiteUser: isPlayer1White ? player1.userData : player2.userData,
        blackUser: isPlayer1White ? player2.userData : player1.userData,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        turn: 'w',
        history: []
    };
    
    games.set(gameId, game);
    
    player1.socket.join(gameId);
    player2.socket.join(gameId);
    
    io.to(player1.id).emit('game-start', {
        gameId,
        color: isPlayer1White ? 'white' : 'black',
        opponent: player2.userData,
        fen: game.fen
    });
    
    io.to(player2.id).emit('game-start', {
        gameId,
        color: isPlayer1White ? 'black' : 'white',
        opponent: player1.userData,
        fen: game.fen
    });
    
    console.log(`🎮 Partida creada: ${gameId}`);
    console.log(`  ⚪ Blancas: ${game.whiteUser.username}`);
    console.log(`  ⚫ Negras: ${game.blackUser.username}`);
}

io.on('connection', (socket) => {
    console.log(`✅ Usuario conectado: ${socket.id}`);

    // ========== PARTIDA ALEATORIA ==========
    socket.on('find-game', (userData) => {
        console.log(`🔍 ${userData.username} busca partida aleatoria`);
        
        if (waitingPlayers.length > 0) {
            const opponent = waitingPlayers.shift();
            const gameId = `game-${Date.now()}`;
            
            createGame(
                { id: socket.id, socket, userData },
                opponent,
                gameId
            );
        } else {
            waitingPlayers.push({
                id: socket.id,
                socket: socket,
                userData: userData
            });
            socket.emit('waiting-opponent');
            console.log(`⏳ ${userData.username} en lista de espera`);
        }
    });

    // ========== CREAR SALA ==========
    socket.on('create-room', ({ userData, password }) => {
        const roomId = generateRoomCode();
        
        rooms.set(roomId, {
            id: roomId,
            creator: {
                id: socket.id,
                socket,
                userData
            },
            password: password || null,
            isPrivate: !!password,
            players: [],
            createdAt: Date.now()
        });
        
        socket.emit('room-created', { roomId, password });
        console.log(`🏠 Sala creada: ${roomId} por ${userData.username} ${password ? '(privada)' : '(pública)'}`);
        
        // Enviar lista de salas públicas a todos
        broadcastPublicRooms();
    });

    // ========== LISTAR SALAS PÚBLICAS ==========
    socket.on('get-public-rooms', () => {
        const publicRooms = Array.from(rooms.values())
            .filter(room => !room.isPrivate && room.players.length === 0)
            .map(room => ({
                id: room.id,
                creator: room.creator.userData.username,
                players: room.players.length
            }));
        
        socket.emit('public-rooms-list', publicRooms);
    });

    // ========== UNIRSE A SALA ==========
    socket.on('join-room', ({ roomId, password, userData }) => {
        const room = rooms.get(roomId);
        
        if (!room) {
            socket.emit('room-error', 'Sala no encontrada');
            return;
        }
        
        if (room.creator.id === socket.id) {
            socket.emit('room-error', 'No puedes unirte a tu propia sala');
            return;
        }
        
        if (room.players.length > 0) {
            socket.emit('room-error', 'La sala está llena');
            return;
        }
        
        if (room.isPrivate && room.password !== password) {
            socket.emit('room-error', 'Contraseña incorrecta');
            return;
        }
        
        // Crear partida
        const gameId = `room-${roomId}-${Date.now()}`;
        
        createGame(
            room.creator,
            { id: socket.id, socket, userData },
            gameId
        );
        
        // Eliminar sala
        rooms.delete(roomId);
        console.log(`🎮 Jugador ${userData.username} se unió a sala ${roomId}`);
        
        // Actualizar lista de salas públicas
        broadcastPublicRooms();
    });

    // ========== CANCELAR SALA ==========
    socket.on('cancel-room', ({ roomId }) => {
        if (rooms.has(roomId)) {
            rooms.delete(roomId);
            console.log(`❌ Sala ${roomId} cancelada`);
            broadcastPublicRooms();
        }
    });

    // ========== MOVIMIENTOS ==========
    socket.on('make-move', ({ gameId, move, newFen }) => {
        const game = games.get(gameId);
        if (!game) return;
        
        const isWhiteTurn = game.turn === 'w';
        const isPlayerWhite = socket.id === game.white;
        
        if ((isWhiteTurn && !isPlayerWhite) || (!isWhiteTurn && isPlayerWhite)) {
            socket.emit('invalid-move', 'No es tu turno');
            return;
        }
        
        game.fen = newFen;
        game.turn = game.turn === 'w' ? 'b' : 'w';
        game.history.push(move);
        
        socket.to(gameId).emit('opponent-move', { move, newFen });
        console.log(`♟️  Movimiento en ${gameId}: ${move}`);
    });

    socket.on('offer-draw', ({ gameId }) => {
        socket.to(gameId).emit('draw-offered');
    });

    socket.on('accept-draw', ({ gameId }) => {
        io.to(gameId).emit('game-ended', { result: 'draw' });
        games.delete(gameId);
    });

    socket.on('resign', ({ gameId }) => {
        const game = games.get(gameId);
        if (!game) return;
        
        const winner = socket.id === game.white ? 'black' : 'white';
        io.to(gameId).emit('game-ended', { result: 'resignation', winner });
        games.delete(gameId);
    });

    socket.on('cancel-search', () => {
        const index = waitingPlayers.findIndex(p => p.id === socket.id);
        if (index !== -1) {
            waitingPlayers.splice(index, 1);
            console.log(`❌ Búsqueda cancelada por ${socket.id}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Usuario desconectado: ${socket.id}`);
        
        // Remover de lista de espera
        const waitingIndex = waitingPlayers.findIndex(p => p.id === socket.id);
        if (waitingIndex !== -1) {
            waitingPlayers.splice(waitingIndex, 1);
        }
        
        // Eliminar salas creadas por este usuario
        rooms.forEach((room, roomId) => {
            if (room.creator.id === socket.id) {
                rooms.delete(roomId);
                console.log(`🗑️ Sala ${roomId} eliminada por desconexión`);
            }
        });
        
        broadcastPublicRooms();
        
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

function broadcastPublicRooms() {
    const publicRooms = Array.from(rooms.values())
        .filter(room => !room.isPrivate && room.players.length === 0)
        .map(room => ({
            id: room.id,
            creator: room.creator.userData.username,
            players: room.players.length
        }));
    
    io.emit('public-rooms-list', publicRooms);
}

// ==================== RUTAS REST ====================
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

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en ${SERVER_URL}`);
    console.log(`🎮 Socket.IO listo para conexiones`);
});