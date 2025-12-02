// Input

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (['w', 'a', 's', 'd', ' '].includes(key)) {
    e.preventDefault();
  }

  keys[key] = true;

  if (
    e.key === 'Enter' &&
    (currentState === GAME_STATE.MENU ||
      currentState === GAME_STATE.GAME_OVER)
  ) {
    resetGame();
    playMainSong();
  }

  if (key === 'r') {
    if (currentState === GAME_STATE.PLAYING && player) {
      player.startReload();
    }
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  keys[key] = false;
});

canvas.addEventListener('mousemove', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  mousePos.x = (e.clientX - rect.left) * scaleX;
  mousePos.y = (e.clientY - rect.top) * scaleY;
});

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    e.preventDefault();
    shooting = true;
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (e.button === 0) {
    e.preventDefault();
    shooting = false;
  }
});

canvas.addEventListener('dragstart', (e) => e.preventDefault());
