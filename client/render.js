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

function drawPlayer() {
  // Modo multijugador: dibujar todos los jugadores CON SPRITES
  if (isConnected && players.size > 0) {
    players.forEach((playerData, playerId) => {
      if (!playerData || typeof playerData.x === 'undefined' || typeof playerData.y === 'undefined') {
        console.warn('[RENDER] playerData inválido:', playerId, playerData);
        return;
      }

      const isLocal = playerId === localPlayerId;
      
      // Si el jugador está muerto, dibujar sangre en lugar del sprite
      if (playerData.health <= 0 && bloodSpriteImage) {
        const bloodCfg = SPRITE_CONFIG.blood;
        const scale = bloodCfg.scale || 0.5;
        const width = bloodSpriteImage.width * scale;
        const height = bloodSpriteImage.height * scale;
        
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.drawImage(
          bloodSpriteImage,
          playerData.x - width / 2,
          playerData.y - height / 2,
          width,
          height
        );
        ctx.restore();
        return; // No dibujar el sprite del jugador
      }
      
      // Dibujar sprite del jugador (igual que single-player)
      if (playerSpriteImage) {
        const cfg = SPRITE_CONFIG.player;
        const fw = cfg.frameWidth;
        const fh = cfg.frameHeight;
        const cols = cfg.sheetCols;
        const scale = cfg.scale;

        // Usar animación si existe, sino frame 0
        const animFacing = playerData.animFacing || 0;
        let dirFrames = cfg.frames.down;
        switch (animFacing) {
          case 1: dirFrames = cfg.frames.left;  break;
          case 2: dirFrames = cfg.frames.right; break;
          case 3: dirFrames = cfg.frames.up;    break;
          default: dirFrames = cfg.frames.down; break;
        }

        const animFrame = playerData.animFrame || 0;
        const frameIndex = dirFrames[animFrame % dirFrames.length];

        const sx = (frameIndex % cols) * fw;
        const sy = Math.floor(frameIndex / cols) * fh;

        const dw = fw * scale;
        const dh = fh * scale;

        ctx.save();
        ctx.translate(playerData.x, playerData.y);
        ctx.drawImage(
          playerSpriteImage,
          sx, sy, fw, fh,
          -dw / 2, -dh / 2, dw, dh
        );
        ctx.restore();
      } else {
        // Fallback: círculo si no hay sprite
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(playerData.x, playerData.y, playerData.radius || 22, 0, Math.PI * 2);
        ctx.fill();
      }

      // Indicador de jugador local (flecha verde apuntando hacia abajo)
      if (isLocal) {
        const offset = (playerData.radius || 22) + 15; // Distancia arriba del jugador
        ctx.fillStyle = '#22c55e';
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        
        ctx.save();
        ctx.translate(playerData.x, playerData.y - offset);
        
        // Dibujar flecha apuntando hacia abajo
        ctx.beginPath();
        ctx.moveTo(0, 8);        // Punta de la flecha
        ctx.lineTo(-5, 0);       // Lado izquierdo
        ctx.lineTo(-2, 0);       // Parte interna izquierda
        ctx.lineTo(-2, -6);      // Línea izquierda hacia arriba
        ctx.lineTo(2, -6);       // Línea superior
        ctx.lineTo(2, 0);        // Línea derecha hacia abajo
        ctx.lineTo(5, 0);        // Parte interna derecha
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      }
    });
    return;
  }

  // Modo single-player: dibujar solo player
  if (!player) return;

  if (!playerSpriteImage) {
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const cfg = SPRITE_CONFIG.player;
  const fw = cfg.frameWidth;
  const fh = cfg.frameHeight;
  const cols = cfg.sheetCols;
  const scale = cfg.scale;

  let dirFrames = cfg.frames.down;
  switch (player.animFacing) {
    case 1: dirFrames = cfg.frames.left;  break;
    case 2: dirFrames = cfg.frames.right; break;
    case 3: dirFrames = cfg.frames.up;    break;
    default: dirFrames = cfg.frames.down; break;
  }

  const animFrames = dirFrames;
  const frameIndex = animFrames[player.animFrame % animFrames.length];

  const sx = (frameIndex % cols) * fw;
  const sy = Math.floor(frameIndex / cols) * fh;

  const dw = fw * scale;
  const dh = fh * scale;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.drawImage(
    playerSpriteImage,
    sx, sy, fw, fh,
    -dw / 2, -dh / 2, dw, dh
  );
  ctx.restore();
}


function drawBullets() {
  ctx.fillStyle = '#facc15';
  bullets.forEach((b) => {
    const radius = b.radius || 4; // Fallback a 4 si no tiene radius
    ctx.beginPath();
    ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function getEnemySpriteImageAndConfig(enemy) {
  // El servidor envía typeId directamente (1, 2, 3, 4)
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
  enemies.forEach((enemy) => {
    const spriteData = getEnemySpriteImageAndConfig(enemy);

    // Intentar usar sprite si está disponible
    if (spriteData && spriteData.img) {
      drawEnemySprite(enemy, spriteData.img, spriteData.cfg);
      return;
    }

    // Fallback: enemigo sin sprite -> círculo con color según typeId
    const colors = ['#888888', '#ff5555', '#ffaa00', '#aa55ff', '#ff0000']; // índice 0 vacío, 1-4 tipos
    ctx.fillStyle = colors[enemy.typeId] || '#ff0000';
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}


function drawHUD() {
  // Obtener datos del jugador (multijugador o singleplayer)
  let playerData = player;
  if (isConnected && localPlayerId) {
    playerData = players.get(localPlayerId);
  }
  
  if (!playerData) return;

  ctx.font = '16px Arial';
  ctx.textAlign = 'left';

  ctx.fillStyle = '#e5e7eb';
  ctx.fillText(
    `HP: ${Math.max(0, Math.floor(playerData.health))}/${playerData.maxHealth}`,
    20,
    24
  );

  const barX = 20;
  const barY = 32;
  const barWidth = 200;
  const barHeight = 10;
  const ratio = clamp(playerData.health / playerData.maxHealth, 0, 1);

  ctx.fillStyle = '#4b5563';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  ctx.fillStyle = '#22c55e';
  ctx.fillRect(barX, barY, barWidth * ratio, barHeight);

  ctx.fillStyle = '#e5e7eb';
  const ammoText = playerData.isReloading
    ? 'Reloading...'
    : `Ammo: ${playerData.ammo}/${playerData.reserveAmmo}`;
  ctx.fillText(ammoText, 20, 60);

  ctx.fillText(`Wave: ${currentWave}`, 20, 86);
  ctx.fillText(`Score: ${score}`, 20, 112);
  ctx.fillText(`Enemies: ${enemies.length}`, 20, 138);
  
  if (isConnected) {
    ctx.fillText(`Players: ${players.size}`, 20, 164);
  }

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

function drawMenu() {
  drawBackground();

  ctx.fillStyle = '#e5e7eb';
  ctx.textAlign = 'center';

  ctx.font = 'bold 48px Arial';
  ctx.fillText('PORT ZERO', canvas.width / 2, canvas.height / 2 - 60);

  ctx.font = '22px Arial';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(
    'Survival Shooter Multijugador',
    canvas.width / 2,
    canvas.height / 2 - 10
  );

  // Estado de conexión
  if (isConnected) {
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('✓ CONECTADO', canvas.width / 2, canvas.height / 2 + 40);
    
    ctx.fillStyle = '#fbbf24';
    ctx.font = '20px Arial';
    ctx.fillText(
      'Presiona ENTER para ir al LOBBY',
      canvas.width / 2,
      canvas.height / 2 + 80
    );
  } else {
    ctx.fillStyle = '#ef4444';
    ctx.font = '18px Arial';
    ctx.fillText('Conectando al servidor...', canvas.width / 2, canvas.height / 2 + 40);
  }

  ctx.fillStyle = '#64748b';
  ctx.font = '16px Arial';
  ctx.fillText(
    'WASD - Mover | Mouse - Apuntar | Click - Disparar | R - Recargar',
    canvas.width / 2,
    canvas.height / 2 + 140
  );

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

function drawLobby() {
  drawBackground();
  drawWalls();

  // Panel del lobby
  ctx.fillStyle = 'rgba(15,23,42,0.95)';
  const panelWidth = 600;
  const panelHeight = 450;
  const panelX = canvas.width / 2 - panelWidth / 2;
  const panelY = canvas.height / 2 - panelHeight / 2;
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

  // Título
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('LOBBY', canvas.width / 2, panelY + 60);

  // Contador
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '24px Arial';
  ctx.fillText(
    `${connectedPlayersCount}/4 Jugadores`,
    canvas.width / 2,
    panelY + 110
  );

  // Lista de jugadores
  if (lobbyPlayers && lobbyPlayers.length > 0) {
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    
    const listStartY = panelY + 160;
    const lineHeight = 35;
    
    lobbyPlayers.forEach((player, index) => {
      const y = listStartY + index * lineHeight;
      const isMe = player.id === localPlayerId;
      
      // Número
      ctx.fillStyle = '#64748b';
      ctx.fillText(`${index + 1}.`, panelX + 80, y);
      
      // Nombre/ID (primeros 8 caracteres)
      const playerName = isMe ? 'TÚ' : `Player ${index + 1}`;
      ctx.fillStyle = isMe ? '#fbbf24' : '#e5e7eb';
      ctx.fillText(playerName, panelX + 120, y);
      
      // Estado LISTO
      if (player.ready) {
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('✓ LISTO', panelX + 350, y);
        ctx.font = '20px Arial';
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('Esperando...', panelX + 350, y);
      }
    });
  }

  // Instrucciones
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '18px Arial';
  
  const myPlayer = lobbyPlayers.find(p => p.id === localPlayerId);
  const myReady = myPlayer ? myPlayer.ready : false;
  
  if (!myReady) {
    ctx.fillText(
      'Presiona ENTER para marcar como LISTO',
      canvas.width / 2,
      panelY + panelHeight - 50
    );
  } else {
    ctx.fillText(
      'Esperando a los demás jugadores...',
      canvas.width / 2,
      panelY + panelHeight - 70
    );
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Arial';
    ctx.fillText(
      '(Presiona ENTER de nuevo para cancelar)',
      canvas.width / 2,
      panelY + panelHeight - 40
    );
  }

  ctx.textAlign = 'left';
}

function drawBigMessage(dt) {
  if (!bigMessage) return;

  bigMessage.elapsed += dt;
  const alpha = 1 - (bigMessage.elapsed / bigMessage.duration);
  
  if (alpha <= 0) {
    bigMessage = null;
    return;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(bigMessage.text, canvas.width / 2, canvas.height / 2 - 100);
  ctx.restore();
}

function showBigMessage(text, duration = 2) {
  bigMessage = { text, duration, elapsed: 0 };
}

function render() {
  try {
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
    
    const dt = (performance.now() - lastTime) / 1000 || 0.016;
    drawBigMessage(dt);
  } catch (error) {
    console.error('[RENDER] Error in render loop:', error);
    // Volver al menú si hay un error crítico
    currentState = GAME_STATE.MENU;
  }
}
