# 🎮🔥 **PORT ZERO**  
### *Online Co-Op Survival Shooter inspired by BoxHead*

<div align="center">
  <img src="https://img.shields.io/badge/Status-In_Development-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Mode-ONLINE-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Engine-Custom_JS-orange?style=for-the-badge" />
</div>

---

## 🧩 **What is Port Zero?**  
**Port Zero** is a fast-paced *top-down survival shooter* heavily inspired by **BoxHead**, built entirely with JavaScript, Canvas, and Socket.IO.  
It is designed to be a **fully online multiplayer game**, where multiple players will fight together against endless waves of enemies.

Current features include:

- ✔️ Smooth twin-stick style movement (WASD + mouse)  
- ✔️ Shooting, reloading, ammo system, collisions  
- ✔️ Maze-style map with solid obstacles  
- ✔️ Multiple types of enemies (Tier 1, Tier 2, Tier 3, and DEVIL boss)  
- ✔️ Progressive wave system with gradual enemy spawning  
- ✔️ Ammo and health drop system  
- ✔️ Animated player sprite using a custom spritesheet  
- ✔️ Project fully modularized (entities, logic, render, config, etc.)  
- ✔️ Online-ready structure using Socket.IO

---

## 🚀 **Core Features**

### 🎯 *Fast, Skill-Based Combat*  
Each wave increases the difficulty, introducing tougher enemies and eventually the terrifying **DEVIL**, a mini-boss that begins to appear at wave 10.

### ⚔️ *Strategic Movement*  
The maze layout forces you to dodge, corner, and manage space like a true survivor.

### 👾 *Smarter Enemies*  
Enemies attempt to track and reach you, trying different approaches when stuck.

### 🎨 *Custom Sprite Support*  
The system supports full spritesheets for animated characters.  
Currently the player uses a temporary "devil" sprite while final designs are being developed.

---

## 🕸️ **Online Multiplayer**
Port Zero is structured to run online using **Socket.IO**, allowing:

- 🟢 Synchronized movement  
- 🟢 Shared enemy waves  
- 🟢 Real-time cooperative play  
- 🟢 Room/lobby support  

Full online gameplay will be introduced in the next development phase.

---

## 📂 **Project Structure**

```
port-zero/
│── server/
│   └── index.js              # Node.js + Socket.IO server
│
│── client/
│   ├── index.html            # Main HTML file
│   ├── assets/               # Sprites, images, audio
│   ├── config.js             # Game configuration
│   ├── assets.js             # Asset preloader (spritesheets, images)
│   ├── entities.js           # Player, Enemy, Bullet, Pickups
│   ├── logic.js              # Waves, collision, AI, game rules
│   ├── render.js             # Rendering: map, HUD, sprites
│   └── main.js               # Main loop (update + render)
│
└── README.md                 # This file
```

---

## 🛠️ **Tech Stack**

- **Node.js + Express** → Backend server  
- **Socket.IO** → Online multiplayer layer  
- **JavaScript (Vanilla)** → Entire game engine  
- **HTML5 Canvas** → 2D rendering  
- **Spritesheets** → Animation system

---

## 🎨 **Visual Credits**

The temporary player sprite (Devil) was custom-made for testing animation.  
More polished character sprites will be added soon.

---

## 📌 **Current Development Status**

🔥 **Core gameplay fully implemented:**  
- Combat engine  
- Enemy system  
- Wave progression  
- Drops  
- Collisions  
- Pathing logic  
- Auxiliary systems  
- Player sprite animations  

🌐 **Next Steps:**  
- Full multiplayer synchronization  
- Visual polish and animation refinement  
- Sound effects and music  
- Selection of maps  
- Power-ups, weapons, skins  
- Final enemy sprites

---

## 🚀 **Run the Game Locally**

### 1. Install dependencies
```
npm install
```

### 2. Start the server
```
npm run dev
```

### 3. Play the game
Open your browser at:

```
http://localhost:4000
```

---

## 💙 **Thanks for Playing Port Zero**
This game is built with passion, creativity, and ridiculous amounts of caffeine.  
Good luck surviving the waves…

🔥👹 **Welcome to Port Zero.**
