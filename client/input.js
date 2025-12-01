// ========================================
// INPUT - Captura de entrada (adaptado para red)
// ========================================

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (['w', 'a', 's', 'd', ' '].includes(key)) {
    e.preventDefault();
  }

  keys[key] = true;

  // Enter para ir al lobby (en menú), iniciar partida (en lobby) o reiniciar (game over)
  if (e.key === 'Enter') {
    if (currentState === GAME_STATE.MENU) {
      // Ir al lobby
      if (isConnected) {
        currentState = GAME_STATE.LOBBY;
        console.log('[INPUT] Entered lobby');
      }
    } else if (currentState === GAME_STATE.LOBBY) {
      // Iniciar partida desde el lobby
      if (typeof joinGame === 'function') {
        joinGame();
      }
    } else if (currentState === GAME_STATE.GAME_OVER) {
      // Volver al menú para reconectar
      currentState = GAME_STATE.MENU;
      players.clear();
      enemies = [];
      bullets = [];
    }
  }

  // R para recargar - ENVIAR AL SERVIDOR
  if (key === 'r') {
    if (currentState === GAME_STATE.PLAYING && typeof sendReload === 'function') {
      sendReload();
    }
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  keys[key] = false;
});

canvas.addEventListener('mousemove', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  mousePos.x = (e.clientX - rect.left) * scaleX;
  mousePos.y = (e.clientY - rect.top) * scaleY;
});

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    e.preventDefault();
    shooting = true;
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (e.button === 0) {
    e.preventDefault();
    shooting = false;
  }
});

canvas.addEventListener('dragstart', (e) => e.preventDefault());
