// main.js
// Game loop + conexión socket

const socket = io();

// arranca el loop cuando todo está listo
function startGameLoop() {
  // aseguramos que lastTime tenga algún valor inicial
  if (typeof lastTime === 'undefined') {
    window.lastTime = performance.now();
  }
  requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000 || 0;
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

// Cargar assets primero (sprites)
if (typeof loadAssets === 'function') {
  loadAssets()
    .then(() => {
      console.log('Assets loaded, starting game loop');
      startGameLoop();
    })
    .catch((err) => {
      console.error('Error loading assets, starting anyway:', err);
      startGameLoop();
    });
} else {
  // por si algún día quitas assets.js
  startGameLoop();
}

// Logs básicos de socket.io
socket.on('connect', () => {
  console.log('Connected to server as', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
