// === script.js ===

// --- Setup map ---
const currentMap = MAPS.meadow;
const grid = document.getElementById('game');
grid.style.gridTemplateColumns = `repeat(${currentMap.size.w}, 60px)`;

// Draw map
for (let y = 0; y < currentMap.size.h; y++) {
  for (let x = 0; x < currentMap.size.w; x++) {
    const tile = document.createElement('div');
    tile.classList.add('cell');

    const artType = currentMap.artLegend[currentMap.art[y][x]];
    tile.classList.add(artType);

    if (currentMap.logic[y][x] === 1) tile.dataset.blocked = "true";

    grid.appendChild(tile);
  }
}

// --- Setup players ---
const players = [
  { ...CHARACTERS.slime, x: 0, y: 0 },
  { ...CHARACTERS.ridder, x: 6, y: 4 },
  { ...CHARACTERS.boogschutter, x: 3, y: 2 }
];

let activePlayerIndex = 0;
let activePlayer = players[activePlayerIndex];

// Render players
function renderPlayers() {
  document.querySelectorAll('.token').forEach(el => el.remove());

  players.forEach(p => {
    const idx = p.y * currentMap.size.w + p.x;
    const cell = grid.children[idx];
    if (!cell) return;

    const token = document.createElement('div');
    token.className = 'token';
    token.style.background = p.color;
    token.textContent = p.name[0];

    cell.appendChild(token);
  });
}

renderPlayers();

// --- Turn display ---
const turnDisplay = document.getElementById('current-turn');

function showTurn() {
  const p = players[activePlayerIndex];
  turnDisplay.innerHTML = `
    <strong>Current Turn:</strong> ${p.name} (${p.class})<br>
    HP: ${p.hp} | Int: ${p.int}
  `;
}

showTurn();

// --- Next turn ---
function nextTurn() {
  activePlayerIndex = (activePlayerIndex + 1) % players.length;
  activePlayer = players[activePlayerIndex];
  showTurn();
  populateSubmenu(activePlayer.actions);
}

// --- Menu logic ---
const submenu = document.getElementById('submenu');
const skipButton = document.getElementById('skipTurn');

// Main menu clicks
document.querySelectorAll('.main-menu .menu-item').forEach(item => {
  item.addEventListener('click', () => {
    const type = item.dataset.type;
    if (!type) return;

    if (type === "action") populateSubmenu(activePlayer.actions);
    else if (type === "ability") populateSubmenu({ placeholder: { name: "Ability (coming later)" } });
    else if (type === "item") populateSubmenu({ placeholder: { name: "Item (coming later)" } });
  });
});

// Skip turn
skipButton.onclick = () => {
  console.log(`${activePlayer.name} skipped turn`);
  nextTurn();
};

// Populate submenu dynamically
function populateSubmenu(options) {
  submenu.innerHTML = '';
  submenu.style.display = 'flex';
  for (const key in options) {
    const action = options[key];
    const li = document.createElement('li');
    li.textContent = action.name;
    li.onclick = () => {
      console.log(`${activePlayer.name} selected ${action.name}`, action);
      submenu.style.display = 'none';
    };
    submenu.appendChild(li);
  }
}
