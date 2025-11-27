// Clases: jugador, balas, enemigos, pickups

class Player {
  constructor(x, y) {
    const cfg = SPRITE_CONFIG.player;

    this.x = x;
    this.y = y;
    this.radius = GAME_CONFIG.playerRadius;
    this.speed = GAME_CONFIG.playerSpeed;
    this.angle = 0;

    this.maxHealth = GAME_CONFIG.playerMaxHealth;
    this.health = this.maxHealth;

    this.magSize = GAME_CONFIG.magSize;
    this.ammo = this.magSize;
    this.reserveAmmo = GAME_CONFIG.initialReserveAmmo;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.timeSinceLastShot = 0;

    // Animación
    this.animFrame = 0;
    this.animTimer = 0;
    this.animFrameCount = cfg.frames.down.length; // 2 frames por dirección
    // 0=down, 1=left, 2=right, 3=up
    this.animFacing = 0;
    this.isMoving = false;
  }

  update(dt) {
    let dx = 0;
    let dy = 0;

    if (keys.w || keys['w']) dy -= 1;
    if (keys.s || keys['s']) dy += 1;
    if (keys.a || keys['a']) dx -= 1;
    if (keys.d || keys['d']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;

      this.x += dx * this.speed * dt;
      this.y += dy * this.speed * dt;

      this.isMoving = true;

      // decidir hacia dónde mira según movimiento
      if (Math.abs(dx) > Math.abs(dy)) {
        this.animFacing = dx > 0 ? 2 : 1; // derecha / izquierda
      } else {
        this.animFacing = dy > 0 ? 0 : 3; // abajo / arriba
      }
    } else {
      this.isMoving = false;
    }

    // límites y colisiones con paredes
    this.x = clamp(this.x, this.radius, canvas.width - this.radius);
    this.y = clamp(this.y, this.radius, canvas.height - this.radius);

    for (const wall of walls) {
      resolveCircleRectCollision(this, wall);
    }

    // apuntar al mouse
    const mx = mousePos.x;
    const my = mousePos.y;
    this.angle = Math.atan2(my - this.y, mx - this.x);

    // timers
    this.timeSinceLastShot += dt;

    // recarga
    if (this.isReloading) {
      this.reloadTimer += dt;
      if (this.reloadTimer >= GAME_CONFIG.reloadTime) {
        this.isReloading = false;
        this.reloadTimer = 0;

        const needed = this.magSize - this.ammo;
        const toLoad = Math.min(needed, this.reserveAmmo);

        this.ammo += toLoad;
        this.reserveAmmo -= toLoad;
      }
    }

    if (this.ammo === 0 && !this.isReloading && this.reserveAmmo > 0) {
      this.startReload();
    }

    this.updateAnimation(dt);
  }


  tryShoot() {
    if (this.isReloading) return;
    if (this.ammo <= 0) return;

    const minDelay = 1 / GAME_CONFIG.fireRate;
    if (this.timeSinceLastShot < minDelay) return;

    const dirX = Math.cos(this.angle);
    const dirY = Math.sin(this.angle);

    const bullet = new Bullet(
      this.x + dirX * (this.radius + 4),
      this.y + dirY * (this.radius + 4),
      dirX * GAME_CONFIG.bulletSpeed,
      dirY * GAME_CONFIG.bulletSpeed
    );

    bullets.push(bullet);
    this.ammo -= 1;
    this.timeSinceLastShot = 0;
  }

  startReload() {
    if (this.isReloading) return;
    if (this.ammo === this.magSize) return;
    if (this.reserveAmmo <= 0) return;
    this.isReloading = true;
    this.reloadTimer = 0;
  }

  updateAnimation(dt) {
    const cfg = SPRITE_CONFIG.player;

    if (!this.isMoving) {
      this.animFrame = 0;
      this.animTimer = 0;
      return;
    }

    const frameDuration = 1 / cfg.animSpeed;
    this.animTimer += dt;

    const facingNames = ['down', 'left', 'right', 'up'];
    const dirName = facingNames[this.animFacing] || 'down';
    const frames = cfg.frames[dirName];
    const frameCount = frames.length;

    while (this.animTimer >= frameDuration) {
      this.animTimer -= frameDuration;
      this.animFrame = (this.animFrame + 1) % frameCount;
    }
  }

}

class Bullet {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = GAME_CONFIG.bulletRadius;
    this.life = 0;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life += dt;
  }

  isDead() {
    if (this.life >= GAME_CONFIG.bulletLife) return true;
    if (
      this.x < -50 ||
      this.x > canvas.width + 50 ||
      this.y < -50 ||
      this.y > canvas.height + 50
    ) {
      return true;
    }
    return false;
  }
}

class Enemy {
  constructor(x, y, typeDef) {
    this.x = x;
    this.y = y;
    this.type = typeDef;
    this.speed = typeDef.speed;
    this.radius = typeDef.radius;
    this.maxHealth = typeDef.maxHealth;
    this.health = typeDef.maxHealth;
    this.damage = typeDef.damage;
    this.attackCooldown = 0;
  }

  update(dt, player) {
    this.attackCooldown -= dt;

    const oldX = this.x;
    const oldY = this.y;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    const moveX = (dx / dist) * this.speed * dt;
    const moveY = (dy / dist) * this.speed * dt;

    this.x += moveX;
    this.y += moveY;

    for (const wall of walls) {
      resolveCircleRectCollision(this, wall);
    }

    const movedDist = Math.hypot(this.x - oldX, this.y - oldY);

    if (movedDist < 0.5) {
      const perp1 = { x: -dy / dist, y: dx / dist };
      const perp2 = { x: dy / dist, y: -dx / dist };

      const candidates = [];

      [perp1, perp2].forEach((p) => {
        const test = {
          x: oldX + p.x * this.speed * dt,
          y: oldY + p.y * this.speed * dt,
          radius: this.radius,
        };

        for (const wall of walls) {
          resolveCircleRectCollision(test, wall);
        }

        const dToPlayer = Math.hypot(player.x - test.x, player.y - test.y);
        candidates.push({ x: test.x, y: test.y, d: dToPlayer });
      });

      let best = candidates[0];
      if (candidates[1].d < best.d) best = candidates[1];

      this.x = best.x;
      this.y = best.y;
    }
  }

  tryAttack(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= this.radius + player.radius) {
      if (this.attackCooldown <= 0) {
        player.health -= this.damage;
        this.attackCooldown = GAME_CONFIG.enemyAttackCooldown;
      }
    }
  }

  isDead() {
    return this.health <= 0;
  }
}

class AmmoPickup {
  constructor(x, y, amount) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.amount = amount;
  }
}

class HealthPickup {
  constructor(x, y, amount) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.amount = amount;
  }
}
