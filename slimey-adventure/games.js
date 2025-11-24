const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Resize canvas
function fitCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

const TILE_SIZE = 50;
const MOVE_SPEED = 8; // pixels per frame for smooth movement
const keys = {};

// INPUT
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// ------------------------
// MAPS
// W=Wall, P=Player1, A=Player2, E=Empty, G=Goal, B=Pushable block
const maps = [
  {
    name:"Teamwork Labyrinth 1",
    grid:[
      ['W','W','W','W','W','W','W','W','W','W'],
      ['W','P','E','B','E','E','B','E','A','W'],
      ['W','E','W','E','W','E','W','E','E','W'],
      ['W','E','W','E','E','E','W','E','G','W'],
      ['W','W','W','W','W','W','W','W','W','W'],
    ]
  },
  {
    name:"Teamwork Labyrinth 2",
    grid:[
      ['W','W','W','W','W','W','W','W'],
      ['W','P','B','E','E','B','A','W'],
      ['W','E','W','E','E','W','E','W'],
      ['W','G','E','B','B','E','G','W'],
      ['W','W','W','W','W','W','W','W'],
    ]
  }
];

// ------------------------
// GAME STATE
let currentMap = 0;
let mapGrid = maps[currentMap].grid;
let pushableBlocks = [];
let goals = [];
let movingPlayers = [null, null]; // track smooth movement

const players = [
  {x:0, y:0, targetX:0, targetY:0, color:'#00FFFF', keyUp:'w', keyDown:'s', keyLeft:'a', keyRight:'d'},
  {x:0, y:0, targetX:0, targetY:0, color:'#FFFF00', keyUp:'ArrowUp', keyDown:'ArrowDown', keyLeft:'ArrowLeft', keyRight:'ArrowRight'}
];

// Initialize map
function initMap() {
  pushableBlocks = [];
  goals = [];
  for(let y=0;y<mapGrid.length;y++){
    for(let x=0;x<mapGrid[y].length;x++){
      const tile = mapGrid[y][x];
      if(tile==='P'){ players[0].x=players[0].targetX=x*TILE_SIZE; players[0].y=players[0].targetY=y*TILE_SIZE; mapGrid[y][x]='E'; }
      if(tile==='A'){ players[1].x=players[1].targetX=x*TILE_SIZE; players[1].y=players[1].targetY=y*TILE_SIZE; mapGrid[y][x]='E'; }
      if(tile==='B') pushableBlocks.push({x:x, y:y}); // store tile coords
      if(tile==='G') goals.push({x:x, y:y});
    }
  }
}
initMap();

// ------------------------
// SPLITSCREEN TOGGLE
let splitScreen = false;
window.addEventListener('keydown', e => { if(e.key==='Tab'){ splitScreen = !splitScreen; e.preventDefault(); } });

// ------------------------
// MAP SWITCHING
window.addEventListener('keydown', e=>{
  const num = parseInt(e.key);
  if(num>=1 && num<=maps.length){ currentMap=num-1; mapGrid=maps[currentMap].grid; initMap(); }
});

// ------------------------
// HELPERS
function drawRect(x,y,w,h,color){
  ctx.fillStyle=color;
  ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='#222';
  ctx.strokeRect(x,y,w,h);
}

function canMove(x,y){
  if(y<0||y>=mapGrid.length||x<0||x>=mapGrid[0].length) return false;
  if(mapGrid[y][x]==='W') return false;
  // Check blocks
  for(const b of pushableBlocks){
    if(b.x===x && b.y===y) return false;
  }
  return true;
}

// ------------------------
// GAME LOGIC
function update(){
  // Move players smoothly towards target
  for(let i=0;i<2;i++){
    const p = players[i];
    if(p.x !== p.targetX) p.x += Math.sign(p.targetX - p.x) * MOVE_SPEED;
    if(p.y !== p.targetY) p.y += Math.sign(p.targetY - p.y) * MOVE_SPEED;

    if(Math.abs(p.x - p.targetX) < MOVE_SPEED) p.x = p.targetX;
    if(Math.abs(p.y - p.targetY) < MOVE_SPEED) p.y = p.targetY;
  }

  // Check input for movement
  for(let i=0;i<2;i++){
    const p = players[i];
    if(p.x===p.targetX && p.y===p.targetY){
      let dx=0, dy=0;
      if(keys[p.keyUp]) dy=-1;
      if(keys[p.keyDown]) dy=1;
      if(keys[p.keyLeft]) dx=-1;
      if(keys[p.keyRight]) dx=1;

      if(dx!==0 || dy!==0){
        tryMove(i, dx, dy);
        keys[p.keyUp]=keys[p.keyDown]=keys[p.keyLeft]=keys[p.keyRight]=false;
      }
    }
  }

  checkWinCondition();
}

