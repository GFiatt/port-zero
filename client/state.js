// Estado global

let currentState = GAME_STATE.MENU;

const keys = {};
let mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
let shooting = false;

let lastTime = 0;

// Entidades
let player = null;
let bullets = [];
let enemies = [];
let ammoPickups = [];
let healthPickups = [];

// Spawn progresivo
let spawnQueue = [];     // lista de tipos de enemigo pendientes de salir
let enemySpawnTimer = 0; // tiempo para el próximo spawn

// Meta juego
let score = 0;
let currentWave = 1;
let betweenWaves = false;
let betweenWaveTimer = 0;
