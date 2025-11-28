// assets.js
// Carga de sprites, sonidos, etc.

let playerSpriteImage = null;

let enemy1SpriteImage = null;
let enemy2SpriteImage = null;
let enemy3SpriteImage = null;
let enemyDevilSpriteImage = null;

// ----------------------------
// Player
// ----------------------------
function loadPlayerSprite() {
  return new Promise((resolve, reject) => {
    const cfg = SPRITE_CONFIG.player;
    if (!cfg || !cfg.src) {
      reject(new Error('SPRITE_CONFIG.player.src no está definido'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      playerSpriteImage = img;
      resolve();
    };
    img.onerror = (err) => {
      console.error('Error loading player sprite from', cfg.src, err);
      reject(err);
    };
    img.src = cfg.src;
  });
}

// ----------------------------
// Enemies
// ----------------------------
function loadEnemy1Sprite() {
  return new Promise((resolve, reject) => {
    const cfg = SPRITE_CONFIG.enemies && SPRITE_CONFIG.enemies.type1;
    if (!cfg || !cfg.src) {
      console.error('SPRITE_CONFIG.enemies.type1 no está definido');
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => {
      enemy1SpriteImage = img;
      resolve();
    };
    img.onerror = (err) => {
      console.error('Error loading enemy1 sprite from', cfg.src, err);
      reject(err);
    };
    img.src = cfg.src;
  });
}

function loadEnemy2Sprite() {
  return new Promise((resolve, reject) => {
    const cfg = SPRITE_CONFIG.enemies && SPRITE_CONFIG.enemies.type2;
    if (!cfg || !cfg.src) {
      console.error('SPRITE_CONFIG.enemies.type2 no está definido');
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => {
      enemy2SpriteImage = img;
      resolve();
    };
    img.onerror = (err) => {
      console.error('Error loading enemy2 sprite from', cfg.src, err);
      reject(err);
    };
    img.src = cfg.src;
  });
}

function loadEnemy3Sprite() {
  return new Promise((resolve, reject) => {
    const cfg = SPRITE_CONFIG.enemies && SPRITE_CONFIG.enemies.type3;
    if (!cfg || !cfg.src) {
      console.error('SPRITE_CONFIG.enemies.type3 no está definido');
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => {
      enemy3SpriteImage = img;
      resolve();
    };
    img.onerror = (err) => {
      console.error('Error loading enemy3 sprite from', cfg.src, err);
      reject(err);
    };
    img.src = cfg.src;
  });
}

function loadEnemyDevilSprite() {
  return new Promise((resolve, reject) => {
    const cfg = SPRITE_CONFIG.enemies && SPRITE_CONFIG.enemies.devil;
    if (!cfg || !cfg.src) {
      console.error('SPRITE_CONFIG.enemies.devil no está definido');
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => {
      enemyDevilSpriteImage = img;
      resolve();
    };
    img.onerror = (err) => {
      console.error('Error loading devil sprite from', cfg.src, err);
      reject(err);
    };
    img.src = cfg.src;
  });
}

// API pública para main.js
function loadAssets() {
  return Promise.all([
    loadPlayerSprite(),
    loadEnemy1Sprite(),
    loadEnemy2Sprite(),
    loadEnemy3Sprite(),
    loadEnemyDevilSprite(),
  ]);
}
