// ========================================
// NETWORK CLIENT - Comunicación con el Servidor
// ========================================

let socket = null;
let inputSendInterval = null;

// Inicializar conexión con el servidor
function initNetwork() {
  console.log('[NETWORK] Connecting to server:', NETWORK_CONFIG.SERVER_URL);
  
  socket = io(NETWORK_CONFIG.SERVER_URL, {
    transports: ['websocket', 'polling'], // Asegurar compatibilidad
  });

  setupNetworkListeners();
}

function setupNetworkListeners() {
  // ========================================
  // EVENTOS DEL SERVIDOR
  // ========================================

  socket.on('connect', () => {
    console.log('[NETWORK] Connected to server as', socket.id);
    isConnected = true;
    localPlayerId = socket.id;
  });

  socket.on('disconnect', () => {
    console.log('[NETWORK] Disconnected from server');
    isConnected = false;
    localPlayerId = null;
    gameStarted = false;
    stopSendingInputs();
  });

  // Recibir estado inicial al conectar
  socket.on('init_state', (data) => {
    console.log('[NETWORK] Received init_state:', data);
    localPlayerId = data.playerId;
    gameStarted = data.gameStarted;
    currentWave = data.currentWave;
    score = data.score;
    connectedPlayersCount = data.connectedCount || 1; // Inicializar con el conteo del servidor
  });

  // Actualización del estado completo del juego
  socket.on('game_state', (compactState) => {
    // Actualizar jugadores
    players.clear();
    compactState.players.forEach(p => {
      players.set(p.id, p);
      
      // Mantener referencia al jugador local
      if (p.id === localPlayerId) {
        player = p;
      }
    });

    // Actualizar balas
    bullets = compactState.bullets;

    // Actualizar enemigos
    enemies = compactState.enemies;

    // Actualizar pickups
    ammoPickups = compactState.ammoPickups;
    healthPickups = compactState.healthPickups;

    // Actualizar estado del juego
    currentWave = compactState.currentWave;
    score = compactState.score;
    betweenWaves = compactState.betweenWaves;
  });

  // Eventos de juego
  socket.on('game_event', (event) => {
    console.log('[GAME EVENT]', event);
    
    if (event.type === 'wave_complete') {
      console.log(`Wave ${event.wave} completed!`);
      showBigMessage(event.message || `Wave ${event.wave} Over`, 2000);
    } else if (event.type === 'wave_start') {
      console.log(`Wave ${event.wave} starting!`);
      showBigMessage(event.message || `Round ${event.wave}`, 1500);
    } else if (event.type === 'game_over') {
      console.log(`Game Over! Score: ${event.score}, Wave: ${event.wave}`);
      currentState = GAME_STATE.GAME_OVER;
      stopSendingInputs();
    }
  });

  // Otro jugador se unió
  socket.on('player_joined', (data) => {
    console.log(`[NETWORK] Player joined: ${data.playerId} (Total: ${data.playerCount})`);
    connectedPlayersCount = data.playerCount;
  });

  // Otro jugador se fue
  socket.on('player_left', (data) => {
    console.log(`[NETWORK] Player left: ${data.playerId} (Remaining: ${data.playerCount})`);
    players.delete(data.playerId);
    connectedPlayersCount = data.playerCount;
  });
}

// ========================================
// ENVIAR INPUTS AL SERVIDOR
// ========================================

function startSendingInputs() {
  if (inputSendInterval) return;
  
  const sendRate = 1000 / NETWORK_CONFIG.CLIENT_TICK_RATE; // ms
  
  inputSendInterval = setInterval(() => {
    if (!isConnected || !gameStarted) return;

    // Capturar inputs actuales
    const inputData = {
      keys: { ...keys }, // Copiar objeto keys
      mousePos: { ...mousePos },
      shooting: shooting,
    };

    // Enviar al servidor
    socket.emit('player_input', inputData);
  }, sendRate);
  
  console.log('[NETWORK] Started sending inputs at', NETWORK_CONFIG.CLIENT_TICK_RATE, 'Hz');
}

function stopSendingInputs() {
  if (inputSendInterval) {
    clearInterval(inputSendInterval);
    inputSendInterval = null;
    console.log('[NETWORK] Stopped sending inputs');
  }
}

// ========================================
// FUNCIONES DE CONTROL
// ========================================

function joinGame() {
  if (!isConnected) {
    console.error('[NETWORK] Cannot join: not connected to server');
    return;
  }

  console.log('[NETWORK] Joining game...');
  socket.emit('join_game');
  
  // Cambiar estado y empezar a enviar inputs
  currentState = GAME_STATE.PLAYING;
  gameStarted = true;
  startSendingInputs();
}

function sendReload() {
  if (!isConnected || !gameStarted) return;
  socket.emit('player_reload');
}

// Inicializar red al cargar
if (typeof io !== 'undefined') {
  initNetwork();
} else {
  console.error('[NETWORK] Socket.IO not loaded!');
}
