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
  if (!player) return;

  // Si todavía no cargó el sprite, dibujamos el círculo verde como fallback
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

  // Elegimos el arreglo de frames según hacia dónde mira
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
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function getEnemySpriteImageAndConfig(enemy) {
  if (enemy.type.id === ENEMY_TYPES.TYPE1.id) {
    return { img: enemy1SpriteImage, cfg: SPRITE_CONFIG.enemies.type1 };
  }
  if (enemy.type.id === ENEMY_TYPES.TYPE2.id) {
    return { img: enemy2SpriteImage, cfg: SPRITE_CONFIG.enemies.type2 };
  }
  if (enemy.type.id === ENEMY_TYPES.TYPE3.id) {
    return { img: enemy3SpriteImage, cfg: SPRITE_CONFIG.enemies.type3 };
  }
  if (enemy.type.id === ENEMY_TYPES.DEVIL.id) {
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

    if (spriteData && spriteData.img && enemy.spriteKey) {
      drawEnemySprite(enemy, spriteData.img, spriteData.cfg);
      return;
    }

    // Fallback: enemigo sin sprite -> círculo
    ctx.fillStyle = enemy.type.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}


function drawHUD() {
  if (!player) return;

  ctx.font = '16px Arial';
  ctx.textAlign = 'left';

  ctx.fillStyle = '#e5e7eb';
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

  ctx.fillText(`Wave: ${currentWave}`, 20, 86);
  ctx.fillText(`Score: ${score}`, 20, 112);

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

  ctx.font = '42px Arial';
  ctx.fillText('Port Zero', canvas.width / 2, canvas.height / 2 - 40);

  ctx.font = '20px Arial';
  ctx.fillText(
    'Top-down survival shooter (BoxHead style)',
    canvas.width / 2,
    canvas.height / 2
  );
  ctx.fillText(
    'WASD moverte, mouse apuntar, click disparar, R recargar',
    canvas.width / 2,
    canvas.height / 2 + 40
  );
  ctx.fillText(
    'ENTER para comenzar',
    canvas.width / 2,
    canvas.height / 2 + 80
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

function render() {
  if (currentState === GAME_STATE.MENU) {
    drawMenu();
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
}
