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

// Sistema de lobby y jugadores listos
const lobbyPlayers = new Map(); // Map<socketId, {ready: boolean, name: string}>

// Buffer de inputs de cada jugador
const playerInputs = new Map(); // Map<socketId, {keys, mousePos, shooting}>

// Walls (copiadas del cliente)
// Walls (mismo layout que en client/map.js)

const walls = [
  // ---------------------------------------------------------
  // BORDES DEL ÁREA JUGABLE (RECUADRO NEGRO)
  // ---------------------------------------------------------
  { x: 0, y: 0, width: CANVAS_WIDTH, height: MARGIN },                           // Superior
  { x: 0, y: CANVAS_HEIGHT - MARGIN, width: CANVAS_WIDTH, height: MARGIN },      // Inferior
  { x: 0, y: 0, width: MARGIN, height: CANVAS_HEIGHT },                          // Izquierda
  { x: CANVAS_WIDTH - MARGIN, y: 0, width: MARGIN, height: CANVAS_HEIGHT },      // Derecha

  // ---------------------------------------------------------
  // PRIMERA FILA (verticales pequeñas arriba dentro del área jugable)
  // ---------------------------------------------------------
  //{ x: 98,  y: 110, width: 11, height: 50 },
  { x: 235, y: 60, width: 35, height: 70 },
  { x: 425, y: 60, width: 35, height: 70 },
  { x: 642, y: 60, width: 35, height: 70 },

  // ---------------------------------------------------------
  // SEGUNDA FILA (horizontales largas, fila 2)
  // ---------------------------------------------------------
  { x: 193, y: 175, width: 125, height: 54 },
  { x: 450, y: 175, width: 379, height: 54 },

  // ---------------------------------------------------------
  // TERCERA FILA (horizontales medianas en el centro)
  // ---------------------------------------------------------
  { x: 258, y: 280, width: 125, height: 54 },
  { x: 640, y: 280, width: 125, height: 54 },

  // ---------------------------------------------------------
  // CUARTA FILA (horizontales largas, fila 4)
  // ---------------------------------------------------------
  { x: 193, y: 387, width: 125, height: 54 },
  { x: 450, y: 387, width: 125, height: 54 },
  { x: 705, y: 387, width: 125, height: 54 },

  // ---------------------------------------------------------
  // QUINTA FILA (verticales pequeñas abajo dentro del área jugable)
  // ---------------------------------------------------------
  { x: 262, y: 490, width: 53, height: 85 },
  { x: 400, y: 490, width: 53, height: 85 },
  { x: 580, y: 490, width: 53, height: 85 },
  { x: 710, y: 490, width: 53, height: 85 }
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
  console.log('[INIT] Resetting game state...');
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
  
  console.log('[INIT] Spawning wave 1...');
  spawnWave(1);
  console.log(`[INIT] Game initialized. Enemies: ${gameState.enemies.size}, Started: ${gameState.gameStarted}, GameOver: ${gameState.gameOver}`);
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

  // En la ronda 1, spawnear todos los enemigos inmediatamente
  if (waveNumber === 1) {
    gameState.spawnQueue = [];
    // Spawnear todos los enemigos de tipo 1 inmediatamente
    for (let i = 0; i < numType1; i++) {
      const { x, y } = getRandomEdgeSpawn();
      const enemyId = gameState.nextEnemyId++;
      gameState.enemies.set(enemyId, {
        id: enemyId,
        x, y,
        typeId: ENEMY_TYPES.TYPE1.id,
        speed: ENEMY_TYPES.TYPE1.speed,
        radius: ENEMY_TYPES.TYPE1.radius,
        health: ENEMY_TYPES.TYPE1.maxHealth,
        maxHealth: ENEMY_TYPES.TYPE1.maxHealth,
        damage: ENEMY_TYPES.TYPE1.damage,
        score: ENEMY_TYPES.TYPE1.score,
        attackCooldown: 0,
        animFrame: 0,
        animFacing: 'down',
        animTimer: 0,
      });
    }
    console.log(`[GAME] Wave 1 started: ${numType1} enemies spawned immediately`);
  } else {
    // Rondas 2+: spawn progresivo como antes
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

function cleanupDeadPlayers() {
  // Eliminar jugadores muertos DESPUÉS de que broadcastGameState() haya enviado su estado final
  Object.keys(gameState.players).forEach(playerId => {
    const playerData = gameState.players[playerId];
    if (playerData.health <= 0) {
      console.log(`[CLEANUP] Removing dead player ${playerId}`);
      delete gameState.players[playerId];
      delete playerInputs[playerId];
      io.emit('player_died', { playerId });
    }
  });
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
  
  // DESPUÉS de enviar el estado, eliminar jugadores muertos
  cleanupDeadPlayers();
}, TICK_INTERVAL);

function updateGame(dt) {
  // 1) Procesar inputs de jugadores
  gameState.players.forEach((playerData, playerId) => {
    const input = playerInputs.get(playerId);
    if (!input) return;

    // Movimiento
    let dx = 0, dy = 0;
    if (input.keys.w || input.keys['w']) dy -= 1;
    if (input.keys.s || input.keys['s']) dy += 1;
    if (input.keys.a || input.keys['a']) dx -= 1;
    if (input.keys.d || input.keys['d']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      playerData.x += dx * GAME_CONFIG.playerSpeed * dt;
      playerData.y += dy * GAME_CONFIG.playerSpeed * dt;
    }

    // Límites del área jugable
    playerData.x = clamp(playerData.x, MARGIN + playerData.radius, CANVAS_WIDTH - MARGIN - playerData.radius);
    playerData.y = clamp(playerData.y, MARGIN + playerData.radius, CANVAS_HEIGHT - MARGIN - playerData.radius);

    // Colisiones con paredes
    for (const wall of walls) {
      resolveCircleRectCollision(playerData, wall);
    }

    // Ángulo hacia el mouse
    playerData.angle = Math.atan2(input.mousePos.y - playerData.y, input.mousePos.x - playerData.x);

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

    // Disparo
    playerData.timeSinceLastShot += dt;
    if (input.shooting && !playerData.isReloading && playerData.ammo > 0) {
      const minDelay = 1 / GAME_CONFIG.fireRate;
      if (playerData.timeSinceLastShot >= minDelay) {
        const bulletId = gameState.nextBulletId++;
        const dirX = Math.cos(playerData.angle);
        const dirY = Math.sin(playerData.angle);
        
        gameState.bullets.set(bulletId, {
          id: bulletId,
          x: playerData.x + dirX * (playerData.radius + 4),
          y: playerData.y + dirY * (playerData.radius + 4),
          vx: dirX * GAME_CONFIG.bulletSpeed,
          vy: dirY * GAME_CONFIG.bulletSpeed,
          life: 0,
          radius: GAME_CONFIG.bulletRadius,
        });
        
        playerData.ammo -= 1;
        playerData.timeSinceLastShot = 0;
        
        // Auto-recarga si se quedó sin balas y tiene munición de reserva
        if (playerData.ammo === 0 && playerData.reserveAmmo > 0) {
          playerData.isReloading = true;
          playerData.reloadTimer = GAME_CONFIG.reloadTime;
        }
      }
    }
    
    // Auto-recarga si intenta disparar sin balas y tiene munición de reserva
    if (input.shooting && !playerData.isReloading && playerData.ammo === 0 && playerData.reserveAmmo > 0) {
      playerData.isReloading = true;
      playerData.reloadTimer = GAME_CONFIG.reloadTime;
    }
  });

  // 2) Actualizar balas
  gameState.bullets.forEach((bullet, bulletId) => {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life += dt;

    if (bullet.life >= GAME_CONFIG.bulletLife || 
        bullet.x < -50 || bullet.x > CANVAS_WIDTH + 50 ||
        bullet.y < -50 || bullet.y > CANVAS_HEIGHT + 50) {
      gameState.bullets.delete(bulletId);
      return;
    }

    // Colisiones con paredes
    for (const wall of walls) {
      if (circleRectIntersects(bullet.x, bullet.y, bullet.radius, wall)) {
        gameState.bullets.delete(bulletId);
        return;
      }
    }

    // Colisiones con enemigos
    gameState.enemies.forEach((enemy, enemyId) => {
      const dx = enemy.x - bullet.x;
      const dy = enemy.y - bullet.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= enemy.radius + bullet.radius) {
        enemy.health -= 20; // Daño de bala
        gameState.bullets.delete(bulletId);
        
        if (enemy.health <= 0) {
          gameState.score += enemy.score;
          maybeSpawnDrops(enemy.x, enemy.y);
          gameState.enemies.delete(enemyId);
        }
      }
    });
  });

  // 3) Spawnear enemigos de la cola
  if (gameState.spawnQueue.length > 0) {
    gameState.enemySpawnTimer -= dt;
    if (gameState.enemySpawnTimer <= 0) {
      const typeDef = gameState.spawnQueue.shift();
      const { x, y } = getRandomEdgeSpawn();
      const enemyId = gameState.nextEnemyId++;
      
      gameState.enemies.set(enemyId, {
        id: enemyId,
        x, y,
        typeId: typeDef.id,
        speed: typeDef.speed,
        radius: typeDef.radius,
        health: typeDef.maxHealth,
        maxHealth: typeDef.maxHealth,
        damage: typeDef.damage,
        score: typeDef.score,
        attackCooldown: 0,
        animFrame: 0,
        animFacing: 'down',
        animTimer: 0,
      });
      
      gameState.enemySpawnTimer = GAME_CONFIG.enemySpawnIntervalBase;
    }
  }

  // 4) Actualizar enemigos
  gameState.enemies.forEach((enemy) => {
    // Buscar jugador más cercano
    let nearestPlayer = null;
    let nearestDist = Infinity;
    gameState.players.forEach((p) => {
      if (p.health <= 0) return;
      const d = Math.hypot(p.x - enemy.x, p.y - enemy.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestPlayer = p;
      }
    });

    if (!nearestPlayer) return;

    // Mover hacia el jugador
    const dx = nearestPlayer.x - enemy.x;
    const dy = nearestPlayer.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    
    enemy.x += (dx / dist) * enemy.speed * dt;
    enemy.y += (dy / dist) * enemy.speed * dt;

    // Colisiones con paredes
    for (const wall of walls) {
      resolveCircleRectCollision(enemy, wall);
    }

    // Animación
    enemy.animTimer += dt;
    if (enemy.animTimer >= 0.15) {
      enemy.animFrame = (enemy.animFrame + 1) % 4;
      enemy.animTimer = 0;
    }
    
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx > absDy) {
      enemy.animFacing = dx > 0 ? 'right' : 'left';
    } else {
      enemy.animFacing = dy > 0 ? 'down' : 'up';
    }

    // Atacar jugador
    enemy.attackCooldown -= dt;
    const distToPlayer = Math.hypot(nearestPlayer.x - enemy.x, nearestPlayer.y - enemy.y);
    if (distToPlayer <= enemy.radius + nearestPlayer.radius) {
      if (enemy.attackCooldown <= 0) {
        nearestPlayer.health -= enemy.damage;
        enemy.attackCooldown = GAME_CONFIG.enemyAttackCooldown;
      }
    }
  });

  // 5) Recoger pickups
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

  // 5.5) La eliminación de jugadores muertos se hace en cleanupDeadPlayers() después de broadcastGameState()
  
  // 6) Oleadas
  if (gameState.enemies.size === 0 && gameState.spawnQueue.length === 0 && !gameState.betweenWaves) {
    gameState.betweenWaves = true;
    gameState.betweenWaveTimer = GAME_CONFIG.betweenWaveDelay;
    io.emit('game_event', { type: 'wave_complete', wave: gameState.currentWave });
  }

  if (gameState.betweenWaves) {
    gameState.betweenWaveTimer -= dt;
    if (gameState.betweenWaveTimer <= 0) {
      gameState.betweenWaves = false;
      gameState.currentWave++;
      spawnWave(gameState.currentWave);
      io.emit('game_event', { type: 'wave_start', wave: gameState.currentWave });
    }
  }

  // 7) Game Over
  const alivePlayers = Array.from(gameState.players.values()).filter(p => p.health > 0);
  if (alivePlayers.length === 0 && gameState.players.size > 0) {
    gameState.gameOver = true;
    gameState.gameStarted = false;
    
    // Resetear estados de "ready" para que puedan volver a jugar
    lobbyPlayers.forEach((lobbyPlayer) => {
      lobbyPlayer.ready = false;
    });
    
    io.emit('game_event', { type: 'game_over', score: gameState.score, wave: gameState.currentWave });
    console.log('[GAME] Game Over - Players returned to lobby');
  }
}

