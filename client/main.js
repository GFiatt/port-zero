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

// Variable para detectar cuando el juego empieza (para música)
let previousState = null;
let musicStarted = false;

function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000 || 0;
  lastTime = timestamp;

  // Detectar cuando el juego cambia a PLAYING para iniciar música
  if (typeof currentState !== 'undefined' && currentState === GAME_STATE.PLAYING) {
    if (previousState !== GAME_STATE.PLAYING && !musicStarted) {
      // El juego acaba de empezar (desde MENU, LOBBY, o GAME_OVER)
      if (typeof playMainSong === 'function') {
        playMainSong();
        musicStarted = true;
        console.log('[AUDIO] Music started');
      }
    }
  }
  
  // Resetear flag de música cuando salimos de PLAYING
  if (currentState !== GAME_STATE.PLAYING && musicStarted) {
    musicStarted = false;
  }
  
  previousState = currentState;

  // update sigue siendo el mismo de logic.js (singleplayer completo)
  update(dt);

  // render sigue igual (sprites, HUD, etc.)
  render();

  requestAnimationFrame(gameLoop);
}

// Cargar assets primero (sprites, sonidos, etc.)
if (typeof loadAssets === 'function') {
  loadAssets()
    .then(() => {
      console.log('[CLIENT] Assets loaded, starting game loop');
      
      // Verificar estado del audio
      if (typeof checkAudioStatus === 'function') {
        checkAudioStatus();
      }
      
      startGameLoop();
    })
    .catch((err) => {
      console.error('[CLIENT] Error loading assets, starting anyway:', err);
      startGameLoop();
    });
} else {
  
  startGameLoop();
}

// La conexión de red se maneja en network.js
console.log('[CLIENT] Main initialized - network.js handles Socket.IO');
