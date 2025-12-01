// ========================================
// Estado Global - Refactorizado para Multijugador en Red
// ========================================

let currentState = GAME_STATE.MENU;

// -------------------------------
// Network State (nuevo)
// -------------------------------
let isConnected = false;
let localPlayerId = null;        // ID del jugador en esta máquina (socket.id)
let gameStarted = false;         // Si la partida ha comenzado
let connectedPlayersCount = 0;   // Cantidad de jugadores conectados en el lobby

// -------------------------------
// Input Local (capturado localmente, enviado al servidor)
// -------------------------------
const keys = {};
let mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
let shooting = false;

let lastTime = 0;

// -------------------------------
// Entidades del Juego (sincronizadas desde el servidor)
// -------------------------------
// CAMBIO IMPORTANTE: "player" ahora es "players" (Map de todos los jugadores)
let players = new Map();         // Map<playerId, {x, y, angle, health, ammo, ...}>
let player = null;               // Referencia al jugador local (para compatibilidad)

let bullets = [];                // [{id, x, y, vx, vy}]
let enemies = [];                // [{id, x, y, typeId, health, ...}]
let ammoPickups = [];            // [{id, x, y, amount}]
let healthPickups = [];          // [{id, x, y, amount}]

// -------------------------------
// Spawn progresivo (ahora manejado por el servidor)
// -------------------------------
let spawnQueue = [];             // Ya no se usa en el cliente
let enemySpawnTimer = 0;         // Ya no se usa en el cliente

// -------------------------------
// Meta juego (sincronizado desde el servidor)
// -------------------------------
let score = 0;
let currentWave = 1;
let betweenWaves = false;
let betweenWaveTimer = 0;

// -------------------------------
// Mensajes en pantalla
// -------------------------------
let bigMessage = null;          // { text: string, endTime: timestamp }

function showBigMessage(text, duration) {
  bigMessage = {
    text: text,
    endTime: performance.now() + duration
  };
}
