# Port Zero - Guía de Despliegue para Multijugador en Línea

## 📋 Contexto

**Port Zero** es un juego multijugador (2-4 jugadores) que usa arquitectura **cliente-servidor** con Socket.IO. 

**IMPORTANTE:** Los jugadores **NO estarán en la misma red local** (cada uno jugará desde su casa con su propio WiFi), por lo que el servidor debe ser accesible vía Internet o VPN.

---

## 🚀 Opciones de Despliegue

### **Opción 1: Servidor en la Nube (RECOMENDADO para el curso)**

Desplegar el servidor en un servicio de hosting gratuito para que sea accesible desde cualquier lugar.

#### **A. Railway (Recomendado)**

1. **Crear cuenta en Railway:** https://railway.app
2. **Conectar GitHub:**
   - En Railway: "New Project" → "Deploy from GitHub repo"
   - Seleccionar repositorio `port-zero`
3. **Configurar:**
   - Railway detectará automáticamente Node.js
   - Configurar directorio raíz: `/server`
   - Variables de entorno: 
     - `PORT` = 4000 (Railway lo asignará automáticamente)
4. **Obtener URL:**
   - Railway te dará una URL pública tipo: `https://port-zero-production.up.railway.app`
5. **Actualizar cliente:**
   ```javascript
   // En client/config.js cambiar:
   SERVER_URL: 'https://port-zero-production.up.railway.app',
   ```

#### **B. Render**

1. **Crear cuenta en Render:** https://render.com
2. **New Web Service:**
   - Repository: tu repo de GitHub
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node index.js`
3. **Obtener URL:** `https://port-zero.onrender.com`
4. **Actualizar cliente** igual que Railway

---

### **Opción 2: VPN (Para jugar sin servidor público)**

Si no quieren hospedar en la nube, pueden crear una red privada virtual.

#### **A. Tailscale (Más fácil)**

1. **Instalar Tailscale en todas las PCs:**
   - Descargar: https://tailscale.com/download
   - Crear cuenta y logearse en todas las PCs
2. **Identificar IP del host:**
   - En la PC que correrá el servidor: 
     ```powershell
     tailscale ip
     ```
   - Ejemplo: `100.64.52.123`
3. **Iniciar servidor en el host:**
   ```powershell
   cd server
   npm install
   node index.js
   ```
4. **Configurar clientes:**
   ```javascript
   // En client/config.js de cada jugador:
   SERVER_URL: 'http://100.64.52.123:4000',
   ```
5. **Abrir en navegador:** `http://localhost:4000` (host) o `http://100.64.52.123:4000` (clientes)

#### **B. ZeroTier (Alternativa)**

Similar a Tailscale:
1. Crear red en https://my.zerotier.com
2. Instalar cliente en todas las PCs
3. Unirse a la red con el Network ID
4. Seguir pasos similares a Tailscale

---

### **Opción 3: Ngrok (Testing rápido, NO recomendado para el proyecto final)**

Solo para pruebas rápidas:

```powershell
# Instalar ngrok
npm install -g ngrok

# En una terminal, iniciar el servidor
cd server
npm install
node index.js

# En otra terminal, exponer el puerto
ngrok http 4000
```

Ngrok te dará una URL temporal tipo: `https://abc123.ngrok.io`

**Problema:** La URL cambia cada vez que reinicias ngrok (a menos que pagues).

---

## 🔧 Configuración del Cliente

### **Desarrollo Local**

Para probar en tu PC (varios navegadores/pestañas):

```javascript
// client/config.js
SERVER_URL: window.location.origin, // Auto-detecta localhost:4000
```

### **Producción (Railway/Render)**

```javascript
// client/config.js
SERVER_URL: 'https://tu-app.railway.app', // URL del servidor desplegado
```

### **VPN (Tailscale/ZeroTier)**

```javascript
// client/config.js
SERVER_URL: 'http://100.x.x.x:4000', // IP de Tailscale/ZeroTier del host
```

---

## 📝 Comandos para Correr Localmente

### **Servidor:**

```powershell
cd server
npm install
node index.js
```

Verás:
```
========================================
PORT ZERO - Server Running
Port: 4000
========================================
```

### **Cliente (si usas servidor local):**

1. El servidor ya sirve el cliente en: `http://localhost:4000`
2. Abrir en navegador(es)

### **Testing Multijugador Local:**

1. Abrir **múltiples pestañas/navegadores** en `http://localhost:4000`
2. En cada pestaña: presionar **ENTER** para unirse
3. Deberías ver los jugadores con IDs distintos

---

## 🧪 Checklist de Testing

