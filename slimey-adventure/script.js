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

// === Render ===
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

// === Turn display ===
const turnDisplay = document.getElementById('current-turn');
function showTurn(){
  const p=players[activePlayerIndex];
  turnDisplay.innerHTML=`<strong>Current Turn:</strong> ${p.name} (${p.class})<br>HP: ${p.hp} | Int: ${p.int}`;
}

// === Clear highlights ===
function clearHighlights(){document.querySelectorAll('.cell').forEach(c=>{c.classList.remove('highlight'); c.onclick=null;});}

// === Utilities ===
function inRange(a,t,range){return Math.abs(a.x-t.x)+Math.abs(a.y-t.y)<=range;}
function getDistance(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);}
function getEnemies(player){return players.filter(p=>p!==player && p.color!==player.color);}
function getAllies(player){return players.filter(p=>p!==player && p.color===player.color);}

// === ACTION FUNCTIONS ===
function moveAction(player,tiles,jump=0){
  clearHighlights();
  const w=currentMap.size.w, h=currentMap.size.h;
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      if(currentMap.logic[y][x]===1 && getDistance(player,{x,y})>jump) continue;
      const dist=Math.abs(player.x-x)+Math.abs(player.y-y);
      if(dist<=tiles+jump){
        const idx=y*w+x;
        const cell=grid.children[idx];
        cell.classList.add('highlight');
        cell.onclick=()=>{
          player.x=x;player.y=y;
          renderPlayers();clearHighlights();
          actionsTaken.push('movement');if(actionsTaken.length>=2) nextTurn(); else populateMainMenu();
        };
      }
    }
  }
}

function attackAction(attacker,target,dmg){
  if(attacker.advantage) dmg+=1;
  if(attacker.disadvantage) dmg-=1;
  const damage=Math.max(dmg-(target.shield||0),0);
  target.hp-=damage;
  console.log(`${attacker.name} attacked ${target.name} for ${damage}. ${target.name} HP: ${target.hp}`);
  attacker.advantage=false; attacker.disadvantage=false;
}

function healAction(player,target,amt){target.hp+=amt; console.log(`${player.name} healed ${target.name} for ${amt}. HP: ${target.hp}`);}
function shieldAction(player,amt){player.shield=(player.shield||0)+amt; console.log(`${player.name} gains ${amt} shield. Total: ${player.shield}`);}
function applyCooldown(actionObj){actionObj.currentCooldown=actionObj.cooldown;}

// Push / Pull
function pushTarget(attacker,target,tiles){
  const dx=target.x-attacker.x, dy=target.y-attacker.y;
  if(Math.abs(dx)>Math.abs(dy)) target.x+=dx>0?tiles:-tiles;
  else target.y+=dy>0?tiles:-tiles;
  renderPlayers(); console.log(`${target.name} pushed to (${target.x},${target.y})`);
}

function pullTarget(attacker,target,tiles){
  const dx=attacker.x-target.x, dy=attacker.y-target.y;
  if(Math.abs(dx)>Math.abs(dy)) target.x+=dx>0?tiles:-tiles;
  else target.y+=dy>0?tiles:-tiles;
  renderPlayers(); console.log(`${target.name} pulled to (${target.x},${target.y})`);
}

// Destroy
function destroyAction(x,y){
  if(currentMap.logic[y][x]===1){currentMap.logic[y][x]=0; console.log(`Destroyed obstacle at (${x},${y})`);}
}

// Pierce
function pierceAction(attacker,path,dmg){for(const t of path){const target=players.find(p=>p.x===t.x && p.y===t.y); if(target) attackAction(attacker,target,dmg);}}

// Jump
function jumpAction(player,x,y,maxJump){const dist=getDistance(player,{x,y}); if(dist<=maxJump){player.x=x;player.y=y; renderPlayers(); console.log(`${player.name} jumped to (${x},${y})`);}}

// Status effects
function applyStatus(target,effect,value,duration){target.status=target.status||{};target.status[effect]={value,duration}; console.log(`${target.name} got status ${effect}(${value}) for ${duration} turns`);}
function applyAdvantage(player){player.advantage=true;}
function applyDisadvantage(player){player.disadvantage=true;}

// === Perform any action ===
function performAction(player,key){
  const action=player.actions[key];
  if(!action || (action.currentCooldown>0)) return;

  // Movement
  if(action.move) moveAction(player,typeof action.move==='string'?rollDice(action.move):action.move,action.jump||0);

  // Attack/Heal
  if(action.attack || action.heal){
    const val=action.attack? (typeof action.attack==='string'?rollDice(action.attack):action.attack) : (typeof action.heal==='string'?rollDice(action.heal):action.heal);
    const type=action.attack?'enemy':'ally';
    highlightTargets(player,type,val,action.range||1,action.attack?'attack':'heal',action.target||1);
  }

  // Shield / Cooldown / Status
  if(action.shield) shieldAction(player,action.shield);
  if(action.cooldown) applyCooldown(action);
  if(action.status) applyStatus(player,action.status.name,action.status.value,action.status.duration);

  // Push / Pull / Destroy / Pierce
  if(action.push) pushTarget(player,getEnemies(player)[0],action.push);
  if(action.pull) pullTarget(player,getEnemies(player)[0],action.pull);
  if(action.destroy) destroyAction(player.x,player.y);
  if(action.pierce) pierceAction(player,[{x:player.x+1,y:player.y}],action.pierce);

  if(action.advantage) applyAdvantage(player);
  if(action.disadvantage) applyDisadvantage(player);
  if(action['attack+']) player.nextAttackBonus=(player.nextAttackBonus||0)+action['attack+'];
  if(action['move+']) player.nextMoveBonus=(player.nextMoveBonus||0)+action['move+'];
}

// === Highlight targets with click handlers ===
function highlightTargets(player,type,value,range,mode='attack',maxTargets=1){
  clearHighlights();
  const candidates=(type==='enemy')?getEnemies(player):getAllies(player);
  let selectedCount=0;
  candidates.forEach(t=>{
    if(inRange(player,t,range) && selectedCount<maxTargets){
      const idx=t.y*currentMap.size.w+t.x;
      const cell=grid.children[idx];
      cell.classList.add('highlight');
      cell.onclick=()=>{
        if(mode==='attack') attackAction(player,t,value);
        else if(mode==='heal') healAction(player,t,value);
        selectedCount++;
        clearHighlights();
        actionsTaken.push('action');
        if(actionsTaken.length>=2) nextTurn(); else populateMainMenu();
      };
    }
  });
}

// === Menu ===
const submenu=document.getElementById('submenu');
function populateMainMenu(){
  submenu.innerHTML='';
  submenu.style.display='flex'; submenu.style.flexWrap='wrap'; submenu.style.gap='10px'; submenu.style.width='260px';
  const opts=[{name:'Actions',type:'action'},{name:'Ability',type:'ability'},{name:'Item',type:'item'},{name:'Skip Turn',type:'skip'}];
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
    if(action.currentCooldown>0){btn.disabled=true; btn.style.opacity=0.5;}
    btn.onclick=()=>{performAction(activePlayer,key);};
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
showTurn();
populateMainMenu();
renderPlayers();
