// assets.js
// Carga de sprites, sonidos, etc.

let playerSpriteImage = null;

// Carga del spritesheet del jugador
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

// API pública para main.js
function loadAssets() {
  // Si más adelante tienes sonidos / otros sprites, los agregas aquí
  return Promise.all([
    loadPlayerSprite(),
  ]);
}
