// Render

function drawBackground() {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const margin = 40;
  ctx.fillStyle = '#4d4d4d';
  ctx.fillRect(
    margin,
    margin,
    canvas.width - margin * 2,
    canvas.height - margin * 2
  );
}

function drawWalls() {
  ctx.fillStyle = '#0f172a';
  walls.forEach((wall) => {
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
  });
}

function drawAmmoPickups() {
  ammoPickups.forEach((pickup) => {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pickup.x - pickup.radius / 2, pickup.y);
    ctx.lineTo(pickup.x + pickup.radius / 2, pickup.y);
    ctx.stroke();
  });
}

function drawHealthPickups() {
  healthPickups.forEach((pickup) => {
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#bbf7d0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pickup.x - pickup.radius / 2, pickup.y);
    ctx.lineTo(pickup.x + pickup.radius / 2, pickup.y);
    ctx.moveTo(pickup.x, pickup.y - pickup.radius / 2);
    ctx.lineTo(pickup.x, pickup.y + pickup.radius / 2);
    ctx.stroke();
  });
}

// ========================================
// DRAW PLAYERS - Dibujar TODOS los jugadores (multijugador)
// ========================================
function drawPlayer() {
  if (players.size === 0) return;

  // Colores para distinguir jugadores
  const playerColors = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7'];
  let colorIndex = 0;

  players.forEach((playerData, playerId) => {
    const isLocal = playerId === localPlayerId;
    const color = playerColors[colorIndex % playerColors.length];
    colorIndex++;

    // Si todavía no cargó el sprite, dibujamos círculos de colores
    if (!playerSpriteImage) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(playerData.x, playerData.y, GAME_CONFIG.playerRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Borde para jugador local
      if (isLocal) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    } else {
      // Dibujar sprite
      const cfg = SPRITE_CONFIG.player;
      const fw = cfg.frameWidth;
      const fh = cfg.frameHeight;
      const cols = cfg.sheetCols;
      const scale = cfg.scale;

      // Frame por defecto (idle)
      const frameIndex = cfg.frames.down[0];

      const sx = (frameIndex % cols) * fw;
      const sy = Math.floor(frameIndex / cols) * fh;

      const dw = fw * scale;
      const dh = fh * scale;

      ctx.save();
      ctx.translate(playerData.x, playerData.y);
      
      // Aplicar tinte de color para distinguir jugadores
      if (!isLocal) {
        ctx.globalAlpha = 0.8;
      }
      
      ctx.drawImage(
        playerSpriteImage,
        sx, sy, fw, fh,
        -dw / 2, -dh / 2, dw, dh
      );
      
      ctx.restore();
    }

    // Dibujar ID del jugador encima
    ctx.fillStyle = isLocal ? '#ffffff' : color;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    const shortId = playerId.substring(0, 6);
    ctx.fillText(
      isLocal ? `YOU (${shortId})` : shortId,
      playerData.x,
      playerData.y - GAME_CONFIG.playerRadius - 8
    );

    // Barra de vida encima del nombre
    const barWidth = 40;
    const barHeight = 4;
    const barX = playerData.x - barWidth / 2;
    const barY = playerData.y - GAME_CONFIG.playerRadius - 20;
    
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    const healthRatio = playerData.health / playerData.maxHealth;
    ctx.fillStyle = healthRatio > 0.5 ? '#22c55e' : healthRatio > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
  });
  
  ctx.textAlign = 'left';
}


