// Estado global

let currentState = GAME_STATE.MENU;

// Input local
const keys = {};
let mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
let shooting = false;

// Tiempo para el game loop
let lastTime = 0;

// Entidades
let player = null;              // jugador local (singleplayer)
let players = new Map();        // mapa de jugadores (para futuro multijugador)

let bullets = [];
let enemies = [];
let ammoPickups = [];
let healthPickups = [];

// Spawn progresivo (lógica local de oleadas)
let spawnQueue = [];            // lista de tipos de enemigo pendientes de salir
let enemySpawnTimer = 0;        // tiempo para el próximo spawn

// Meta juego
let score = 0;
let currentWave = 1;
let betweenWaves = false;
let betweenWaveTimer = 0;

// Estado de red (multijugador)
let isConnected = false;
let localPlayerId = null;
let gameStarted = false;
let connectedPlayersCount = 0;
let readyPlayersCount = 0;
let lobbyPlayers = []; // Lista de jugadores en el lobby con estado ready

// Sistema de mensajes grandes en pantalla
let bigMessage = null; // { text: string, duration: number, elapsed: number }
