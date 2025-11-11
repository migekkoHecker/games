// === script.js ===

// --- Dice roller ---
function rollDice(diceStr) {
  // Example: "1d4", "1d6 +2"
  const match = diceStr.match(/(\d+)d(\d+)(?: *([+-]\d+))?/);
  if (!match) return 0;

  const rolls = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;

  let total = 0;
  for (let i = 0; i < rolls; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total + modifier;
}

// === Action type functions ===

// --- Move ---
function moveAction(player, tiles) {
  const w = currentMap.size.w;
  const h = currentMap.size.h;
  clearHighlights();

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (currentMap.logic[y][x] === 1) continue; // blocked
      const dist = Math.abs(player.x - x) + Math.abs(player.y - y);
      if (dist <= tiles) {
        const idx = y * w + x;
        const cell = grid.children[idx];
        cell.classList.add('highlight');
        cell.style.cursor = 'pointer';

        cell.onclick = () => {
          player.x = x;
          player.y = y;
          renderPlayers();
          clearHighlights();
          console.log(`${player.name} moved to (${x}, ${y})`);
        };
      }
    }
  }
}

// --- Attack ---
function attackAction(attacker, target, damage) {
  const totalDamage = Math.max(damage - (target.shield || 0), 0);
  target.hp -= totalDamage;
  console.log(`${attacker.name} attacked ${target.name} for ${totalDamage} damage. ${target.name} HP: ${target.hp}`);
}

// --- Range check ---
function inRange(attacker, target, range) {
  const dist = Math.abs(attacker.x - target.x) + Math.abs(attacker.y - target.y);
  return dist <= range;
}

// --- Heal ---
function healAction(player, target, healAmount) {
  target.hp += healAmount;
  console.log(`${player.name} healed ${target.name} for ${healAmount} HP. New HP: ${target.hp}`);
}

// --- Shield ---
function shieldAction(player, amount) {
  player.shield = (player.shield || 0) + amount;
  console.log(`${player.name} gains ${amount} shield. Total shield: ${player.shield}`);
}

// --- Cooldown ---
function applyCooldown(actionObj) {
  actionObj.currentCooldown = actionObj.cooldown;
}

// --- Target selection ---
function selectTargets(attacker, targets, maxTargets) {
  return targets.slice(0, maxTargets);
}

// --- Push / Pull ---
function pushTarget(attacker, target, tiles) {
  const dx = target.x - attacker.x;
  const dy = target.y - attacker.y;
  if (Math.abs(dx) > Math.abs(dy)) target.x += dx > 0 ? tiles : -tiles;
  else target.y += dy > 0 ? tiles : -tiles;
  console.log(`${target.name} was pushed to (${target.x}, ${target.y})`);
}

function pullTarget(attacker, target, tiles) {
  const dx = attacker.x - target.x;
  const dy = attacker.y - target.y;
  if (Math.abs(dx) > Math.abs(dy)) target.x += dx > 0 ? tiles : -tiles;
  else target.y += dy > 0 ? tiles : -tiles;
  console.log(`${target.name} was pulled to (${target.x}, ${target.y})`);
}

// --- Destroy obstacles ---
function destroyAction(x, y) {
  if (currentMap.logic[y][x] === 1) {
    currentMap.logic[y][x] = 0;
    console.log(`Destroyed obstacle at (${x}, ${y})`);
  }
}

// --- Pierce (attacks go through obstacles/players) ---
function pierceAction(attacker, path, damage) {
  for (const tile of path) {
    const target = players.find(p => p.x === tile.x && p.y === tile.y);
    if (target) attackAction(attacker, target, damage);
  }
}

// --- Jump (move over obstacles) ---
function jumpAction(player, x, y, maxJumps) {
  // Simply move player ignoring obstacles for maxJumps tiles
  const dist = Math.abs(player.x - x) + Math.abs(player.y - y);
  if (dist <= maxJumps) {
    player.x = x;
    player.y = y;
    renderPlayers();
    console.log(`${player.name} jumped to (${x}, ${y})`);
  }
}

// --- Status Effects ---
function applyStatus(target, effect, value, duration) {
  target.status = target.status || {};
  target.status[effect] = { value, duration };
  console.log(`${target.name} gained status ${effect} (${value}) for ${duration} turns`);
}

// --- Advantage / Disadvantage ---
function applyAdvantage(attacker) {
  attacker.advantage = true;
}