### **Testing Local (Desarrollo):**
- [ ] Servidor inicia sin errores
- [ ] Cliente se conecta (ver consola del navegador)
- [ ] Abrir 2-4 pestañas y todas se conectan
- [ ] Jugadores aparecen con colores diferentes
- [ ] Movimiento (WASD) se sincroniza entre clientes
- [ ] Disparos (click) funcionan
- [ ] Enemigos se ven en todos los clientes
- [ ] Game Over ocurre cuando todos mueren

### **Testing en Línea (Railway/Render/VPN):**
- [ ] URL del servidor es accesible desde navegador
- [ ] Actualizar `SERVER_URL` en `config.js`
- [ ] Re-desplegar o recargar página
- [ ] Conectar desde 2+ máquinas diferentes (casas distintas)
- [ ] Verificar que todos ven lo mismo
- [ ] Probar latencia (puede haber ~50-200ms dependiendo del hosting)

---

## 🐛 Troubleshooting

### **"Cannot connect to server"**
- Verificar que el servidor esté corriendo
- Verificar que `SERVER_URL` sea correcto
- En producción: verificar que Railway/Render esté activo
- En VPN: verificar que todas las PCs estén en la misma red de Tailscale

### **"CORS error"**
- El servidor ya tiene CORS configurado en `server/index.js`
- Si usas un dominio custom, actualizar `origin: "*"` a tu dominio

### **"Lag / Desincronización"**
- Normal con hosting gratuito (Render tiene cold starts)
- Railway suele ser más rápido
- VPN local tendrá la menor latencia

### **"Socket.io transport error"**
- Railway/Render a veces bloquean WebSockets
- El código ya usa `transports: ['websocket', 'polling']` como fallback

---

## 📊 Arquitectura Final

```
┌─────────────────┐
│  Cliente 1      │ ←─┐
│  (Casa A)       │   │
└─────────────────┘   │
                       │
┌─────────────────┐   │    ┌──────────────────┐
│  Cliente 2      │ ←─┼────│  Servidor Node.js │
│  (Casa B)       │   │    │  (Railway/VPN)    │
└─────────────────┘   │    │  - Game Loop      │
                       │    │  - Socket.IO      │
┌─────────────────┐   │    │  - Autoritativo   │
│  Cliente 3      │ ←─┘    └──────────────────┘
│  (Casa C)       │
└─────────────────┘

Comunicación:
- Clientes envían: inputs (keys, mouse, shooting)
- Servidor procesa: movimiento, colisiones, IA, oleadas
- Servidor envía: game_state (posiciones, enemigos, balas)
- Rate: 20 Hz (cliente) / 30 Hz (servidor)
```

---

## 📚 Para el Informe de Redes (IC-7602)

### **Puntos clave a documentar:**

1. **Arquitectura Cliente-Servidor Autoritativa:**
   - Servidor mantiene estado oficial
   - Clientes solo envían inputs y renderizan

2. **Protocolo de Mensajes:**
   - `player_input`: Cliente → Servidor (keys, mousePos, shooting)
   - `game_state`: Servidor → Clientes (estado completo)
   - `game_event`: Servidor → Clientes (eventos: waves, game over)
   - `player_joined/left`: Notificaciones de jugadores

3. **Desafío de Redes Diferentes:**
   - Problema: NAT, firewalls, IPs privadas
   - Solución: Servidor en cloud (Railway) o VPN (Tailscale)

4. **Latencia y Sincronización:**
   - Tick rate: 30 Hz servidor, 20 Hz cliente
   - Sin predicción (scope del proyecto)
   - Aceptable para juego cooperativo

5. **Escalabilidad:**
   - 1 servidor = 1 partida (2-4 jugadores)
   - Para múltiples partidas: implementar sistema de salas (fuera del scope)

---

## ✅ Resumen de Pasos para el Proyecto Final

1. **Desarrollo Local:**
   - Probar con `SERVER_URL: window.location.origin`
   - Múltiples pestañas

2. **Despliegue:**
   - Opción A: Railway (gratis, fácil, público)
   - Opción B: Tailscale VPN (gratis, privado, más rápido)

3. **Actualizar Config:**
   - Cambiar `SERVER_URL` en `client/config.js`

4. **Demo:**
   - Conectar desde 2-4 máquinas diferentes
   - Grabar video para el informe
   - Screenshot de logs del servidor

---

## 📞 Soporte

Si tienes problemas:
1. Revisar consola del navegador (F12)
2. Revisar logs del servidor (terminal)
3. Verificar conectividad con `ping` o navegador
4. Revisar firewall/antivirus

¡Éxito con el proyecto! 🎮