function drawBullets() {
  if (!bullets || bullets.length === 0) return;
  
  ctx.fillStyle = '#facc15';
  bullets.forEach((b) => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, GAME_CONFIG.bulletRadius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function getEnemySpriteImageAndConfig(enemy) {
  // Ahora usamos typeId en vez de type.id (datos del servidor)
  if (enemy.typeId === 1) {
    return { img: enemy1SpriteImage, cfg: SPRITE_CONFIG.enemies.type1 };
  }
  if (enemy.typeId === 2) {
    return { img: enemy2SpriteImage, cfg: SPRITE_CONFIG.enemies.type2 };
  }
  if (enemy.typeId === 3) {
    return { img: enemy3SpriteImage, cfg: SPRITE_CONFIG.enemies.type3 };
  }
  if (enemy.typeId === 4) {
    return { img: enemyDevilSpriteImage, cfg: SPRITE_CONFIG.enemies.devil };
  }
  return null;
}

function drawEnemySprite(enemy, img, cfg) {
  if (!img || !cfg) return;

  const fw = cfg.frameWidth;
  const fh = cfg.frameHeight;
  const cols = cfg.sheetCols;
  const scale = cfg.scale;

  const facing = enemy.animFacing || 'down';
  const frames = cfg.frames[facing] || cfg.frames.down;
  const frameIndex = frames[enemy.animFrame % frames.length];

  const sx = (frameIndex % cols) * fw;
  const sy = Math.floor(frameIndex / cols) * fh;

  const dw = fw * scale;
  const dh = fh * scale;

  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.drawImage(
    img,
    sx, sy, fw, fh,
    -dw / 2, -dh / 2, dw, dh
  );
  ctx.restore();
}

function drawEnemies() {
  if (!enemies || enemies.length === 0) return;

  // Colores por tipo (sincronizado con servidor)
  const enemyColors = {
    1: '#ef4444', // TYPE1
    2: '#fb923c', // TYPE2
    3: '#f97316', // TYPE3
    4: '#a855f7', // DEVIL
  };

  enemies.forEach((enemy) => {
    const spriteData = getEnemySpriteImageAndConfig(enemy);

    if (spriteData && spriteData.img) {
      drawEnemySprite(enemy, spriteData.img, spriteData.cfg);
    } else {
      // Fallback: enemigo sin sprite -> círculo
      const color = enemyColors[enemy.typeId] || '#ef4444';
      const radius = enemy.typeId === 4 ? 28 : 18;
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Barra de vida (siempre mostrar)
    const radius = enemy.typeId === 4 ? 28 : 18;
    const barWidth = 30;
    const barHeight = 3;
    const barX = enemy.x - barWidth / 2;
    const barY = enemy.y - radius - 8;
    
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    const healthRatio = enemy.health / enemy.maxHealth;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
  });
}


// ========================================
// HUD - Adaptado para Multijugador
// ========================================
function drawHUD() {
  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e5e7eb';

  // Estado de conexión
  if (!isConnected) {
    ctx.fillText('Disconnected from server', 20, 24);
    return;
  }

  // Información del jugador local
  if (player) {
    ctx.fillText(
      `HP: ${Math.max(0, Math.floor(player.health))}/${player.maxHealth}`,
      20,
      24
    );

    const barX = 20;
    const barY = 32;
    const barWidth = 200;
    const barHeight = 10;
    const ratio = clamp(player.health / player.maxHealth, 0, 1);

    ctx.fillStyle = '#4b5563';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(barX, barY, barWidth * ratio, barHeight);

    ctx.fillStyle = '#e5e7eb';
    const ammoText = player.isReloading
      ? 'Reloading...'
      : `Ammo: ${player.ammo}/${player.reserveAmmo}`;
    ctx.fillText(ammoText, 20, 60);
  } else {
    ctx.fillText('Waiting to spawn...', 20, 24);
  }

  // Información global del juego
  ctx.fillText(`Wave: ${currentWave}`, 20, 86);
  ctx.fillText(`Score: ${score}`, 20, 112);
  ctx.fillText(`Enemies: ${enemies.length}`, 20, 138);
  ctx.fillText(`Players: ${players.size}/${NETWORK_CONFIG.MAX_PLAYERS}`, 20, 164);

  if (betweenWaves) {
    ctx.textAlign = 'center';
    ctx.fillText(
      'Preparing next wave...',
      canvas.width / 2,
      40
    );
    ctx.textAlign = 'left';
  }
}

function drawBigMessage() {
  if (!bigMessage) return;
  
  const now = performance.now();
  if (now >= bigMessage.endTime) {
    bigMessage = null;
    return;
  }
  
  // Fade out en el último segundo
  const timeLeft = bigMessage.endTime - now;
  const alpha = timeLeft < 1000 ? timeLeft / 1000 : 1;
  
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Sombra
  ctx.fillStyle = '#000000';
  ctx.fillText(bigMessage.text, canvas.width / 2 + 3, canvas.height / 2 + 3);
  
  // Texto principal
  ctx.fillStyle = '#ffffff';
  ctx.fillText(bigMessage.text, canvas.width / 2, canvas.height / 2);
  
  ctx.restore();
}

// ========================================
// LOBBY - Sala de espera
// ========================================
function drawLobby() {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#e5e7eb';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('LOBBY', canvas.width / 2, 120);

  // Panel de jugadores
  const panelWidth = 400;
  const panelHeight = 200;
  const panelX = (canvas.width - panelWidth) / 2;
  const panelY = 200;

  // Fondo del panel
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
  
  // Borde del panel
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 3;
  ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

  // Texto de jugadores conectados
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Arial';
  ctx.fillText(
    `${connectedPlayersCount}/${NETWORK_CONFIG.MAX_PLAYERS} Jugadores`,
    canvas.width / 2,
    panelY + 80
  );

  // Instrucción
  ctx.font = '20px Arial';
  ctx.fillStyle = '#94a3b8';
  const instruction = connectedPlayersCount >= 1 
    ? 'Presiona ENTER para iniciar'
    : 'Esperando jugadores...';
  ctx.fillText(instruction, canvas.width / 2, panelY + 140);

  // Información adicional
  ctx.font = '16px Arial';
  ctx.fillStyle = '#64748b';
  ctx.fillText(
    'Otros jugadores pueden unirse desde localhost:4000',
    canvas.width / 2,
    canvas.height - 40
  );
}

// ========================================
// MENU - Adaptado para Multijugador en Línea
// ========================================
function drawMenu() {
  drawBackground();

  ctx.fillStyle = '#e5e7eb';
  ctx.textAlign = 'center';

  ctx.font = '42px Arial';
  ctx.fillText('Port Zero', canvas.width / 2, canvas.height / 2 - 80);

  ctx.font = '20px Arial';
  ctx.fillText(
    'Multijugador en Línea (2-4 jugadores)',
    canvas.width / 2,
    canvas.height / 2 - 40
  );
  
  // Estado de conexión
  ctx.font = '18px Arial';
  if (isConnected) {
    ctx.fillStyle = '#22c55e';
    ctx.fillText(
      `✓ Conectado al servidor`,
      canvas.width / 2,
      canvas.height / 2
    );
    
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '16px Arial';
    ctx.fillText(
      'WASD - Mover | Mouse - Apuntar | Click - Disparar | R - Recargar',
      canvas.width / 2,
      canvas.height / 2 + 40
    );
    
    ctx.font = '22px Arial';
    ctx.fillStyle = '#22c55e';
    ctx.fillText(
      'Presiona ENTER para unirte a la partida',
      canvas.width / 2,
      canvas.height / 2 + 80
    );
  } else {
    ctx.fillStyle = '#ef4444';
    ctx.fillText(
      '✗ Conectando al servidor...',
      canvas.width / 2,
      canvas.height / 2
    );
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Arial';
    ctx.fillText(
      `Server: ${NETWORK_CONFIG.SERVER_URL}`,
      canvas.width / 2,
      canvas.height / 2 + 30
    );
  }

  ctx.textAlign = 'left';
}

function drawGameOver() {
  drawBackground();
  drawWalls();
  drawPlayer();
  drawEnemies();
  drawBullets();
  drawAmmoPickups();
  drawHealthPickups();
  drawHUD();

  ctx.fillStyle = 'rgba(15,23,42,0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#fee2e2';
  ctx.textAlign = 'center';

  ctx.font = '40px Arial';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = '22px Arial';
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 16);
  ctx.fillText(
    'ENTER para reiniciar',
    canvas.width / 2,
    canvas.height / 2 + 52
  );

  ctx.textAlign = 'left';
}

function render() {
  if (currentState === GAME_STATE.MENU) {
    drawMenu();
    return;
  }

  if (currentState === GAME_STATE.LOBBY) {
    drawLobby();
    return;
  }

  if (currentState === GAME_STATE.GAME_OVER) {
    drawGameOver();
    return;
  }

  drawBackground();
  drawWalls();
  drawPlayer();
  drawBullets();
  drawEnemies();
  drawAmmoPickups();
  drawHealthPickups();
  drawHUD();
  drawBigMessage();
}
