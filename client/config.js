// Configuración base y canvas

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
};

// -------------------------------
// Constantes de juego
// -------------------------------
const GAME_CONFIG = {
  playerSpeed: 220,
  playerRadius: 22,          // <- un poco más grande, acorde al sprite escalado
  playerMaxHealth: 100,
  bulletSpeed: 600,
  bulletRadius: 4,
  bulletLife: 1.2,
  fireRate: 8,
  magSize: 12,
  reloadTime: 1.4,
  enemyMinSpeed: 60,
  enemyMaxSpeed: 110,
  enemyRadius: 18,
  enemyDamage: 15,
  enemyAttackCooldown: 0.8,
  waveBaseEnemies: 5,
  waveEnemyIncrement: 3,
  betweenWaveDelay: 3,
  initialReserveAmmo: 60,
  ammoDropChance: 0.25,
  ammoDropAmount: 12,
  healthDropChance: 0.15,
  healthDropAmount: 30,
  enemySpawnIntervalBase: 1.0, // segundos entre enemigos al inicio
  enemySpawnIntervalMin: 0.25, // límite mínimo de intervalo
};

// -------------------------------
// Sprites
// -------------------------------
const SPRITE_CONFIG = {
  player: {
    src: '/client/assets/playerSpriteSheet.png',

    // Cada celda del spritesheet
    frameWidth: 123,
    frameHeight: 123,
    sheetCols: 3,
    sheetRows: 3,

    // Escala en pantalla (ajusta a gusto)
    scale: 0.32,
    animSpeed: 8, // fps al caminar

    // Índices de frame (row-major)
    frames: {
      down:  [0, 1],
      right: [4, 5],
      up:    [6, 7],
      left:  [2, 3],
    },
  },

  enemies: {
    type1: {
      src: '/client/assets/enemy1SpriteSheet.png',
      frameWidth: 123,
      frameHeight: 123,
      sheetCols: 3,
      sheetRows: 3,
      scale: 0.32,
      animSpeed: 6,
      frames: {
        down:  [0, 1],
        right: [4, 5],
        up:    [6, 7],
        left:  [2, 3],
      },
    },
    type2: {
      src: '/client/assets/enemy2SpriteSheet.png',
      frameWidth: 123,
      frameHeight: 123,
      sheetCols: 3,
      sheetRows: 3,
      scale: 0.32,
      animSpeed: 6,
      frames: {
        down:  [0, 1],
        right: [4, 5],
        up:    [6, 7],
        left:  [2, 3],
      },
    },
    type3: {
      src: '/client/assets/enemy3SpriteSheet.png',
      frameWidth: 123,
      frameHeight: 123,
      sheetCols: 3,
      sheetRows: 3,
      scale: 0.32,
      animSpeed: 6,
      frames: {
        down:  [0, 1],
        right: [4, 5],
        up:    [6, 7],
        left:  [2, 3],
      },
    },
    devil: {
      src: '/client/assets/devilSpriteSheet.png',
      frameWidth: 123,
      frameHeight: 123,
      sheetCols: 3,
      sheetRows: 3,
      scale: 0.32,   // si querés que sea más grande, luego solo subís esto
      animSpeed: 6,
      frames: {
        down:  [0, 1],
        right: [4, 5],
        up:    [6, 7],
        left:  [2, 3],
      },
    },
  },
};


const ENEMY_TYPES = {
  TYPE1: {
    id: 1,
    speed: 80,
    radius: 18,
    maxHealth: 60,
    damage: 12,
    color: '#ef4444',
    score: 10,
  },
  TYPE2: {
    id: 2,
    speed: 110,
    radius: 18,
    maxHealth: 90,
    damage: 16,
    color: '#fb923c',
    score: 18,
  },
  TYPE3: {
    id: 3,
    speed: 140,
    radius: 18,
    maxHealth: 130,
    damage: 20,
    color: '#f97316',
    score: 28,
  },
  DEVIL: {
    id: 4,
    speed: 80,
    radius: 28,
    maxHealth: 420,
    damage: 28,
    color: '#a855f7',
    score: 120,
  },
};