// Attempt to move player and push block
function tryMove(playerIndex, dx, dy){
  const p = players[playerIndex];
  const newX = p.targetX/TILE_SIZE + dx;
  const newY = p.targetY/TILE_SIZE + dy;

  // Check for block at target
  let block = pushableBlocks.find(b => b.x===newX && b.y===newY);
  if(block){
    const nextX = block.x + dx;
    const nextY = block.y + dy;
    if(canMove(nextX,nextY)){
      block.x = nextX;
      block.y = nextY;
      p.targetX = newX*TILE_SIZE;
      p.targetY = newY*TILE_SIZE;
    }
  } else if(canMove(newX,newY)){
    p.targetX = newX*TILE_SIZE;
    p.targetY = newY*TILE_SIZE;
  }
}

// ------------------------
// WIN CONDITION
function checkWinCondition(){
  for(const g of goals){
    let covered=false;
    for(const b of pushableBlocks){
      if(b.x===g.x && b.y===g.y){ covered=true; break; }
    }
    if(!covered) return; // at least one goal not covered
  }
  // All goals covered
  setTimeout(()=>{
    alert(`Level Completed: ${maps[currentMap].name}`);
    nextMap();
  },10);
}

function nextMap(){
  currentMap=(currentMap+1)%maps.length;
  mapGrid=maps[currentMap].grid;
  initMap();
}

// ------------------------
// RENDER
function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(splitScreen){
    const halfWidth=canvas.width/2;
    for(let i=0;i<2;i++){
      ctx.save();
      ctx.beginPath();
      ctx.rect(i*halfWidth,0,halfWidth,canvas.height); ctx.clip();
      const camX=players[i].x - halfWidth/2 + TILE_SIZE/2;
      const camY=players[i].y - canvas.height/2 + TILE_SIZE/2;
      ctx.translate(-camX + i*halfWidth, -camY);
      drawMapAndEntities();
      ctx.restore();
      ctx.strokeStyle='#FFF';
      ctx.beginPath(); ctx.moveTo(i*halfWidth,0); ctx.lineTo(i*halfWidth,canvas.height); ctx.stroke();
    }
  } else {
    const centerX=(players[0].x + players[1].x)/2;
    const centerY=(players[0].y + players[1].y)/2;
    const camX=centerX - canvas.width/2;
    const camY=centerY - canvas.height/2;
    ctx.save(); ctx.translate(-camX,-camY);
    drawMapAndEntities();
    ctx.restore();
  }
}

// Draw map, blocks, players
function drawMapAndEntities(){
  for(let y=0;y<mapGrid.length;y++){
    for(let x=0;x<mapGrid[y].length;x++){
      const tile=mapGrid[y][x];
      if(tile==='W') drawRect(x*TILE_SIZE,y*TILE_SIZE,TILE_SIZE,TILE_SIZE,'#444');
      else if(tile==='G') drawRect(x*TILE_SIZE,y*TILE_SIZE,TILE_SIZE,TILE_SIZE,'#66FF66');
      else drawRect(x*TILE_SIZE,y*TILE_SIZE,TILE_SIZE,TILE_SIZE,'#111');
    }
  }
  for(const b of pushableBlocks) drawRect(b.x*TILE_SIZE,b.y*TILE_SIZE,TILE_SIZE,TILE_SIZE,'#FF66CC');
  for(const p of players) drawRect(p.x,p.y,TILE_SIZE,TILE_SIZE,p.color);
}

// ------------------------
// MAIN LOOP
function loop(){ update(); render(); requestAnimationFrame(loop); }
loop();
