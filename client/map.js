// Mapa, paredes y utilidades de colisión

// Laberinto para canvas 1024x640
const walls = [
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveCircleRectCollision(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);

  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const dist = Math.hypot(dx, dy);

  if (dist === 0 || dist >= circle.radius) return;

  const overlap = circle.radius - dist;
  const nx = dx / dist;
  const ny = dy / dist;

  circle.x += nx * overlap;
  circle.y += ny * overlap;
}

function circleRectIntersects(x, y, radius, rect) {
  const closestX = clamp(x, rect.x, rect.x + rect.width);
  const closestY = clamp(y, rect.y, rect.y + rect.height);
  const dx = x - closestX;
  const dy = y - closestY;
  const distSq = dx * dx + dy * dy;
  return distSq < radius * radius;
}

// Spawns en bordes del canvas
function getRandomEdgeSpawn() {
  const side = Math.floor(Math.random() * 4);
  let x;
  let y;

  switch (side) {
    case 0: // top
      x = Math.random() * canvas.width;
      y = -20;
      break;
    case 1: // right
      x = canvas.width + 20;
      y = Math.random() * canvas.height;
      break;
    case 2: // bottom
      x = Math.random() * canvas.width;
      y = canvas.height + 20;
      break;
    case 3: // left
    default:
      x = -20;
      y = Math.random() * canvas.height;
      break;
  }

  return { x, y };
}
