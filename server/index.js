// ========================================
// PORT ZERO - SERVIDOR AUTORITATIVO
// Curso: IC-7602 Redes
// Arquitectura: Cliente-Servidor con Socket.IO
// 
// IMPORTANTE: Este servidor debe ser accesible desde Internet o VPN
// porque los jugadores NO estarán en la misma red local.
// ========================================

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configurar CORS para permitir conexiones desde cualquier origen
// (necesario cuando el servidor está en Railway/Render y clientes en diferentes casas)
const io = new Server(server, {
  cors: {
    origin: "*", // En producción, cambiar a dominios específicos
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// Ruta absoluta a la carpeta client
const clientPath = path.join(__dirname, '..', 'client');

// Servir archivos estáticos
app.use('/client', express.static(clientPath));
app.get('/', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// ========================================
// CONFIGURACIÓN DEL JUEGO (copiado de client/config.js)
// ========================================
const GAME_CONFIG = {
  playerSpeed: 220,
  playerRadius: 22,
  playerMaxHealth: 100,
  bulletSpeed: 600,
  bulletRadius: 4,
  bulletLife: 1.2,
  fireRate: 8,
  magSize: 12,
  reloadTime: 1.4,
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
  enemySpawnIntervalBase: 1.0,
  enemySpawnIntervalMin: 0.25,
};

const ENEMY_TYPES = {
  TYPE1: { id: 1, speed: 80, radius: 18, maxHealth: 60, damage: 12, score: 10 },
  TYPE2: { id: 2, speed: 110, radius: 18, maxHealth: 90, damage: 16, score: 18 },
  TYPE3: { id: 3, speed: 140, radius: 18, maxHealth: 130, damage: 20, score: 28 },
  DEVIL: { id: 4, speed: 80, radius: 28, maxHealth: 420, damage: 28, score: 120 },
};

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 640;
const MARGIN = 40;

// ========================================
// ESTADO DEL JUEGO EN EL SERVIDOR (Autoritativo)
// ========================================
const gameState = {
  players: new Map(),           // Map<socketId, PlayerData>
  bullets: new Map(),           // Map<bulletId, BulletData>
  enemies: new Map(),           // Map<enemyId, EnemyData>
  ammoPickups: new Map(),       // Map<pickupId, PickupData>
  healthPickups: new Map(),     // Map<pickupId, PickupData>
  
  currentWave: 1,
  score: 0,
  betweenWaves: false,
  betweenWaveTimer: 0,
  
  spawnQueue: [],               // Cola de enemigos por spawnear
  enemySpawnTimer: 0,
  
  nextBulletId: 0,
  nextEnemyId: 0,
  nextPickupId: 0,
  
  gameStarted: false,
  gameOver: false,
};

// Buffer de inputs de cada jugador
const playerInputs = new Map(); // Map<socketId, {keys, mousePos, shooting}>

// Walls (copiadas del cliente)
const walls = [
  // Bordes del área jugable (zona gris)
  { x: 0, y: 0, width: CANVAS_WIDTH, height: MARGIN },                    // Superior
  { x: 0, y: CANVAS_HEIGHT - MARGIN, width: CANVAS_WIDTH, height: MARGIN }, // Inferior
  { x: 0, y: 0, width: MARGIN, height: CANVAS_HEIGHT },                    // Izquierda
  { x: CANVAS_WIDTH - MARGIN, y: 0, width: MARGIN, height: CANVAS_HEIGHT }, // Derecha

  // Columna izquierda (3 bloques)
  { x: 160, y: 120, width: 80, height: 80 },
  { x: 160, y: 260, width: 80, height: 80 },
  { x: 160, y: 400, width: 80, height: 80 },

  // Columna derecha (3 bloques)
  { x: 784, y: 120, width: 80, height: 80 },
  { x: 784, y: 260, width: 80, height: 80 },
  { x: 784, y: 400, width: 80, height: 80 },

  // Fila superior interna
  { x: 328, y: 120, width: 80, height: 80 },
  { x: 512, y: 120, width: 80, height: 80 },
  { x: 696, y: 120, width: 80, height: 80 },

  // Fila inferior interna
  { x: 328, y: 400, width: 80, height: 80 },
  { x: 512, y: 400, width: 80, height: 80 },
  { x: 696, y: 400, width: 80, height: 80 },

  // Bloques centrales laterales
  { x: 328, y: 260, width: 80, height: 80 },
  { x: 696, y: 260, width: 80, height: 80 },
];

// ========================================
// FUNCIONES AUXILIARES (copiadas del cliente)
// ========================================
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function circleRectIntersects(x, y, radius, rect) {
  const closestX = clamp(x, rect.x, rect.x + rect.width);
  const closestY = clamp(y, rect.y, rect.y + rect.height);
  const dx = x - closestX;
  const dy = y - closestY;
  return (dx * dx + dy * dy) < (radius * radius);
}

function resolveCircleRectCollision(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distSq = dx * dx + dy * dy;
  const radiusSq = circle.radius * circle.radius;

  if (distSq < radiusSq) {
    const dist = Math.sqrt(distSq) || 0.001;
    const overlap = circle.radius - dist;
    circle.x += (dx / dist) * overlap;
    circle.y += (dy / dist) * overlap;
  }
}

function getRandomEdgeSpawn() {
  // Spawn DENTRO del área gris, pegado a los bordes
  const playableWidth = CANVAS_WIDTH - 2 * MARGIN;
  const playableHeight = CANVAS_HEIGHT - 2 * MARGIN;
  const enemyRadius = 18; // Radio típico de enemigos
  
  const side = Math.floor(Math.random() * 4);
  let x, y;
  
  if (side === 0) { 
    // Arriba (dentro del área, pegado al borde superior)
    x = MARGIN + enemyRadius + Math.random() * (playableWidth - 2 * enemyRadius); 
    y = MARGIN + enemyRadius; 
  } else if (side === 1) { 
    // Abajo (dentro del área, pegado al borde inferior)
    x = MARGIN + enemyRadius + Math.random() * (playableWidth - 2 * enemyRadius); 
    y = CANVAS_HEIGHT - MARGIN - enemyRadius; 
  } else if (side === 2) { 
    // Izquierda (dentro del área, pegado al borde izquierdo)
    x = MARGIN + enemyRadius; 
    y = MARGIN + enemyRadius + Math.random() * (playableHeight - 2 * enemyRadius); 
  } else { 
    // Derecha (dentro del área, pegado al borde derecho)
    x = CANVAS_WIDTH - MARGIN - enemyRadius; 
    y = MARGIN + enemyRadius + Math.random() * (playableHeight - 2 * enemyRadius); 
  }
  
  return { x, y };
}

// ========================================
// LÓGICA DEL JUEGO EN EL SERVIDOR
// ========================================

function initGame() {
  gameState.players.clear();
  gameState.bullets.clear();
  gameState.enemies.clear();
  gameState.ammoPickups.clear();
  gameState.healthPickups.clear();
  
  gameState.currentWave = 1;
  gameState.score = 0;
  gameState.betweenWaves = false;
  gameState.betweenWaveTimer = 0;
  gameState.spawnQueue = [];
  gameState.enemySpawnTimer = 0;
  gameState.gameStarted = true;
  gameState.gameOver = false;
  
  spawnWave(1);
}

function spawnWave(waveNumber) {
  gameState.ammoPickups.clear();
  gameState.healthPickups.clear();

  const total = GAME_CONFIG.waveBaseEnemies + (waveNumber - 1) * GAME_CONFIG.waveEnemyIncrement;
  let remaining = total;

  let numDevils = 0;
  if (waveNumber >= 8) {
    numDevils = Math.min(waveNumber - 7, Math.floor(total / 2));
    remaining -= numDevils;
  }

  let numType3 = 0;
  if (waveNumber >= 5 && remaining > 0) {
    numType3 = Math.max(1, Math.floor(remaining * 0.3));
    remaining -= numType3;
  }

  let numType2 = 0;
  if (waveNumber >= 2 && remaining > 0) {
    numType2 = Math.max(1, Math.floor(remaining * 0.4));
    remaining -= numType2;
  }

  const numType1 = remaining;

  gameState.spawnQueue = [];
  for (let i = 0; i < numType1; i++) gameState.spawnQueue.push(ENEMY_TYPES.TYPE1);
  for (let i = 0; i < numType2; i++) gameState.spawnQueue.push(ENEMY_TYPES.TYPE2);
  for (let i = 0; i < numType3; i++) gameState.spawnQueue.push(ENEMY_TYPES.TYPE3);
  for (let i = 0; i < numDevils; i++) gameState.spawnQueue.push(ENEMY_TYPES.DEVIL);

  // IMPORTANTE: Inicializar timer para que spawnee inmediatamente
  gameState.enemySpawnTimer = GAME_CONFIG.enemySpawnIntervalBase;
  
  console.log(`[GAME] Wave ${waveNumber} started: ${total} enemies (${numType1} T1, ${numType2} T2, ${numType3} T3, ${numDevils} Devils)`);
  console.log(`[GAME] Spawn queue length: ${gameState.spawnQueue.length}`);
}

function maybeSpawnDrops(x, y) {
  if (Math.random() < GAME_CONFIG.ammoDropChance) {
    const id = gameState.nextPickupId++;
    gameState.ammoPickups.set(id, {
      id, x, y, radius: 12, amount: GAME_CONFIG.ammoDropAmount
    });
  }
  if (Math.random() < GAME_CONFIG.healthDropChance) {
    const id = gameState.nextPickupId++;
    gameState.healthPickups.set(id, {
      id, x, y, radius: 12, amount: GAME_CONFIG.healthDropAmount
    });
  }
}

// ========================================
// GAME LOOP DEL SERVIDOR (30 Hz)
// ========================================
const SERVER_TICK_RATE = 30; // Hz
const TICK_INTERVAL = 1000 / SERVER_TICK_RATE;
let lastTickTime = Date.now();

setInterval(() => {
  if (!gameState.gameStarted || gameState.gameOver) return;

  const now = Date.now();
  const dt = (now - lastTickTime) / 1000;
  lastTickTime = now;

  updateGame(dt);
  broadcastGameState();
}, TICK_INTERVAL);

function updateGame(dt) {
  // 1) Procesar inputs de jugadores
  gameState.players.forEach((playerData, playerId) => {
    const input = playerInputs.get(playerId);
    if (!input) return;

    let dx = 0, dy = 0;
    if (input.keys['w']) dy -= 1;
    if (input.keys['s']) dy += 1;
    if (input.keys['a']) dx -= 1;
    if (input.keys['d']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      playerData.x += dx * GAME_CONFIG.playerSpeed * dt;
      playerData.y += dy * GAME_CONFIG.playerSpeed * dt;
      playerData.isMoving = true;
    } else {
      playerData.isMoving = false;
    }

    // Límites del área jugable (zona gris)
    playerData.x = clamp(playerData.x, MARGIN + playerData.radius, CANVAS_WIDTH - MARGIN - playerData.radius);
    playerData.y = clamp(playerData.y, MARGIN + playerData.radius, CANVAS_HEIGHT - MARGIN - playerData.radius);

    // Colisión con paredes
    walls.forEach(wall => resolveCircleRectCollision(playerData, wall));

    // Apuntar al mouse
    if (input.mousePos) {
      playerData.angle = Math.atan2(
        input.mousePos.y - playerData.y,
        input.mousePos.x - playerData.x
      );
    }

    // Recarga
    if (playerData.isReloading) {
      playerData.reloadTimer += dt;
      if (playerData.reloadTimer >= GAME_CONFIG.reloadTime) {
        playerData.isReloading = false;
        playerData.reloadTimer = 0;
        const needed = playerData.magSize - playerData.ammo;
        const toLoad = Math.min(needed, playerData.reserveAmmo);
        playerData.ammo += toLoad;
        playerData.reserveAmmo -= toLoad;
      }
    }

    // Disparo automático
    playerData.timeSinceLastShot += dt;
    if (input.shooting && !playerData.isReloading && playerData.ammo > 0) {
      const minDelay = 1 / GAME_CONFIG.fireRate;
      if (playerData.timeSinceLastShot >= minDelay) {
        const dirX = Math.cos(playerData.angle);
        const dirY = Math.sin(playerData.angle);
        const bulletId = gameState.nextBulletId++;
        gameState.bullets.set(bulletId, {
          id: bulletId,
          x: playerData.x + dirX * (playerData.radius + 4),
          y: playerData.y + dirY * (playerData.radius + 4),
          vx: dirX * GAME_CONFIG.bulletSpeed,
          vy: dirY * GAME_CONFIG.bulletSpeed,
          radius: GAME_CONFIG.bulletRadius,
          life: 0,
        });
        playerData.ammo -= 1;
        playerData.timeSinceLastShot = 0;
      }
    }

    if (playerData.ammo === 0 && !playerData.isReloading && playerData.reserveAmmo > 0) {
      playerData.isReloading = true;
      playerData.reloadTimer = 0;
    }
  });

  // 2) Spawn progresivo de enemigos
  if (gameState.spawnQueue.length > 0) {
    gameState.enemySpawnTimer -= dt;
    
    // Cuando el timer llega a 0 o menos, spawnear enemigo
    if (gameState.enemySpawnTimer <= 0) {
      const typeDef = gameState.spawnQueue.shift();
      const spawn = getRandomEdgeSpawn();
      const enemyId = gameState.nextEnemyId++;
      
      gameState.enemies.set(enemyId, {
        id: enemyId,
        x: spawn.x,
        y: spawn.y,
        typeId: typeDef.id,
        speed: typeDef.speed,
        radius: typeDef.radius,
        maxHealth: typeDef.maxHealth,
        health: typeDef.maxHealth,
        damage: typeDef.damage,
        score: typeDef.score,
        attackCooldown: 0,
        animFrame: 0,
        animFacing: 'down',
        animTimer: 0,
      });
      
      // Calcular intervalo para el próximo spawn (más rápido en waves altas)
      const interval = Math.max(
        GAME_CONFIG.enemySpawnIntervalMin,
        GAME_CONFIG.enemySpawnIntervalBase - gameState.currentWave * 0.03
      );
      gameState.enemySpawnTimer = interval;
      
      console.log(`[GAME] Spawned enemy ${enemyId} (type ${typeDef.id}). Remaining in queue: ${gameState.spawnQueue.length}`);
    }
  }

  // 3) Update balas
  gameState.bullets.forEach((bullet, bulletId) => {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life += dt;

    // Remover si está fuera de límites o pasó su vida
    if (bullet.life >= GAME_CONFIG.bulletLife ||
        bullet.x < -50 || bullet.x > CANVAS_WIDTH + 50 ||
        bullet.y < -50 || bullet.y > CANVAS_HEIGHT + 50) {
      gameState.bullets.delete(bulletId);
      return;
    }

    // Colisión con paredes
    for (const wall of walls) {
      if (circleRectIntersects(bullet.x, bullet.y, bullet.radius, wall)) {
        gameState.bullets.delete(bulletId);
        return;
      }
    }
  });

  // 4) Update enemigos (IA simple: perseguir jugador más cercano)
  gameState.enemies.forEach((enemy) => {
    // Actualizar animación
    enemy.animTimer += dt;
    if (enemy.animTimer >= 0.15) {
      enemy.animFrame = (enemy.animFrame + 1) % 4;
      enemy.animTimer = 0;
    }

    let nearestPlayer = null;
    let minDist = Infinity;

    gameState.players.forEach((playerData) => {
      if (playerData.health <= 0) return;
      const dist = Math.hypot(playerData.x - enemy.x, playerData.y - enemy.y);
      if (dist < minDist) {
        minDist = dist;
        nearestPlayer = playerData;
      }
    });

    if (nearestPlayer) {
      const dx = nearestPlayer.x - enemy.x;
      const dy = nearestPlayer.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        enemy.x += (dx / dist) * enemy.speed * dt;
        enemy.y += (dy / dist) * enemy.speed * dt;
        
        // Actualizar dirección de animación
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (absDx > absDy) {
          enemy.animFacing = dx > 0 ? 'right' : 'left';
        } else {
          enemy.animFacing = dy > 0 ? 'down' : 'up';
        }
      }

      // Ataque al jugador
      enemy.attackCooldown -= dt;
      if (dist <= enemy.radius + nearestPlayer.radius && enemy.attackCooldown <= 0) {
        nearestPlayer.health -= enemy.damage;
        enemy.attackCooldown = GAME_CONFIG.enemyAttackCooldown;
      }
    }

    // Colisión con paredes
    walls.forEach(wall => resolveCircleRectCollision(enemy, wall));
  });

  // 5) Colisión balas-enemigos
  gameState.bullets.forEach((bullet, bulletId) => {
    gameState.enemies.forEach((enemy, enemyId) => {
      const dx = enemy.x - bullet.x;
      const dy = enemy.y - bullet.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= enemy.radius + bullet.radius) {
        gameState.bullets.delete(bulletId);
        enemy.health -= 50;
        if (enemy.health <= 0) {
          gameState.enemies.delete(enemyId);
          gameState.score += enemy.score;
          maybeSpawnDrops(enemy.x, enemy.y);
        }
      }
    });
  });

  // 6) Colisión jugadores-pickups
  gameState.players.forEach((playerData) => {
    if (playerData.health <= 0) return;

    gameState.ammoPickups.forEach((pickup, pickupId) => {
      const dx = pickup.x - playerData.x;
      const dy = pickup.y - playerData.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= pickup.radius + playerData.radius) {
        playerData.reserveAmmo += pickup.amount;
        gameState.ammoPickups.delete(pickupId);
      }
    });

    gameState.healthPickups.forEach((pickup, pickupId) => {
      const dx = pickup.x - playerData.x;
      const dy = pickup.y - playerData.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= pickup.radius + playerData.radius) {
        playerData.health = Math.min(playerData.maxHealth, playerData.health + pickup.amount);
        gameState.healthPickups.delete(pickupId);
      }
    });
  });

  // 7) Game Over si todos los jugadores mueren
  const alivePlayers = Array.from(gameState.players.values()).filter(p => p.health > 0);
  if (alivePlayers.length === 0 && gameState.players.size > 0) {
    gameState.gameOver = true;
    io.emit('game_event', { type: 'game_over', score: gameState.score, wave: gameState.currentWave });
    console.log('[GAME] Game Over!');
    return;
  }

  // 8) Sistema de oleadas
  if (gameState.enemies.size === 0 && gameState.spawnQueue.length === 0 && !gameState.betweenWaves) {
    gameState.betweenWaves = true;
    gameState.betweenWaveTimer = 0;
    console.log(`[GAME] Wave ${gameState.currentWave} completed!`);
    io.emit('game_event', { 
      type: 'wave_complete', 
      wave: gameState.currentWave,
      message: `Wave ${gameState.currentWave} Over`
    });
  } else if (gameState.enemies.size > 0 && Math.random() < 0.01) {
    // DEBUG: Mostrar enemigos vivos ocasionalmente
    console.log(`[DEBUG] ${gameState.enemies.size} enemies alive`);
    gameState.enemies.forEach((e, id) => {
      console.log(`  Enemy ${id}: (${Math.round(e.x)}, ${Math.round(e.y)}) HP: ${e.health}`);
    });
  }

  if (gameState.betweenWaves) {
    gameState.betweenWaveTimer += dt;
    if (gameState.betweenWaveTimer >= GAME_CONFIG.betweenWaveDelay) {
      gameState.betweenWaves = false;
      gameState.currentWave += 1;
      console.log(`[GAME] Starting wave ${gameState.currentWave}...`);
      spawnWave(gameState.currentWave);
      io.emit('game_event', { 
        type: 'wave_start', 
        wave: gameState.currentWave,
        message: `Round ${gameState.currentWave}`
      });
    }
  }
}

