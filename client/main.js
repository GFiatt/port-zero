// ========================================
// MAIN - Game Loop Principal
// ========================================
// El socket ahora se maneja en network.js
// Este archivo solo maneja el rendering loop

// Arranca el loop cuando todo está listo
function startGameLoop() {
  // Aseguramos que lastTime tenga algún valor inicial
  if (typeof lastTime === 'undefined') {
    window.lastTime = performance.now();
  }
  requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000 || 0;
  lastTime = timestamp;

  // Update solo maneja animaciones locales (la lógica está en el servidor)
  update(dt);
  
  // Render dibuja el estado sincronizado desde el servidor
  render();

  requestAnimationFrame(gameLoop);
}

// Cargar assets primero (sprites)
if (typeof loadAssets === 'function') {
  loadAssets()
    .then(() => {
      console.log('[CLIENT] Assets loaded, starting game loop');
      startGameLoop();
    })
    .catch((err) => {
      console.error('[CLIENT] Error loading assets, starting anyway:', err);
      startGameLoop();
    });
} else {
  // Por si algún día quitas assets.js
  startGameLoop();
}

// La conexión de red se maneja en network.js
console.log('[CLIENT] Main initialized - network.js handles Socket.IO');
