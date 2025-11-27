# 🎮🔥 **PORT ZERO**  
### *Online Co-Op Survival Shooter inspired by BoxHead*

<div align="center">
  <img src="https://img.shields.io/badge/Status-In_Development-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Mode-ONLINE-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Engine-Custom_JS-orange?style=for-the-badge" />
</div>

---

## 🧩 **¿Qué es Port Zero?**  
**Port Zero** es un *top-down survival shooter* inspirado fuertemente en **BoxHead**, pero construido desde cero con JavaScript, Canvas y Socket.IO.  
Es un juego **100% online**, donde varios jugadores podrán conectarse al mismo servidor y pelear contra hordas de enemigos cada vez más peligrosos.

Actualmente el juego incluye:

- ✔️ Movimiento fluido estilo twin-stick (WASD + mouse)  
- ✔️ Sistema de disparo, recarga, balas y colisiones  
- ✔️ Mapa estilo laberinto con obstáculos  
- ✔️ Enemigos de múltiples tipos (normales, avanzados y DEVIL)  
- ✔️ Oleadas progresivas con spawn gradual  
- ✔️ Drops de munición y salud  
- ✔️ Sprites animados para el jugador  
- ✔️ Preparado para extenderse a **multiplayer real online**

---

## 🚀 **Características Clave**

### 🎯 *Gameplay rápido y difícil*  
Cada ronda aumenta la dificultad, introduciendo nuevos tipos de enemigos, incluyendo al legendario **DEVIL**, un mini-boss que aparece desde la oleada 10.

### ⚔️ *Combate basado en habilidad*  
Tu puntería, tu movimiento y tu estrategia con los pasillos del mapa definen si vivís… o no.

### 👾 *Enemigos Inteligentes*  
Los enemigos buscan al jugador y tratan de rodearlos — no solo se empotran contra las paredes.

### 🎨 *Sprites Personalizados*  
El juego soporta spritesheets animados para todos los personajes.  
Actualmente el jugador usa un sprite temporal de “diablito” mientras se diseñan los demás.

---

## 🕸️ **Online / Multiplayer**
Port Zero está diseñado para funcionar con **Socket.IO**, lo que permitirá:

- 🟢 Movimientos sincronizados entre jugadores  
- 🟢 Enemigos compartidos  
- 🟢 Partidas cooperativas  
- 🟢 Salas y hostings personalizados  

(La lógica base ya está integrada; la sincronización completa se implementará en la siguiente fase.)

---

## 📂 **Estructura del Proyecto**

```
port-zero/
│── server/
│   └── index.js              # Servidor Node + Socket.IO
│
│── client/
│   ├── index.html            # Canvas + UI básica
│   ├── assets/               # Sprites, imágenes, sonidos, etc.
│   ├── config.js             # Config global del juego
│   ├── assets.js             # Cargador de sprites
│   ├── entities.js           # Player, Enemy, Bullet, Pickups
│   ├── logic.js              # Oleadas, IA, colisiones, etc.
│   ├── render.js             # Render del mapa, HUD, sprites
│   └── main.js               # Loop principal (update + render)
│
└── README.md                 # Este archivo :)
```

---

## 🛠️ **Tecnologías**

- **Node.js + Express** → Servidor web  
- **Socket.IO** → Implementación online  
- **HTML5 Canvas** → Renderizado del juego  
- **JavaScript Vanilla** → Motor completo del juego  
- **Spritesheets** → Animaciones del jugador y enemigos

---

## 🎨 **Créditos Visuales**

El sprite temporal del jugador (Devil) fue diseñado especialmente para este proyecto.  
Más sprites personalizados serán añadidos conforme avance el desarrollo artístico.

---

## 📌 **Estado Actual del Proyecto**
💥 Base del juego completada:  
- Motor  
- IA  
- Enemigos  
- Sprites  
- Oleadas  
- Drops  
- Mapa  
- Estructura organizada en módulos

🌐 Próximos pasos:  
- Multiplayer real  
- Menú interactivo completo  
- Sprites finales para cada tipo de enemigo  
- Sonidos  
- Efectos visuales  

---

## 🚀 **Cómo Ejecutarlo**

### 1. Instalar dependencias
```
npm install
```

### 2. Iniciar el servidor
```
npm run dev
```

### 3. Abrir el juego
Ingresa en tu navegador a:  
```
http://localhost:4000
```

---

## 💙 **Gracias por jugar Port Zero**
Este proyecto fue creado con pasión, dedicación, y muchísima cafeína.  
Prepárate para sobrevivir… si podés.  
🔥👹 **Good luck, Port Runner.**  
