// Mapa, paredes y utilidades de colisión

// Laberinto para canvas 1024x640
// Laberinto para canvas 1024x640
const walls = [

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
