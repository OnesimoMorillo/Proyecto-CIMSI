# ♛ Chess Online - Servidor de Ajedrez Multijugador

Aplicación web de ajedrez en tiempo real que permite a dos jugadores competir entre sí a través de internet. El proyecto incluye sistema de autenticación, matchmaking aleatorio, creación de salas personalizadas (públicas y privadas), y comunicación en tiempo real mediante WebSockets.

## 📋 Descripción del Proyecto

Chess Online es una plataforma completa para jugar ajedrez en línea que consta de:

- **Frontend (React + Vite)**: Interfaz de usuario interactiva con tablero de ajedrez visual, sistema de drag-and-drop para movimientos, y gestión de estados de partida.
- **Backend (Node.js + Express + Socket.IO)**: Servidor que gestiona la lógica de autenticación, matchmaking, salas de juego y sincronización de movimientos en tiempo real.
- **Base de Datos (MySQL)**: Almacenamiento de usuarios y credenciales con encriptación de contraseñas.

### Funcionalidades Principales

- **Sistema de Autenticación**: Registro e inicio de sesión con JWT y contraseñas encriptadas con bcrypt
- **Matchmaking Aleatorio**: Búsqueda automática de oponentes disponibles
- **Salas Personalizadas**: 
  - Creación de salas públicas (visibles para todos)
  - Creación de salas privadas (protegidas por contraseña)
  - Unirse a salas mediante código único
- **Juego en Tiempo Real**: Sincronización instantánea de movimientos mediante WebSockets
- **Validación de Movimientos**: Implementación completa de las reglas de ajedrez con chess.js
- **Promoción de Peones**: Interfaz visual para seleccionar la pieza de promoción
- **Opciones de Partida**: Rendirse, rotar tablero, ver historial de movimientos

## 🏗️ Estructura del Proyecto
```
proyecto-cimsi/
├── client/                      # Frontend React
│   ├── public/
│   │   └── assests/
│   │       └── favicon.png
│   ├── src/
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── Board.jsx        # Tablero de ajedrez
│   │   │   └── Matchmaking.jsx  # Sistema de búsqueda/salas
│   │   ├── pages/
│   │   │   └── LoginRegister.jsx # Autenticación
│   │   ├── styles/              # Estilos CSS
│   │   │   ├── App.css
│   │   │   ├── index.css
│   │   │   └── LoginRegister.css
│   │   ├── App.jsx              # Componente principal
│   │   └── main.jsx             # Punto de entrada
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Backend Node.js
│   ├── src/
│   │   └── server.js            # Servidor principal
│   └── package.json
│
├── sql/
│   └── creacionDBcimsi-prueba.sql # Script de BD
│
├── docker/                      # Configuración Docker
│   ├── Dockerfile.client
│   ├── Dockerfile.server
│   └── nginx.conf
│
├── docker-compose.yml
├── package.json                 # Scripts raíz
├── .dockerignore
├── .gitignore
└── README.md
```

## 🔧 Requisitos Previos

- **Node.js** >= 20.x
- **MySQL** >= 5.7
- **npm** >= 8.x
- **Docker & Docker Compose** (opcional, para despliegue con contenedores)

## ⚙️ Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
```dotenv
# Configuración de Base de Datos
DB_HOST=```host de la db```
DB_USER=```usuario de la db```
DB_PASSWORD=```contraseña db```
DB_NAME=```nombre de la db```
DB_PORT=```puerto de la db```
MYSQL_ROOT_PASSWORD=```contraseña usuario root db```

# URL del servidor (frontend)
SERVER_URL=```direción ip del servidor```

# URLs para el cliente (Vite)
VITE_SOCKET_URL=```direción ip del servidor```:3000
VITE_API_URL=```direción ip del servidor```:3000/api
```

### 2. Instalación de Dependencias
```bash
# Instalar todas las dependencias (root, client, server)
npm run install:all
```

### 3. Configuración de Base de Datos

#### Opción A: Manual con HeidiSQL/MySQL Workbench

1. Crear usuario de base de datos:
```sql
CREATE USER 'usuarioCimsi'@'localhost' IDENTIFIED BY 'cimsi';
```

2. Ejecutar el script de creación:
```bash
mysql -u root -p < sql/creacionDBcimsi-prueba.sql
```

3. Otorgar permisos:
```sql
GRANT ALL PRIVILEGES ON proyecto_cimsi_db.* TO 'usuarioCimsi'@'localhost';
FLUSH PRIVILEGES;
```

#### Opción B: Con Docker (ver sección de Despliegue)

## 🚀 Ejecución en Desarrollo

### Modo Desarrollo (Simultáneo)
```bash
# Ejecuta cliente y servidor simultáneamente
npm run dev
```

### Modo Desarrollo (Individual)
```bash
# Terminal 1: Cliente
npm run dev:client

# Terminal 2: Servidor
npm run dev:server
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## 📦 Despliegue con Docker

### Despliegue Completo
```bash
# Construir y levantar todos los servicios
docker-compose up -d --build