function broadcastGameState() {
  const compactState = {
    players: Array.from(gameState.players.values()).map(p => ({
      id: p.id,
      x: Math.round(p.x),
      y: Math.round(p.y),
      angle: p.angle,
      health: p.health,
      maxHealth: p.maxHealth,
      ammo: p.ammo,
      reserveAmmo: p.reserveAmmo,
      isReloading: p.isReloading,
      radius: p.radius,
    })),
    bullets: Array.from(gameState.bullets.values()).map(b => ({
      id: b.id,
      x: Math.round(b.x),
      y: Math.round(b.y),
      radius: b.radius,
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

  const connectedCount = io.engine.clientsCount;

  socket.emit('init_state', {
    playerId: socket.id,
    gameStarted: gameState.gameStarted,
    currentWave: gameState.currentWave,
    score: gameState.score,
    connectedCount: connectedCount,
  });

  io.emit('lobby_update', {
    playerCount: connectedCount
  });

  socket.on('join_lobby', () => {
    console.log(`[LOBBY] Player ${socket.id} joined lobby`);
    
    // Agregar al lobby
    lobbyPlayers.set(socket.id, {
      id: socket.id,
      ready: false,
    });
    
    // Enviar estado del lobby a todos
    broadcastLobbyState();
  });

  socket.on('player_ready', () => {
    console.log(`[LOBBY] Player ${socket.id} is ready`);
    
    const lobbyPlayer = lobbyPlayers.get(socket.id);
    if (lobbyPlayer) {
      lobbyPlayer.ready = true;
      broadcastLobbyState();
      
      // Verificar si todos están listos
      checkAllReady();
    }
  });

  socket.on('player_unready', () => {
    console.log(`[LOBBY] Player ${socket.id} is not ready`);
    
    const lobbyPlayer = lobbyPlayers.get(socket.id);
    if (lobbyPlayer) {
      lobbyPlayer.ready = false;
      broadcastLobbyState();
    }
  });

  socket.on('player_input', (input) => {
    if (!gameState.players.has(socket.id)) return;
    playerInputs.set(socket.id, input);
  });

  socket.on('player_reload', () => {
    const playerData = gameState.players.get(socket.id);
    if (!playerData) return;
    if (playerData.isReloading) return;
    if (playerData.ammo === playerData.magSize) return;
    if (playerData.reserveAmmo <= 0) return;
    
    playerData.isReloading = true;
    playerData.reloadTimer = 0;
  });

  socket.on('disconnect', () => {
    console.log(`[NETWORK] Player disconnected: ${socket.id}`);
    
    // Remover del lobby
    lobbyPlayers.delete(socket.id);
    
    // Remover del juego
    const wasInGame = gameState.players.has(socket.id);
    gameState.players.delete(socket.id);
    playerInputs.delete(socket.id);
    
    const connectedCount = io.engine.clientsCount;
    
    io.emit('player_left', {
      playerId: socket.id,
      playerCount: connectedCount,
    });
    
    broadcastLobbyState();
    
    console.log(`[NETWORK] Players remaining: ${connectedCount}`);
    
    // Si no quedan jugadores y el juego estaba activo, reiniciar para la próxima sesión
    if (connectedCount === 0 && gameState.gameStarted) {
      console.log('[GAME] No players left, resetting game state');
      gameState.gameStarted = false;
      gameState.gameOver = false;
      gameState.currentWave = 1;
      gameState.score = 0;
      gameState.enemies.clear();
      gameState.bullets.clear();
      gameState.ammoPickups.clear();
      gameState.healthPickups.clear();
      gameState.spawnQueue = [];
    }
  });
});

// ========================================
// FUNCIONES DEL LOBBY
// ========================================
function broadcastLobbyState() {
  const lobbyState = {
    players: Array.from(lobbyPlayers.values()),
    totalPlayers: lobbyPlayers.size,
    readyPlayers: Array.from(lobbyPlayers.values()).filter(p => p.ready).length,
  };
  
  io.emit('lobby_state', lobbyState);
  console.log(`[LOBBY] State: ${lobbyState.readyPlayers}/${lobbyState.totalPlayers} ready`);
}

function checkAllReady() {
  const totalPlayers = lobbyPlayers.size;
  const readyPlayers = Array.from(lobbyPlayers.values()).filter(p => p.ready).length;
  
  // Mínimo 1 jugador (para testing solo), máximo 4
  if (totalPlayers >= 1 && totalPlayers <= 4 && readyPlayers === totalPlayers) {
    console.log(`[LOBBY] All players ready! Starting game...`);
    startGame();
  }
}

function startGame() {
  console.log('[START] Starting new game...');
  
  // Iniciar el juego (limpia el estado y prepara la primera oleada)
  initGame();
  
  // Resetear el timer del game loop
  lastTickTime = Date.now();
  
  // LUEGO crear jugadores en el juego desde el lobby
  lobbyPlayers.forEach((lobbyPlayer, socketId) => {
    const spawnX = CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 200;
    const spawnY = CANVAS_HEIGHT / 2 + (Math.random() - 0.5) * 100;
    
    gameState.players.set(socketId, {
      id: socketId,
      x: spawnX,
      y: spawnY,
      angle: 0,
      radius: GAME_CONFIG.playerRadius,
      speed: GAME_CONFIG.playerSpeed,
      maxHealth: GAME_CONFIG.playerMaxHealth,
      health: GAME_CONFIG.playerMaxHealth,
      magSize: GAME_CONFIG.magSize,
      ammo: GAME_CONFIG.magSize,
      reserveAmmo: GAME_CONFIG.initialReserveAmmo,
      isReloading: false,
      reloadTimer: 0,
      timeSinceLastShot: 0,
    });
    
    playerInputs.set(socketId, {
      keys: {},
      mousePos: { x: spawnX, y: spawnY },
      shooting: false,
    });
  });
  
  // Notificar a todos que el juego comenzó
  io.emit('game_started');
  
  console.log(`[GAME] Game started with ${gameState.players.size} players`);
}

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
