// server/index.js
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 4000;

// Ruta absoluta a la carpeta client
const clientPath = path.join(__dirname, '..', 'client');

// 1) Servir TODO lo que haya dentro de /client bajo la URL /client/...
app.use('/client', express.static(clientPath));

// 2) Ruta principal -> index.html dentro de /client
app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// (opcional) favicon si quieres evitar el 404 de favicon.ico
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// 3) Socket.io básico
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
