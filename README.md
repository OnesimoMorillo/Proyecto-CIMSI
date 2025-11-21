# Proyecto CIMSI

Servidor para partidas online de ajedrez entre dos jugadores.

## 📦 Instalación

Antes de arrancar el servidor:

1. Instalar node
2. Ejecutar el siguiente comando:
   ```bash
   npm install
   ```
3. Abrir HeidiSQL
   1. Crear un usuario llamado `usuarioCimsi`
   2. Ejecutar el script `creacionDBcimsi-prueba.sql`
   3. Dar permisos al usuario sobre la DB

## 🎮 Ejecutar el proyecto

Una vez realizados los pasos anteriores, ejecutar el siguiente comando para arrancar el servidor:

```bash
npm run start
```

El proyecto estará disponible en: http://localhost:5173/

## 📁 Estructura del proyecto

```
src/
├── components/    # Componentes reutilizables (tablero, piezas, etc.)
├── pages/         # Páginas principales (Login, Juego, etc.)
├── styles/        # Archivos CSS
├── App.jsx        # Componente principal
└── main.jsx       # Punto de entrada
```
