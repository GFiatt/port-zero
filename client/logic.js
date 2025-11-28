// Lógica principal (oleadas, drops, update)

function resetGame() {
  player = new Player(canvas.width / 2, canvas.height / 2);
  bullets = [];
  enemies = [];
  ammoPickups = [];
  healthPickups = [];
  score = 0;
  currentWave = 1;
  betweenWaves = false;
  betweenWaveTimer = 0;

  // cola de spawn y temporizador (globales, sin let/const)
  spawnQueue = [];
  enemySpawnTimer = 0;

  spawnWave(currentWave);
  currentState = GAME_STATE.PLAYING;
}

// Mete tipos de enemigo en la cola para spawnearlos poco a poco
function spawnEnemiesOfType(typeDef, count) {
  for (let i = 0; i < count; i++) {
    spawnQueue.push(typeDef);
  }
}

function spawnWave(waveNumber) {
  // limpiar pickups de la oleada anterior
  ammoPickups = [];
  healthPickups = [];

  const total =
    GAME_CONFIG.waveBaseEnemies +
    (waveNumber - 1) * GAME_CONFIG.waveEnemyIncrement;

  let remaining = total;

  // DEVIL: desde wave 10, 1, 2, 3... por wave (limitado a la mitad del total)
  let numDevils = 0;
  if (waveNumber >= 8) {
    numDevils = waveNumber - 7; // 10→1, 11→2...
    numDevils = Math.min(numDevils, Math.floor(total / 2));
    remaining -= numDevils;
  }

  // TYPE3: desde wave 5
  let numType3 = 0;
  if (waveNumber >= 5 && remaining > 0) {
    numType3 = Math.max(1, Math.floor(remaining * 0.3));
    remaining -= numType3;
  }

  // TYPE2: desde wave 2
  let numType2 = 0;
  if (waveNumber >= 2 && remaining > 0) {
    numType2 = Math.max(1, Math.floor(remaining * 0.4));
    remaining -= numType2;
  }

  // TYPE1: lo que quede
  const numType1 = remaining;

  // Vaciar cola y llenarla con los enemigos de esta wave
  spawnQueue = [];
  spawnEnemiesOfType(ENEMY_TYPES.TYPE1, numType1);
  spawnEnemiesOfType(ENEMY_TYPES.TYPE2, numType2);
  spawnEnemiesOfType(ENEMY_TYPES.TYPE3, numType3);
  spawnEnemiesOfType(ENEMY_TYPES.DEVIL, numDevils);

  enemySpawnTimer = 0;
}

function maybeSpawnDrops(x, y) {
  if (Math.random() < GAME_CONFIG.ammoDropChance) {
    ammoPickups.push(
      new AmmoPickup(x, y, GAME_CONFIG.ammoDropAmount)
    );
  }

  if (Math.random() < GAME_CONFIG.healthDropChance) {
    healthPickups.push(
      new HealthPickup(x, y, GAME_CONFIG.healthDropAmount)
    );
  }
}

function update(dt) {
  if (currentState === GAME_STATE.MENU) return;
  if (currentState === GAME_STATE.GAME_OVER) return;
  if (!player) return;

  // ---- Spawn progresivo de enemigos ----
  if (spawnQueue.length > 0) {
    enemySpawnTimer -= dt;
    if (enemySpawnTimer <= 0) {
      const typeDef = spawnQueue.shift();
      const spawn = getRandomEdgeSpawn();
      enemies.push(new Enemy(spawn.x, spawn.y, typeDef));

      // A medida que sube la wave, spawnea más rápido,
      // pero nunca más rápido que enemySpawnIntervalMin
      const interval = Math.max(
        GAME_CONFIG.enemySpawnIntervalMin,
        GAME_CONFIG.enemySpawnIntervalBase - currentWave * 0.03
      );
      enemySpawnTimer = interval;
    }
  }
  // -------------------------------------

  player.update(dt);

  if (shooting) {
    player.tryShoot();
  }

  // Balas
  bullets.forEach((b) => b.update(dt));
  bullets = bullets.filter((b) => {
    if (b.isDead()) return false;
    for (const wall of walls) {
      if (circleRectIntersects(b.x, b.y, b.radius, wall)) {
        return false;
      }
    }
    return true;
  });

  // Enemigos
  enemies.forEach((enemy) => {
    enemy.update(dt, player);
    enemy.tryAttack(player);
  });

  // Pickups de munición
  ammoPickups = ammoPickups.filter((pickup) => {
    const dx = pickup.x - player.x;
    const dy = pickup.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= pickup.radius + player.radius) {
      player.reserveAmmo += pickup.amount;
      return false;
    }
    return true;
  });

  // Pickups de vida
  healthPickups = healthPickups.filter((pickup) => {
    const dx = pickup.x - player.x;
    const dy = pickup.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= pickup.radius + player.radius) {
      player.health = Math.min(
        player.maxHealth,
        player.health + pickup.amount
      );
      return false;
    }
    return true;
  });

  // Colisión balas-enemigos
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    for (let j = bullets.length - 1; j >= 0; j--) {
      const bullet = bullets[j];
      const dx = enemy.x - bullet.x;
      const dy = enemy.y - bullet.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= enemy.radius + bullet.radius) {
        bullets.splice(j, 1);
        enemy.health -= 50;
        if (enemy.isDead()) {
          enemies.splice(i, 1);
          score += enemy.type && typeof enemy.type.score === 'number'
            ? enemy.type.score
            : 10;
          maybeSpawnDrops(enemy.x, enemy.y);
        }
        break;
      }
    }
  }

  // Muerte del jugador
  if (player.health <= 0) {
    currentState = GAME_STATE.GAME_OVER;
    return;
  }

  // Pasar a siguiente oleada SOLO cuando:
  // - No queden enemigos vivos
  // - No queden enemigos en la cola de spawn
  if (
    enemies.length === 0 &&
    spawnQueue.length === 0 &&
    !betweenWaves
  ) {
    betweenWaves = true;
    betweenWaveTimer = 0;
  }

  if (betweenWaves) {
    betweenWaveTimer += dt;
    if (betweenWaveTimer >= GAME_CONFIG.betweenWaveDelay) {
      betweenWaves = false;
      currentWave += 1;
      spawnWave(currentWave);
    }
  }
}
