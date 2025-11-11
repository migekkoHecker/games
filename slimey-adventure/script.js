// === Dice roller ===
function rollDice(diceStr) {
  const match = diceStr.match(/(\d+)d(\d+)(?: *([+-]\d+))?/);
  if (!match) return 0;
  const rolls = parseInt(match[1]), sides = parseInt(match[2]), mod = match[3] ? parseInt(match[3]) : 0;
  let total = 0;
  for (let i=0;i<rolls;i++) total += Math.floor(Math.random()*sides)+1;
  return total + mod;
}

// === Setup map & players ===
const currentMap = MAPS.meadow;
const grid = document.getElementById('game');
grid.style.gridTemplateColumns = `repeat(${currentMap.size.w}, 60px)`;

for (let y=0;y<currentMap.size.h;y++){
  for (let x=0;x<currentMap.size.w;x++){
    const tile = document.createElement('div');
    tile.className = "cell " + currentMap.artLegend[currentMap.art[y][x]];
    if(currentMap.logic[y][x]===1) tile.dataset.blocked="true";
    grid.appendChild(tile);
  }
}

const players = [
  {...CHARACTERS.slime,x:0,y:0},
  {...CHARACTERS.ridder,x:6,y:4},
  {...CHARACTERS.boogschutter,x:3,y:2}
];

let activePlayerIndex = 0;
let activePlayer = players[activePlayerIndex];
let actionsTaken = [];

function renderPlayers(){
  document.querySelectorAll('.token').forEach(el=>el.remove());
  players.forEach(p=>{
    const idx=p.y*currentMap.size.w+p.x;
    const cell=grid.children[idx]; if(!cell) return;
    const token=document.createElement('div');
    token.className="token";
    token.style.background=p.color;
    token.textContent=p.name[0];
    cell.appendChild(token);
  });
}

renderPlayers();

// --- Turn display ---
const turnDisplay = document.getElementById('current-turn');
function showTurn(){
  const p=players[activePlayerIndex];
  turnDisplay.innerHTML=`<strong>Current Turn:</strong> ${p.name} (${p.class})<br>HP: ${p.hp} | Int: ${p.int}`;
}
showTurn();

// --- Clear highlights ---
function clearHighlights(){document.querySelectorAll('.cell').forEach(c=>{c.classList.remove('highlight'); c.onclick=null;});}

// === ACTION FUNCTIONS ===
function moveAction(player, tiles){
  clearHighlights();
  const w=currentMap.size.w, h=currentMap.size.h;
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      if(currentMap.logic[y][x]===1) continue;
      const dist=Math.abs(player.x-x)+Math.abs(player.y-y);
      if(dist<=tiles){
        const idx=y*w+x;
        const cell=grid.children[idx];
        cell.classList.add('highlight');
        cell.onclick=()=>{player.x=x;player.y=y; renderPlayers(); clearHighlights(); actionsTaken.push('movement'); if(actionsTaken.length>=2) nextTurn(); else populateMainMenu();};
      }
    }
  }
}

function attackAction(attacker,target,dmg){
  const damage=Math.max(dmg-(target.shield||0),0);
  target.hp-=damage;
  console.log(`${attacker.name} attacked ${target.name} for ${damage}. ${target.name} HP: ${target.hp}`);
}

function healAction(player,target,healAmt){target.hp+=healAmt;console.log(`${player.name} healed ${target.name} for ${healAmt}. HP: ${target.hp}`);}
function shieldAction(player,amount){player.shield=(player.shield||0)+amount; console.log(`${player.name} gains ${amount} shield. Total: ${player.shield}`);}
function applyCooldown(actionObj){actionObj.currentCooldown=actionObj.cooldown;}
function inRange(a,t,range){return Math.abs(a.x-t.x)+Math.abs(a.y-t.y)<=range;}

// --- Perform action ---
function performAction(player,key){
  const action=player.actions[key];
  if(!action) return;

  if(action.move){const tiles=typeof action.move==="string"?rollDice(action.move):action.move; moveAction(player,tiles);}
  if(action.attack){const dmg=typeof action.attack==="string"?rollDice(action.attack):action.attack; highlightTargets(player,'enemy',dmg,action.range||1);}
  if(action.heal){const amt=typeof action.heal==="string"?rollDice(action.heal):action.heal; highlightTargets(player,'ally',amt,action.range||1,'heal');}
  if(action.shield) shieldAction(player,action.shield);
  if(action.cooldown) applyCooldown(action);
  // other types (push/pull/jump/destroy/status) can be implemented similarly
}

// --- Highlight targets ---
function highlightTargets(player,type,value,range,mode='attack'){
  clearHighlights();
  players.forEach(t=>{
    if(t===player) return;
    const isAlly=(player.color===t.color);
    if((type==='ally'&&isAlly)||(type==='enemy'&&!isAlly)){
      if(inRange(player,t,range)){
        const idx=t.y*currentMap.size.w+t.x;
        const cell=grid.children[idx];
        cell.classList.add('highlight');
        cell.onclick=()=>{if(mode==='attack') attackAction(player,t,value); else if(mode==='heal') healAction(player,t,value); clearHighlights(); actionsTaken.push('action'); if(actionsTaken.length>=2) nextTurn(); else populateMainMenu();};
      }
    }
  });
}

// --- Menu ---
const submenu=document.getElementById('submenu');
function populateMainMenu(){
  submenu.innerHTML='';
  submenu.style.display='flex'; submenu.style.flexWrap='wrap'; submenu.style.gap='10px'; submenu.style.width='260px';
  const opts=[
    {name:'Actions',type:'action'},{name:'Ability',type:'ability'},{name:'Item',type:'item'},{name:'Skip Turn',type:'skip'}
  ];
  opts.forEach(opt=>{
    const btn=document.createElement('button');
    btn.textContent=opt.name; btn.style.flex='1 1 45%'; btn.style.padding='10px'; btn.style.fontSize='14px';
    btn.onclick=()=>{
      if(opt.type==='skip'){console.log(`${activePlayer.name} skipped turn`); nextTurn();}
      else if(opt.type==='action') populateActionSubmenu(activePlayer.actions);
      else populateActionSubmenu({placeholder:{name:`${opt.name} (coming later)`}});
    };
    submenu.appendChild(btn);
  });
}

function populateActionSubmenu(options){
  submenu.innerHTML=''; submenu.style.display='flex'; submenu.style.flexWrap='wrap'; submenu.style.gap='10px'; submenu.style.width='260px';
  Object.keys(options).forEach(key=>{
    const action=options[key];
    const btn=document.createElement('button');
    btn.textContent=action.name;
    btn.style.flex='1 1 45%';
    btn.style.padding='10px';
    btn.style.fontSize='14px';
    if(action.currentCooldown>0) {btn.disabled=true; btn.style.opacity=0.5;}
    btn.onclick=()=>{performAction(activePlayer,key); if(!action.move && !action.attack && !action.heal) actionsTaken.push(key); if(actionsTaken.length>=2) nextTurn();};
    submenu.appendChild(btn);
  });
}

document.getElementById('skipTurn').onclick=()=>{console.log(`${activePlayer.name} skipped turn`); nextTurn();};

function nextTurn(){
  activePlayerIndex=(activePlayerIndex+1)%players.length;
  activePlayer=players[activePlayerIndex];
  actionsTaken=[];
  showTurn();
  clearHighlights();
  populateMainMenu();
}

// --- Initialize ---
showTurn(); populateMainMenu();
renderPlayers();