# Ver logs en tiempo real
docker-compose logs -f

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (¡cuidado, elimina datos!)
docker-compose down -v
```

### Servicios Docker

El proyecto incluye tres contenedores:

1. **chess_db** (MySQL 5.7)
   - Puerto: `3307:3306`
   - Volumen persistente: `mysql_data`
   - Inicialización automática con script SQL

2. **chess_server** (Node.js Backend)
   - Puerto: `3000:3000`
   - Dependencias: Base de datos
   - Healthcheck: Verifica disponibilidad del servidor

3. **chess_client** (Nginx + React)
   - Puerto: `80:80`
   - Build optimizado de producción
   - Servidor Nginx para SPA

### URLs de Producción

- **Frontend**: http://localhost (puerto 80)
- **Backend API**: http://localhost:3000

## 🔍 Monitorización

### Comandos de Monitorización Docker
```bash
# Ver estado de los contenedores
docker-compose ps

# Ver logs de todos los servicios
docker-compose logs

# Ver logs en tiempo real de un servicio específico
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f db

# Ver últimas 100 líneas de logs
docker-compose logs --tail=100

# Estadísticas de recursos (CPU, Memoria, Red)
docker stats

# Inspeccionar salud de los servicios
docker-compose ps --format json | jq '.[].Health'

# Ver información detallada de un contenedor
docker inspect chess_server
docker inspect chess_client
docker inspect chess_db
```

### Comandos de Diagnóstico
```bash
# Verificar conectividad del backend
curl http://localhost:3000/api/

# Verificar frontend
curl http://localhost/

# Acceder a la shell de un contenedor
docker-compose exec server sh
docker-compose exec client sh
docker-compose exec db bash

# Verificar logs de base de datos
docker-compose exec db mysql -u usuarioCimsi -p -e "SHOW DATABASES;"

# Ver variables de entorno de un contenedor
docker-compose exec server env

# Reiniciar un servicio específico
docker-compose restart server
docker-compose restart client
docker-compose restart db
```

### Monitorización de Base de Datos
```bash
# Conectar a MySQL
docker-compose exec db mysql -u usuarioCimsi -p

# Ver tablas
docker-compose exec db mysql -u usuarioCimsi -p -e "USE proyecto_cimsi_db; SHOW TABLES;"

# Ver usuarios registrados
docker-compose exec db mysql -u usuarioCimsi -p -e "USE proyecto_cimsi_db; SELECT id, username, email FROM users;"

# Backup de base de datos
docker-compose exec db mysqldump -u usuarioCimsi -p proyecto_cimsi_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose exec -T db mysql -u usuarioCimsi -p proyecto_cimsi_db < backup_20240101.sql
```

### Limpieza y Mantenimiento
```bash
# Limpiar contenedores detenidos
docker container prune

# Limpiar imágenes no utilizadas
docker image prune -a

# Limpiar volúmenes no utilizados
docker volume prune

# Limpiar todo (cuidado con datos)
docker system prune -a --volumes

# Reconstruir un servicio específico
docker-compose up -d --build --no-deps server
```

## 🛠️ Tecnologías Utilizadas

### Frontend
- React 19
- Vite 7
- Socket.IO Client 4.8
- Chess.js 1.0
- React Chessboard 4.7

### Backend
- Node.js 20
- Express 5
- Socket.IO 4.8
- MySQL2 3.15
- JWT (jsonwebtoken)
- bcryptjs

### DevOps
- Docker & Docker Compose
- Nginx (servidor web para producción)

## 📝 Scripts Disponibles

### Raíz del Proyecto
```bash
npm run dev          # Ejecuta cliente y servidor en desarrollo
npm run dev:client   # Solo cliente
npm run dev:server   # Solo servidor
npm run install:all  # Instala todas las dependencias
npm run build        # Build de producción del cliente
npm run start        # Inicia servidor en producción
```

### Cliente
```bash
cd client
npm run dev          # Servidor de desarrollo Vite
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linter ESLint
```

### Servidor
```bash
cd server
npm run dev          # Servidor en modo desarrollo
npm run start        # Servidor en modo producción
```

## 🎮 Cómo Jugar

1. **Registro**: Crea una cuenta con usuario, email y contraseña
2. **Inicio de Sesión**: Accede con tus credenciales
3. **Buscar Partida**: Elige una opción:
   - **Partida Aleatoria**: Busca automáticamente un oponente
   - **Crear Sala**: Genera un código para compartir (pública o privada)
   - **Unirse con Código**: Introduce el código de una sala
   - **Salas Públicas**: Ve la lista de salas disponibles
4. **Jugar**: Mueve las piezas y disfruta jugando al ajedrez
5. **Opciones**: Puedes rendirte, rotar el tablero o ver el historial

## 🔐 Seguridad

- Contraseñas encriptadas con bcrypt (10 rounds)
- Autenticación mediante JWT con expiración de 24h
- Validación de movimientos en el servidor
- Protección CORS configurada
- Variables de entorno para datos sensibles
- Salas privadas protegidas por contraseña

## 🐛 Troubleshooting

### Problemas Comunes

**Error de conexión a la base de datos**
```bash
# Verificar que MySQL esté corriendo
docker-compose ps db

# Ver logs de la base de datos
docker-compose logs db

# Verificar variables de entorno
cat .env
```

**Puerto ya en uso**
```bash
# Linux/Mac
lsof -i :3000
lsof -i :5173

# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5173
```

**Socket.IO no conecta**
- Verificar que VITE_SOCKET_URL apunte al backend correcto
- Revisar configuración CORS en server.js
- Comprobar que el servidor esté ejecutándose


