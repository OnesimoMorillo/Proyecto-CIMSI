// server.js
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3307;
const JWT_SECRET = 'tu_clave_secreta_muy_segura'; // Cambiar en producción

const corsOptions = {
    // Permitir SÓLO tu origen de Frontend (Vite)
    origin: 'http://localhost:5173', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Permitir cookies/headers de autenticación
    allowedHeaders: ['Content-Type', 'Authorization'], // Headers que permites
};

app.use(cors(corsOptions));

app.use(express.json());

// Conexión a la base de datos
const pool = mysql.createPool({
    host: 'localhost',
    user: 'usuarioCimsi',
    password: 'cimsi',
    database: 'proyecto_cimsi_db',
    port: 3307,
    waitForConnections: true,
    connectionLimit: 10,
});

// ==================== REGISTRO ====================
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Verificar si el usuario ya existe
        const [existing] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                error: 'El usuario o email ya está registrado' 
            });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar usuario
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            userId: result.insertId 
        });

    } catch (error) {
        console.error('--- ERROR EN REGISTRO DE USUARIO ---');
        console.error(error); // Imprime el objeto de error completo.
        console.error('------------------------------------');

        // Envía la respuesta 500 para evitar que el navegador se cuelgue
        res.status(500).json({ error: 'Error interno del servidor. Consulte los logs.' });
    }
});

// ==================== LOGIN ====================
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Buscar usuario
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

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ 
                error: 'Usuario o contraseña incorrectos' 
            });
        }

        // Generar token JWT
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

// Middleware para verificar token (para rutas protegidas)
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(403).json({ error: 'Token requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        req.user = decoded;
        next();
    });
};

// Ruta protegida de ejemplo
app.get('/api/profile', verifyToken, async (req, res) => {
    res.json({ user: req.user });
});

//app.listen(PORT, () => {
//    console.log(`Servidor corriendo en http://localhost:${PORT}`);
//});

async function checkDbConnectionAndStartServer() {
    let connection;
    try {
        // Intenta obtener una conexión del pool
        connection = await pool.getConnection(); 
        
        console.log('✅ Conexión exitosa a MySQL (DB: proyecto_cimsi_db)');
        
        // Ejecutar el servidor SOLO si la conexión a la DB es exitosa
        app.listen(PORT, () => {
            console.log(`🚀 Servidor Express corriendo en http://localhost:${PORT}`);
        });

    } catch (error) {
        // Si hay un error, lo imprimimos y NO iniciamos el servidor
        console.error('❌ ERROR CRÍTICO DE CONEXIÓN A BASE DE DATOS:');
        console.error('Asegúrese de que su servidor MySQL esté activo y las credenciales sean correctas.');
        
        // Muestra el error original de MySQL
        console.error(error); 
        process.exit(1); // Sale del proceso Node.js con error
        
    } finally {
        // Asegúrate de liberar la conexión después de la prueba
        if (connection) connection.release(); 
    }
}

// Llama a la función para iniciar el proceso
checkDbConnectionAndStartServer();