function broadcastGameState() {
  // Crear estado compacto para enviar a clientes
  const compactState = {
    players: Array.from(gameState.players.entries()).map(([id, p]) => ({
      id,
      x: Math.round(p.x),
      y: Math.round(p.y),
      angle: p.angle,
      health: p.health,
      maxHealth: p.maxHealth,
      ammo: p.ammo,
      reserveAmmo: p.reserveAmmo,
      isReloading: p.isReloading,
      isMoving: p.isMoving,
    })),
    bullets: Array.from(gameState.bullets.values()).map(b => ({
      id: b.id,
      x: Math.round(b.x),
      y: Math.round(b.y),
    })),
    enemies: Array.from(gameState.enemies.values()).map(e => ({
      id: e.id,
      x: Math.round(e.x),
      y: Math.round(e.y),
      typeId: e.typeId,
      health: e.health,
      maxHealth: e.maxHealth,
      radius: e.radius,
      animFrame: e.animFrame || 0,
      animFacing: e.animFacing || 'down',
    })),
    ammoPickups: Array.from(gameState.ammoPickups.values()).map(p => ({
      id: p.id, x: Math.round(p.x), y: Math.round(p.y), radius: p.radius
    })),
    healthPickups: Array.from(gameState.healthPickups.values()).map(p => ({
      id: p.id, x: Math.round(p.x), y: Math.round(p.y), radius: p.radius
    })),
    currentWave: gameState.currentWave,
    score: gameState.score,
    betweenWaves: gameState.betweenWaves,
  };

  io.emit('game_state', compactState);
}

