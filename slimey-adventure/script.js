const grid = document.getElementById('game');

// Maak 7×5 grid
for (let i = 0; i < 35; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  grid.appendChild(cell);
}

const players = [
  { name: 'Ivo', hp: 12, special: 1, abilities: 0, x: 0, y: 0 },
  { name: 'Aria', hp: 16, special: 1, abilities: 0, x: 6, y: 4 }
];

// Spawn spelers
function renderPlayers() {
  document.querySelectorAll('.token').forEach(el => el.remove());
  players.forEach(p => {
    const idx = p.y * 7 + p.x;
    const cell = grid.children[idx];
    const token = document.createElement('div');
    token.className = 'token';
    token.style.background = p.name === 'Ivo' ? '#6f42c1' : '#c9182a';
    token.textContent = p.name[0];
    cell.appendChild(token);
  });
}

renderPlayers();
