// Loop principal + socket opcional

let socket = null;
try {
  // puede fallar si socket.io no está disponible, pero no rompe el juego
  socket = io();
} catch (err) {
  console.warn('Socket.io no disponible (no es crítico).');
}

function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000 || 0;
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

if (socket) {
  socket.on('connect', () => {
    console.log('Connected to server as', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
}
