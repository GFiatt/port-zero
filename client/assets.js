// assets.js
// Carga de sprites, sonidos, etc.

let playerSpriteImage = null;
let enemy1SpriteImage = null;
let enemy2SpriteImage = null;
let enemy3SpriteImage = null;
let enemyDevilSpriteImage = null;
let bloodSpriteImage = null;
let shootSoundPool = [];
const SHOOT_POOL_SIZE = 8; // cuántos disparos pueden sonar casi a la vez
let mainSongAudio = null;
let healSound = null;
let moreAmmoSound = null;
let outOfAmmoSound = null;
let reloadSound = null;
let deathYellAudios = [];

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

function loadBloodSprite() {
  return new Promise((resolve, reject) => {
    const cfg = SPRITE_CONFIG.blood;
    if (!cfg || !cfg.src) {
      console.error('SPRITE_CONFIG.blood no está definido');
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => {
      bloodSpriteImage = img;
      resolve();
    };
    img.onerror = (err) => {
      console.error('Error loading blood sprite from', cfg.src, err);
      reject(err);
    };
    img.src = cfg.src;
  });
}

// API pública para main.js
function loadAssets() {
  console.log('[ASSETS] Starting to load all assets...');
  return Promise.all([
    loadPlayerSprite(),
    loadEnemy1Sprite(),
    loadEnemy2Sprite(),
    loadEnemy3Sprite(),
    loadEnemyDevilSprite(),
    loadBloodSprite(),
    loadShootSound(),
    loadMainSong(),
    loadHealSound(),
    loadMoreAmmoSound(),
    loadOutOfAmmoSound(),
    loadReloadSound(),
    loadDeathYells(),
  ]).then(() => {
    console.log('[ASSETS] All assets loaded successfully');
    console.log('[ASSETS] Shoot pool size:', shootSoundPool.length);
    console.log('[ASSETS] Death yells count:', deathYellAudios.length);
  });
}

function loadShootSound() {
  return new Promise((resolve, reject) => {
    const url = AUDIO_CONFIG.sfx.shoot;
    const base = new Audio(url);
    base.volume = 0.5;

    base.addEventListener(
      'canplaythrough',
      () => {
        // crear el pool de sonidos clonados
        shootSoundPool = [base];
        for (let i = 1; i < SHOOT_POOL_SIZE; i++) {
          const clone = base.cloneNode();
          clone.volume = base.volume;
          shootSoundPool.push(clone);
        }
        resolve();
      },
      { once: true }
    );

    base.onerror = (err) => {
      console.error('Error loading shoot sound', err);
      reject(err);
    };
  });
}

function loadHealSound() {
  return new Promise((resolve, reject) => {
    const url = AUDIO_CONFIG.sfx.heal;
    const audio = new Audio(url);
    audio.volume = 0.6;
    audio.addEventListener(
      'canplaythrough',
      () => {
        healSound = audio;
        resolve();
      },
      { once: true }
    );
    audio.onerror = (err) => {
      console.error('Error loading heal sound', err);
      reject(err);
    };
  });
}

function loadMoreAmmoSound() {
  return new Promise((resolve, reject) => {
    const url = AUDIO_CONFIG.sfx.moreAmmo;
    const audio = new Audio(url);
    audio.volume = 0.6;
    audio.addEventListener(
      'canplaythrough',
      () => {
        moreAmmoSound = audio;
        resolve();
      },
      { once: true }
    );
    audio.onerror = (err) => {
      console.error('Error loading more ammo sound', err);
      reject(err);
    };
  });
}

function loadOutOfAmmoSound() {
  return new Promise((resolve, reject) => {
    const url = AUDIO_CONFIG.sfx.outOfAmmo;
    const audio = new Audio(url);
    audio.volume = 0.7;
    audio.addEventListener(
      'canplaythrough',
      () => {
        outOfAmmoSound = audio;
        resolve();
      },
      { once: true }
    );
    audio.onerror = (err) => {
      console.error('Error loading out-of-ammo sound', err);
      reject(err);
    };
  });
}

function loadReloadSound() {
  return new Promise((resolve, reject) => {
    const url = AUDIO_CONFIG.sfx.reload;
    const audio = new Audio(url);
    audio.volume = 0.7;
    audio.addEventListener(
      'canplaythrough',
      () => {
        reloadSound = audio;
        resolve();
      },
      { once: true }
    );
    audio.onerror = (err) => {
      console.error('Error loading reload sound', err);
      reject(err);
    };
  });
}

function loadDeathYells() {
  return new Promise((resolve) => {
    const urls = AUDIO_CONFIG.sfx.deathYells || [];
    if (!urls.length) {
      resolve();
      return;
    }

    let loaded = 0;
    deathYellAudios = [];

    urls.forEach((url, index) => {
      const audio = new Audio(url);
      audio.volume = 0.9;

      audio.addEventListener(
        'canplaythrough',
        () => {
          loaded++;
          if (loaded >= urls.length) {
            resolve();
          }
        },
        { once: true }
      );

      audio.onerror = (err) => {
        console.error('Error loading death yell', url, err);
        loaded++;
        if (loaded >= urls.length) {
          resolve();
        }
      };

      deathYellAudios[index] = audio;
    });
  });
}

// función global para reproducir el disparo
function playShootSound() {
  if (!shootSoundPool.length) {
    console.warn('[SFX] shoot sound pool empty');
    return;
  }

  let audio = shootSoundPool.find(a => a.paused || a.ended);

  if (!audio) {
    audio = shootSoundPool[0];
  }

  try {
    audio.currentTime = 0;
    audio.play();
  } catch (e) {
    console.warn('Could not play shoot sound:', e);
  }
}

function playHealSound() {
  if (!healSound) {
    console.warn('[SFX] heal sound not loaded');
    return;
  }
  try {
    healSound.currentTime = 0;
    healSound.play();
  } catch (e) {
    console.warn('Could not play heal sound:', e);
  }
}

function playMoreAmmoSound() {
  if (!moreAmmoSound) {
    console.warn('[SFX] more ammo sound not loaded');
    return;
  }
  try {
    moreAmmoSound.currentTime = 0;
    moreAmmoSound.play();
  } catch (e) {
    console.warn('Could not play more ammo sound:', e);
  }
}

function playOutOfAmmoSound() {
  if (!outOfAmmoSound) {
    console.warn('[SFX] out of ammo sound not loaded');
    return;
  }
  try {
    outOfAmmoSound.currentTime = 0;
    outOfAmmoSound.play();
  } catch (e) {
    console.warn('Could not play out-of-ammo sound:', e);
  }
}

function playReloadSound() {
  if (!reloadSound) {
    console.warn('[SFX] reload sound not loaded');
    return;
  }
  try {
    reloadSound.currentTime = 0;
    reloadSound.play();
  } catch (e) {
    console.warn('Could not play reload sound:', e);
  }
}

function playRandomDeathYell() {
  console.log('[SFX] 💀 Playing death yell');
  if (!deathYellAudios.length) {
    console.warn('[SFX] death yell audios not loaded');
    return;
  }
  const idx = Math.floor(Math.random() * deathYellAudios.length);
  const audio = deathYellAudios[idx];
  if (!audio) {
    console.warn('[SFX] death yell audio at index', idx, 'not found');
    return;
  }
  try {
    // Reproducir directamente sin clonar para mayor confiabilidad
    audio.currentTime = 0;
    audio.volume = 0.9;
    audio.play();
  } catch (e) {
    console.warn('Could not play death yell:', e);
  }
}

function loadMainSong() {
  return new Promise((resolve, reject) => {
    const url = AUDIO_CONFIG.music.mainSong;
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0.25; // ~25% de volumen, ajustá entre 0.2 y 0.3

    audio.addEventListener(
      'canplaythrough',
      () => {
        mainSongAudio = audio;
        resolve();
      },
      { once: true }
    );

    audio.onerror = (err) => {
      console.error('Error loading main song', err);
      reject(err);
    };
  });
}

function playMainSong() {
  if (!mainSongAudio) {
    console.warn('[AUDIO] Main song not loaded');
    return;
  }
  try {
    console.log('[AUDIO] Playing main song');
    mainSongAudio.play();
  } catch (e) {
    console.warn('Could not play main song:', e);
  }
}

function stopMainSong() {
  if (!mainSongAudio) return;
  console.log('[AUDIO] Stopping main song');
  mainSongAudio.pause();
  mainSongAudio.currentTime = 0;
}

// Función de diagnóstico para verificar que todo el audio esté cargado
function checkAudioStatus() {
  console.log('=== AUDIO STATUS ===');
  console.log('Shoot sound pool:', shootSoundPool.length, 'sounds');
  console.log('Main song:', mainSongAudio ? 'loaded' : 'NOT LOADED');
  console.log('Heal sound:', healSound ? 'loaded' : 'NOT LOADED');
  console.log('More ammo sound:', moreAmmoSound ? 'loaded' : 'NOT LOADED');
  console.log('Out of ammo sound:', outOfAmmoSound ? 'loaded' : 'NOT LOADED');
  console.log('Reload sound:', reloadSound ? 'loaded' : 'NOT LOADED');
  console.log('Death yells:', deathYellAudios.length, 'sounds');
  console.log('===================');
}