// ========================================
// MANEJO DE CONEXIONES (Socket.IO)
// ========================================
io.on('connection', (socket) => {
  console.log(`[NETWORK] Player connected: ${socket.id}`);

  // Contar jugadores conectados
  const connectedCount = io.engine.clientsCount;

  // Enviar estado inicial al jugador
  socket.emit('init_state', {
    playerId: socket.id,
    gameStarted: gameState.gameStarted,
    currentWave: gameState.currentWave,
    score: gameState.score,
    connectedCount: connectedCount, // Enviar conteo actual
  });

  // Notificar a TODOS sobre jugadores conectados (en lobby)
  io.emit('lobby_update', {
    playerCount: connectedCount
  });

  socket.on('join_game', () => {
    console.log(`[NETWORK] Player ${socket.id} joined the game`);

    // Iniciar juego si es el primer jugador (ANTES de agregarlo)
    if (!gameState.gameStarted) {
      initGame();
    }

    // Crear jugador en posiciones aleatorias
    const spawnX = MARGIN + 100 + Math.random() * (CANVAS_WIDTH - 2 * MARGIN - 200);
    const spawnY = MARGIN + 100 + Math.random() * (CANVAS_HEIGHT - 2 * MARGIN - 200);

    gameState.players.set(socket.id, {
      id: socket.id,
      x: spawnX,
      y: spawnY,
      radius: GAME_CONFIG.playerRadius,
      angle: 0,
      health: GAME_CONFIG.playerMaxHealth,
      maxHealth: GAME_CONFIG.playerMaxHealth,
      ammo: GAME_CONFIG.magSize,
      magSize: GAME_CONFIG.magSize,
      reserveAmmo: GAME_CONFIG.initialReserveAmmo,
      isReloading: false,
      reloadTimer: 0,
      timeSinceLastShot: 0,
      isMoving: false,
    });

    playerInputs.set(socket.id, {
      keys: {},
      mousePos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      shooting: false,
    });

    // Notificar a todos
    io.emit('player_joined', {
      playerId: socket.id,
      playerCount: gameState.players.size,
    });
  });

  socket.on('player_input', (input) => {
    if (!playerInputs.has(socket.id)) return;
    playerInputs.set(socket.id, input);
  });

  socket.on('player_reload', () => {
    const playerData = gameState.players.get(socket.id);
    if (playerData && !playerData.isReloading && playerData.reserveAmmo > 0) {
      playerData.isReloading = true;
      playerData.reloadTimer = 0;
    }
  });

  socket.on('disconnect', () => {
    console.log(`[NETWORK] Player disconnected: ${socket.id}`);
    gameState.players.delete(socket.id);
    playerInputs.delete(socket.id);

    io.emit('player_left', {
      playerId: socket.id,
      playerCount: gameState.players.size,
    });

    // Actualizar lobby
    const connectedCount = io.engine.clientsCount;
    io.emit('lobby_update', {
      playerCount: connectedCount
    });

    // Reiniciar si no quedan jugadores
    if (gameState.players.size === 0) {
      gameState.gameStarted = false;
      gameState.gameOver = false;
      console.log('[GAME] All players left, game reset');
    }
  });
});

server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`PORT ZERO - Server Running`);
  console.log(`Port: ${PORT}`);
  console.log(`========================================`);
  console.log(`IMPORTANTE: Para jugar desde distintas casas/redes:`);
  console.log(`1. Desplegar en Railway/Render (recomendado)`);
  console.log(`2. O usar VPN (Tailscale/ZeroTier)`);
  console.log(`========================================`);
});
