// ========================================
// NETWORK CLIENT - Adaptado a MAIN
// Maneja la conexión pero respeta la lógica local del juego
// ========================================

let socket = null;
let inputSendInterval = null;

// Las variables isConnected, localPlayerId, connectedPlayersCount, gameStarted, players
// ya están declaradas en state.js - NO las redeclaramos aquí

// Tracking para audio (detectar cambios de estado)
let prevBulletCount = 0;
let prevLocalPlayerHealth = 100;
let hasPlayedGameOverSounds = false;

// ----------------------------------------
// Inicializar conexión con el servidor
// ----------------------------------------
function initNetwork() {
  if (typeof io === 'undefined') {
    console.error('[NETWORK] Socket.IO no está cargado');
    return;
  }

  console.log('[NETWORK] Connecting to server:', NETWORK_CONFIG.SERVER_URL);

  socket = io(NETWORK_CONFIG.SERVER_URL, {
    transports: ['websocket', 'polling'], // para compatibilidad
  });

  setupNetworkListeners();
}

// ----------------------------------------
// Listeners de red
// ----------------------------------------
function setupNetworkListeners() {
  // Conexión / desconexión básica
  socket.on('connect', () => {
    isConnected = true;
    localPlayerId = socket.id;
    console.log('[NETWORK] Connected as', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('[NETWORK] Disconnected from server');
    isConnected = false;
    gameStarted = false;
    localPlayerId = null;

    if (typeof players !== 'undefined' && players && typeof players.clear === 'function') {
      players.clear();
    }

    stopSendingInputs();

    // Si estábamos en lobby/jugando online, volvemos al menú
    if (typeof currentState !== 'undefined' &&
        (currentState === GAME_STATE.LOBBY || currentState === GAME_STATE.PLAYING)) {
      currentState = GAME_STATE.MENU;
    }
  });

  // Estado inicial opcional (si luego lo implementas en el servidor)
  socket.on('init_state', (data) => {
    console.log('[NETWORK] init_state:', data);
    if (!data) return;

    if (data.playerId) {
      localPlayerId = data.playerId;
    }
    if (typeof data.connectedCount === 'number') {
      connectedPlayersCount = data.connectedCount;
    }
  });

  // Actualización del estado completo del juego
  socket.on('game_state', (compactState) => {
    if (!compactState) return;

    // DEBUG: Log cada 60 frames (aprox 2 segundos a 30Hz)
    if (Math.random() < 0.033) {
      console.log('[NETWORK] game_state:', {
        players: compactState.players?.length,
        bullets: compactState.bullets?.length,
        enemies: compactState.enemies?.length,
        wave: compactState.currentWave
      });
    }

    // ========================================
    // AUDIO: Detectar disparo (balas nuevas)
    // ========================================
    if (compactState.bullets && typeof bullets !== 'undefined') {
      const newBulletCount = compactState.bullets.length;
      // Si hay más balas que antes, el jugador local disparó
      if (newBulletCount > prevBulletCount && typeof playShootSound === 'function') {
        // Reproducir sonido por cada bala nueva (máximo 3 a la vez para evitar sobrecarga)
        const newBullets = Math.min(3, newBulletCount - prevBulletCount);
        for (let i = 0; i < newBullets; i++) {
          playShootSound();
        }
      }
      prevBulletCount = newBulletCount;
    }

    // ========================================
    // AUDIO: Detectar muerte del jugador local
    // ========================================
    if (compactState.players && localPlayerId) {
      const localPlayer = compactState.players.find(p => p.id === localPlayerId);
      if (localPlayer) {
        // Detectar transición de vivo a muerto
        if (prevLocalPlayerHealth > 0 && localPlayer.health <= 0) {
          console.log('[AUDIO] Local player died, playing death yell');
          if (typeof stopMainSong === 'function') {
            stopMainSong();
          }
          if (typeof playRandomDeathYell === 'function') {
            playRandomDeathYell();
          }
        }
        prevLocalPlayerHealth = localPlayer.health;
      }
    }

    // ========================================
    // AUDIO: Detectar pickups recogidos por el jugador LOCAL
    // ========================================
    if (compactState.players && localPlayerId) {
      const localPlayer = compactState.players.find(p => p.id === localPlayerId);
      
      if (localPlayer) {
        // Detectar aumento de munición de reserva
        if (typeof prevLocalReserveAmmo !== 'undefined' && 
            localPlayer.reserveAmmo > prevLocalReserveAmmo &&
            typeof playMoreAmmoSound === 'function') {
          playMoreAmmoSound();
        }
        window.prevLocalReserveAmmo = localPlayer.reserveAmmo;
        
        // Detectar aumento de salud (pero no de salud a muerte, solo de curación)
        if (typeof prevLocalHealthForPickup !== 'undefined' && 
            localPlayer.health > prevLocalHealthForPickup && 
            localPlayer.health > 0 &&
            typeof playHealSound === 'function') {
          playHealSound();
        }
        window.prevLocalHealthForPickup = localPlayer.health;
      }
    }

    // ========================================
    // Actualizar jugadores
    // ========================================
    if (compactState.players && typeof players !== 'undefined') {
      players.clear();
      compactState.players.forEach(p => {
        players.set(p.id, p);
      });
    }

    // Actualizar balas
    if (compactState.bullets && typeof bullets !== 'undefined') {
      bullets = compactState.bullets;
    }

    // Actualizar enemigos
    if (compactState.enemies && typeof enemies !== 'undefined') {
      enemies = compactState.enemies;
    }

    // Actualizar pickups
    if (compactState.ammoPickups && typeof ammoPickups !== 'undefined') {
      ammoPickups = compactState.ammoPickups;
    }
    if (compactState.healthPickups && typeof healthPickups !== 'undefined') {
      healthPickups = compactState.healthPickups;
    }

    // Actualizar estado del juego
    if (typeof compactState.currentWave === 'number' && typeof currentWave !== 'undefined') {
      currentWave = compactState.currentWave;
    }
    if (typeof compactState.score === 'number' && typeof score !== 'undefined') {
      score = compactState.score;
    }
    if (typeof compactState.betweenWaves === 'boolean' && typeof betweenWaves !== 'undefined') {
      betweenWaves = compactState.betweenWaves;
    }
  });

  // Eventos de juego (wave completa, game over, etc.)
  socket.on('game_event', (evt) => {
    console.log('[NETWORK] game_event:', evt);
    if (!evt || !evt.type) return;

    if (evt.type === 'wave_complete') {
      if (typeof showBigMessage === 'function') {
        showBigMessage(`Wave ${evt.wave} Over`);
      }
    }
    
    if (evt.type === 'wave_start') {
      if (typeof showBigMessage === 'function') {
        showBigMessage(`Round ${evt.wave}`);
      }
    }

    if (evt.type === 'game_over') {
      gameStarted = false;
      if (typeof currentState !== 'undefined') {
        currentState = GAME_STATE.GAME_OVER;
      }
      
      // Reproducir sonidos de Game Over solo una vez
      if (!hasPlayedGameOverSounds) {
        console.log('[AUDIO] Game Over - stopping music and playing death yell');
        if (typeof stopMainSong === 'function') {
          stopMainSong();
        }
        if (typeof playRandomDeathYell === 'function') {
          playRandomDeathYell();
        }
        hasPlayedGameOverSounds = true;
      }
      
      if (typeof showBigMessage === 'function') {
        showBigMessage('GAME OVER');
      }
    }
  });

  // Estado del lobby
  socket.on('lobby_state', (lobbyState) => {
    if (typeof lobbyPlayers !== 'undefined') {
      lobbyPlayers = lobbyState.players || [];
    }
    connectedPlayersCount = lobbyState.totalPlayers || 0;
    if (typeof readyPlayersCount !== 'undefined') {
      readyPlayersCount = lobbyState.readyPlayers || 0;
    }
    console.log(`[LOBBY] ${lobbyState.readyPlayers}/${lobbyState.totalPlayers} ready`);
  });

  // Juego iniciado
  socket.on('game_started', () => {
    console.log('[GAME] Game started!');
    gameStarted = true;
    if (typeof currentState !== 'undefined') {
      currentState = GAME_STATE.PLAYING;
    }
    
    // Resetear flags de audio
    hasPlayedGameOverSounds = false;
    prevBulletCount = 0;
    prevLocalPlayerHealth = 100;
    window.prevLocalReserveAmmo = undefined;
    window.prevLocalHealthForPickup = undefined;
    
    // Iniciar música de fondo
    if (typeof playMainSong === 'function') {
      playMainSong();
    }
    
    startSendingInputs();
  });

  // Jugadores conectados/desconectados
  socket.on('player_joined', (data) => {
    console.log('[NETWORK] player_joined:', data);
    if (typeof data?.connectedCount === 'number') {
      connectedPlayersCount = data.connectedCount;
    }
  });

  socket.on('player_left', (data) => {
    console.log('[NETWORK] player_left:', data);
    if (typeof data?.connectedCount === 'number') {
      connectedPlayersCount = data.connectedCount;
    }
    if (data?.playerId && typeof players !== 'undefined' && players.delete) {
      players.delete(data.playerId);
    }
  });

  // Jugador murió y fue eliminado del juego
  socket.on('player_died', (data) => {
    console.log('[NETWORK] player_died:', data);
    if (data?.playerId && typeof players !== 'undefined' && players.delete) {
      players.delete(data.playerId);
      console.log(`[GAME] Player ${data.playerId} eliminated from game`);
    }
  });
}

// ----------------------------------------
// Envío periódico de inputs al servidor
// ----------------------------------------
function startSendingInputs() {
  if (!socket || !isConnected) {
    console.warn('[NETWORK] No conectado, no se puede empezar a enviar inputs');
    return;
  }

  if (inputSendInterval) {
    clearInterval(inputSendInterval);
  }

  const rate = NETWORK_CONFIG?.CLIENT_TICK_RATE || 20;
  const sendRateMs = 1000 / rate;

  inputSendInterval = setInterval(() => {
    if (!isConnected || !gameStarted) return;

    const safeKeys = typeof keys !== 'undefined' ? { ...keys } : {};
    const safeMousePos =
      typeof mousePos !== 'undefined'
        ? { x: mousePos.x, y: mousePos.y }
        : { x: 0, y: 0 };
    const safeShooting = typeof shooting !== 'undefined' ? shooting : false;

    const inputData = {
      keys: safeKeys,
      mousePos: safeMousePos,
      shooting: safeShooting,
    };

    socket.emit('player_input', inputData);
  }, sendRateMs);

  console.log('[NETWORK] Started sending inputs at', rate, 'Hz');
}

function stopSendingInputs() {
  if (inputSendInterval) {
    clearInterval(inputSendInterval);
    inputSendInterval = null;
    console.log('[NETWORK] Stopped sending inputs');
  }
}

// ----------------------------------------
// API pública para input.js
// ----------------------------------------
function joinLobby() {
  if (!socket || !isConnected) {
    console.warn('[NETWORK] No conectado, no se puede joinLobby()');
    return;
  }

  console.log('[NETWORK] join_lobby solicitado');
  socket.emit('join_lobby');
}

function toggleReady() {
  if (!socket || !isConnected) {
    console.warn('[NETWORK] No conectado, no se puede toggleReady()');
    return;
  }

  const myPlayer = (typeof lobbyPlayers !== 'undefined' && Array.isArray(lobbyPlayers))
    ? lobbyPlayers.find(p => p.id === localPlayerId)
    : null;

  if (!myPlayer) {
    console.warn('[NETWORK] No estás en el lobby');
    return;
  }

  if (myPlayer.ready) {
    console.log('[NETWORK] Marcando como NO listo');
    socket.emit('player_unready');
  } else {
    console.log('[NETWORK] Marcando como LISTO');
    socket.emit('player_ready');
  }
}

function sendReload() {
  if (!socket || !isConnected || !gameStarted) return;
  socket.emit('player_reload');
}

// ----------------------------------------
// Auto inicializar red al cargar
// ----------------------------------------
if (typeof io !== 'undefined') {
  initNetwork();
} else {
  console.error('[NETWORK] Socket.IO not loaded!');
}
