// INPUT

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (['w', 'a', 's', 'd', ' '].includes(key)) {
    e.preventDefault();
  }

  keys[key] = true;

  // Manejo de Enter: soportar single-player (main) y online (branch)
  if (e.key === 'Enter') {
    console.log('[INPUT] ENTER pressed. State:', currentState, 'Connected:', isConnected);
    
    // Si NO estamos conectados a un servidor → modo single-player tradicional
    if (typeof isConnected === 'undefined' || !isConnected) {
      console.log('[INPUT] Single-player mode or not connected');
      
      // Iniciar juego desde MENU o reiniciar desde GAME_OVER
      if (currentState === GAME_STATE.MENU || currentState === GAME_STATE.GAME_OVER) {
        resetGame();
        if (typeof playMainSong === 'function') {
          playMainSong();
        }
      }
      return;
    }

    // Si SÍ estamos conectados → flujo online con lobby
    if (currentState === GAME_STATE.MENU) {
      // Ir al lobby
      currentState = GAME_STATE.LOBBY;
      console.log('[INPUT] Changed to LOBBY state');
      
      // Unirse al lobby en el servidor
      if (typeof joinLobby === 'function') {
        joinLobby();
      } else {
        console.error('[INPUT] joinLobby() not defined!');
      }
    } else if (currentState === GAME_STATE.LOBBY) {
      // ENTER en lobby = marcar como LISTO
      console.log('[INPUT] Toggling ready state');
      if (typeof toggleReady === 'function') {
        toggleReady();
      } else {
        console.error('[INPUT] toggleReady() not defined!');
      }
    } else if (currentState === GAME_STATE.GAME_OVER) {
      // Volver al menú para reconectar
      currentState = GAME_STATE.MENU;
      console.log('[INPUT] Returning to MENU from GAME_OVER');
      
      // Detener música si estaba sonando
      if (typeof stopMainSong === 'function') {
        stopMainSong();
      }

      // Limpiar estado de red si existen estas estructuras
      if (typeof players !== 'undefined' && players && typeof players.clear === 'function') {
        players.clear();
      }
      if (typeof enemies !== 'undefined') enemies = [];
      if (typeof bullets !== 'undefined') bullets = [];
    }
  }

  // R para recargar
  if (key === 'r') {
    if (currentState === GAME_STATE.PLAYING) {
      // Si estamos en multiplayer, reproducir sonido localmente y enviar al servidor
      if (typeof isConnected !== 'undefined' && isConnected &&
          typeof sendReload === 'function') {
        // Multiplayer: reproducir sonido localmente
        if (typeof playReloadSound === 'function') {
          playReloadSound();
        }
        sendReload();
      } else if (player && typeof player.startReload === 'function') {
        // Single-player: player.startReload() ya reproduce el sonido
        player.startReload();
      }
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
