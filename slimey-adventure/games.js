// GAME ROOT
const game = document.getElementById("game");

// UTILITY
function clear() {
  game.innerHTML = "";
}
function add(text) {
  const p = document.createElement("p");
  p.innerText = text;
  game.appendChild(p);
}
function button(label, onclick) {
  const b = document.createElement("button");
  b.innerText = label;
  b.onclick = onclick;
  game.appendChild(b);
}

// PLAYER + ENEMY DATA
const player = { hp: 30, maxHp: 30, atk: 6 };
const enemy  = { hp: 20, atk: 4 };

// MAIN MENU
function menu() {
  clear();
  add("A wild enemy appears!");
  button("Attack", attack);
  button("Heal", heal);
}

// GAME ACTIONS
function attack() {
  clear();
  enemy.hp -= player.atk;
  add("You hit the enemy for " + player.atk);

  if (enemy.hp <= 0) {
    add("You won!");
    return;
  }

  player.hp -= enemy.atk;
  add("Enemy hits you for " + enemy.atk);
  add("HP: " + player.hp + "/" + player.maxHp);

  if (player.hp <= 0) {
    add("You died...");
    return;
  }

  button("Continue", menu);
}

function heal() {
  clear();
  player.hp = Math.min(player.maxHp, player.hp + 5);
  add("You heal 5 HP");
  
  player.hp -= enemy.atk;
  add("Enemy hits you for " + enemy.atk);
  add("HP: " + player.hp + "/" + player.maxHp);

  if (player.hp <= 0) {
    add("You died...");
    return;
  }

  button("Continue", menu);
}

// START GAME
menu();