function applyDisadvantage(attacker) {
  attacker.disadvantage = true;
}


// --- Setup map ---
const currentMap = MAPS.meadow;
const grid = document.getElementById('game');
grid.style.display = 'grid';
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

// --- Track actions per turn ---
let actionsTaken = [];

// --- Highlight and move ---
function highlightMovement() {
  const moveValue = rollDice(activePlayer.actions.movement.move);
  console.log(`${activePlayer.name} can move up to ${moveValue} tiles`);

  clearHighlights();

  const w = currentMap.size.w;
  const h = currentMap.size.h;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (currentMap.logic[y][x] === 1) continue;

      const dist = Math.abs(activePlayer.x - x) + Math.abs(activePlayer.y - y);
      if (dist <= moveValue) {
        const idx = y * w + x;
        const cell = grid.children[idx];
        cell.classList.add('highlight');
        cell.style.cursor = 'pointer';

        cell.onclick = () => {
          movePlayerTo(activePlayer, x, y);
          actionsTaken.push('movement');

          if (actionsTaken.length >= 2) nextTurn();
          else populateMainMenu();
        };
      }
    }
  }
}

function movePlayerTo(player, x, y) {
  player.x = x;
  player.y = y;
  renderPlayers();
  console.log(`${player.name} moved to (${x}, ${y})`);
  clearHighlights();
}

function clearHighlights() {
  document.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('highlight');
    c.onclick = null;
  });
}

// --- Menu logic ---
const submenu = document.getElementById('submenu');

// --- Populate main menu (2x2) ---
function populateMainMenu() {
  submenu.innerHTML = '';
  submenu.style.display = 'flex';
  submenu.style.flexWrap = 'wrap';
  submenu.style.gap = '10px';
  submenu.style.width = '260px';

  const mainMenuOptions = [
    { name: 'Actions', type: 'action' },
    { name: 'Ability', type: 'ability' },
    { name: 'Item', type: 'item' },
    { name: 'Skip Turn', type: 'skip' }
  ];

  mainMenuOptions.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.name;
    btn.style.flex = '1 1 45%';
    btn.style.padding = '10px';
    btn.style.fontSize = '14px';

    btn.onclick = () => {
      if (opt.type === 'skip') {
        console.log(`${activePlayer.name} skipped turn`);
        nextTurn();
      } else if (opt.type === 'action') {
        populateActionSubmenu(activePlayer.actions);
      } else if (opt.type === 'ability') {
        populateActionSubmenu({ placeholder: { name: 'Ability (coming later)' } });
      } else if (opt.type === 'item') {
        populateActionSubmenu({ placeholder: { name: 'Item (coming later)' } });
      }
    };

    submenu.appendChild(btn);
  });
}

// --- Action submenu (2x2) ---
function populateActionSubmenu(options) {
  submenu.innerHTML = '';
  submenu.style.display = 'flex';
  submenu.style.flexWrap = 'wrap';
  submenu.style.gap = '10px';
  submenu.style.width = '260px';

  const keys = Object.keys(options);

  keys.forEach((key, idx) => {
    const action = options[key];
    const btn = document.createElement('button');
    btn.textContent = action.name;
    btn.style.flex = '1 1 45%';
    btn.style.padding = '10px';
    btn.style.fontSize = '14px';

    // Disable if already used this turn
    if (actionsTaken.includes(key)) {
      btn.disabled = true;
      btn.style.opacity = '0.5';
    }

    btn.onclick = () => {
      console.log(`${activePlayer.name} selected ${action.name}`, action);

      // Movement handled after clicking cell
      if (key === 'movement') highlightMovement();
      else actionsTaken.push(key); // other actions count immediately

      if (actionsTaken.length >= 2 && key !== 'movement') nextTurn();
      else if (key !== 'movement') populateMainMenu();
    };

    submenu.appendChild(btn);
  });

  // Fill empty slots to keep 2x2 layout
  if (keys.length < 4) {
    for (let i = keys.length; i < 4; i++) {
      const empty = document.createElement('div');
      empty.style.flex = '1 1 45%';
      submenu.appendChild(empty);
    }
  }
}

// --- Next turn ---
function nextTurn() {
  activePlayerIndex = (activePlayerIndex + 1) % players.length;
  activePlayer = players[activePlayerIndex];
  actionsTaken = [];
  showTurn();
  clearHighlights();
  populateMainMenu();
}

// --- Initialize ---
showTurn();
populateMainMenu();
