// === script.js ===
// assumes data.js is loaded first!

// 1. Choose which map to load
const currentMap = MAPS.meadow;

// 2. Reference the HTML game container
const grid = document.getElementById('game');
grid.style.gridTemplateColumns = `repeat(${currentMap.size.w}, 60px)`;

// 3. Draw the map visually
for (let y = 0; y < currentMap.size.h; y++) {
  for (let x = 0; x < currentMap.size.w; x++) {
    const tile = document.createElement('div');
    tile.classList.add('cell');

    // get the art type (e.g. grass, wall, stone)
    const artType = currentMap.artLegend[currentMap.art[y][x]];
    tile.classList.add(artType);

    // optional: mark walls for debugging
    if (currentMap.logic[y][x] === 1) {
      tile.dataset.blocked = "true";
    }

    grid.appendChild(tile);
  }
}

// 4. Create players from character data
const players = [
  { ...CHARACTERS.ivo, x: 0, y: 0 },
  { ...CHARACTERS.aria, x: 6, y: 4 },
  { ...CHARACTERS.nox, x: 3, y: 2 }
];

// 5. Function to render all players
function renderPlayers() {
  // Remove old tokens
  document.querySelectorAll('.token').forEach(el => el.remove());

  players.forEach(p => {
    const idx = p.y * currentMap.size.w + p.x;
    const cell = grid.children[idx];
    if (!cell) return;

    const token = document.createElement('div');
    token.className = 'token';
    token.style.background = p.color;
    token.textContent = p.name[0]; // first letter of name

    cell.appendChild(token);
  });
}

// 6. Draw the players
renderPlayers();

// 7. Example: simple turn-based UI placeholder
const ui = document.getElementById('ui');
let turnIndex = 0;

function showTurn() {
  const player = players[turnIndex];
  ui.innerHTML = `
    <strong>Current Turn:</strong> ${player.name} (${player.class})<br>
    HP: ${player.hp} | Special: ${player.special} | Abilities: ${player.abilities}
    <br><button id="nextTurn">Next Turn</button>
  `;
  document.getElementById('nextTurn').onclick = () => nextTurn();
}

function nextTurn() {
  turnIndex = (turnIndex + 1) % players.length;
  showTurn();
}

// Initialize UI
showTurn();
