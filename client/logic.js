// ========================================
// LÓGICA DEL CLIENTE (simplificada para red)
// La simulación completa ahora ocurre en el SERVIDOR
// ========================================

// Esta función ya no se usa - el servidor maneja el reset
function resetGame() {
  console.log('[CLIENT] resetGame() is deprecated - server handles game logic');
  // El estado se sincroniza desde el servidor vía network.js
}

// ========================================
// FUNCIONES DEPRECADAS (ahora manejadas por el servidor)
// ========================================

// Ya no se usan en el cliente - el servidor maneja spawns y oleadas
function spawnEnemiesOfType(typeDef, count) {
  console.warn('[CLIENT] spawnEnemiesOfType() is deprecated - server handles spawns');
}

function spawnWave(waveNumber) {
  console.warn('[CLIENT] spawnWave() is deprecated - server handles waves');
}

function maybeSpawnDrops(x, y) {
  console.warn('[CLIENT] maybeSpawnDrops() is deprecated - server handles drops');
}

function update(dt) {
  // ========================================
  // CLIENTE LIGERO: No ejecuta simulación
  // Solo actualiza animaciones locales y efectos visuales
  // El estado real viene del servidor vía 'game_state'
  // ========================================
  
  if (currentState === GAME_STATE.MENU) return;
  if (currentState === GAME_STATE.GAME_OVER) return;

  // El servidor maneja toda la lógica:
  // - Movimiento de jugadores
  // - Spawn de enemigos
  // - IA de enemigos
  // - Colisiones
  // - Sistema de oleadas
  // - Pickups
  // - Game Over
  
  // Aquí solo se pueden añadir efectos visuales locales:
  // - Interpolación suave de posiciones (opcional)
  // - Partículas
  // - Animaciones de sprites (ya manejadas en render.js)
  
  // TODO (opcional): Implementar interpolación para suavizar movimiento
  // TODO (opcional): Predicción del jugador local para reducir lag percibido

}
