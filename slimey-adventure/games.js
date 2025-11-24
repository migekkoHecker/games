const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Resize canvas
function fitCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

// TILE SIZE
const TILE_SIZE = 50;

// INPUT
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// ------------------------
// MAP CONFIGURATION
// Legend: W = Wall, P = Player1 start, A = Player2 start, E = empty, G = goal, B = pushable block
const maps = [
  {
    name: "Push Labyrinth",
    grid: [
      ['W','W','W','W','W','W','W','W','W','W','W','W'],
      ['W','P','E','E','B','E','E','E','E','E','A','W'],
      ['W','E','W','E','W','E','W','E','W','E','E','W'],
      ['W','E','W','E','E','E','W','E','E','B','E','W'],
      ['W','E','E','E','W','E','E','E','W','E','E','W'],
      ['W','W','W','E','W','W','W','E','W','W','W','W'],
      ['W','E','E','E','E','E','E','E','E','E','E','W'],
      ['W','E','W','W','W','E','E','E','W','W','W','W'],
      ['W','E','E','E','E','E','W','E','E','E','G','W'],
      ['W','W','W','W','W','W','W','W','W','W','W','W'],
    ]
  }
];

// ------------------------
// GAME STATE
let currentMap = 0;
let mapGrid = maps[currentMap].grid;
const pushableBlocks = []; // {x,y}

// Players
const players = [
  { x:0, y:0, color:'#00FFFF', keyUp:'w', keyDown:'s', keyLeft:'a', keyRight:'d', speed:2.5 },
  { x:0, y:0, color:'#FFFF00', keyUp:'ArrowUp', keyDown:'ArrowDown', keyLeft:'ArrowLeft', keyRight:'ArrowRight', speed:2.5 }
];

// Initialize player positions and pushable blocks
function initMap() {
  pushableBlocks.length = 0;
  for (let y=0;y<mapGrid.length;y++){
    for (let x=0;x<mapGrid[y].length;x++){
      const tile = mapGrid[y][x];
      if(tile==='P') { players[0].x=x*TILE_SIZE; players[0].y=y*TILE_SIZE; mapGrid[y][x]='E'; }
      if(tile==='A') { players[1].x=x*TILE_SIZE; players[1].y=y*TILE_SIZE; mapGrid[y][x]='E'; }
      if(tile==='B') { pushableBlocks.push({x:x*TILE_SIZE, y:y*TILE_SIZE}); mapGrid[y][x]='E'; }
    }
  }
}
initMap();

// ------------------------
// SPLITSCREEN TOGGLE
let splitScreen = false;
window.addEventListener('keydown', e => { if(e.key==='Tab'){ splitScreen = !splitScreen; e.preventDefault(); } });

// ------------------------
// HELPER FUNCTIONS
function drawRect(x,y,w,h,color){
  ctx.fillStyle = color;
  ctx.fillRect(x,y,w,h);
  ctx.strokeStyle = '#222';
  ctx.strokeRect(x,y,w,h);
}

function isCollidingRect(a,b){
  return a.x<a.x+b.w && a.x+a.w>b.x && a.y<a.y+b.h && a.y+a.h>b.y;
}

function isWalkable(x,y){
  const gridX = Math.floor(x/TILE_SIZE);
  const gridY = Math.floor(y/TILE_SIZE);
  if(gridY<0||gridY>=mapGrid.length||gridX<0||gridX>=mapGrid[0].length) return false;
  return mapGrid[gridY][gridX] === 'E' || mapGrid[gridY][gridX] === 'G';
}

// ------------------------
// UPDATE
function update(){
  for (const p of players){
    let dx=0, dy=0;
    if(keys[p.keyUp]) dy=-1;
    if(keys[p.keyDown]) dy=1;
    if(keys[p.keyLeft]) dx=-1;
    if(keys[p.keyRight]) dx=1;

    if(dx!==0||dy!==0){
      // Normalize diagonal movement
      const len = Math.hypot(dx,dy) || 1;
      dx = dx/len*p.speed;
      dy = dy/len*p.speed;

      // Attempt move with collision
      movePlayer(p, dx, dy);
    }
  }
}

// Move player with collision & push blocks
function movePlayer(p, dx, dy){
  let newPos = {x:p.x+dx, y:p.y+dy, w:TILE_SIZE, h:TILE_SIZE};

  // Check collision with walls
  const gridX = Math.floor(newPos.x/TILE_SIZE);
  const gridY = Math.floor(newPos.y/TILE_SIZE);
  if(gridY<0||gridY>=mapGrid.length||gridX<0||gridX>=mapGrid[0].length) return;
  if(mapGrid[gridY][gridX]==='W') return;

  // Check collision with other blocks
  for (const block of pushableBlocks){
    const blockRect = {x:block.x, y:block.y, w:TILE_SIZE, h:TILE_SIZE};
    if(isCollidingRect(newPos, blockRect)){
      // Attempt to push
      if(pushBlock(block, dx, dy)) { /* block moved, player can move */ }
      else return; // cannot push, block blocked
    }
  }

  // Move player
  p.x += dx;
  p.y += dy;
}

// Push block if possible
function pushBlock(block, dx, dy){
  const newPos = {x:block.x+dx, y:block.y+dy, w:TILE_SIZE, h:TILE_SIZE};

  // Check map collision
  const gridX = Math.floor(newPos.x/TILE_SIZE);
  const gridY = Math.floor(newPos.y/TILE_SIZE);
  if(gridY<0||gridY>=mapGrid.length||gridX<0||gridX>=mapGrid[0].length) return false;
  if(mapGrid[gridY][gridX]==='W') return false;

  // Check collision with other blocks
  for (const b of pushableBlocks){
    if(b===block) continue;
    const rect = {x:b.x, y:b.y, w:TILE_SIZE, h:TILE_SIZE};
    if(isCollidingRect(newPos, rect)) return false;
  }

  // Move block
  block.x += dx;
  block.y += dy;
  return true;
}

// ------------------------
// RENDER
function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(splitScreen){
    const halfWidth = canvas.width/2;
    for(let i=0;i<2;i++){
      ctx.save();
      ctx.beginPath();
      ctx.rect(i*halfWidth,0,halfWidth,canvas.height);
      ctx.clip();

      // Camera centers on player
      const camX = players[i].x - halfWidth/2 + TILE_SIZE/2;
      const camY = players[i].y - canvas.height/2 + TILE_SIZE/2;
      ctx.translate(-camX + i*halfWidth, -camY);

      drawMapAndEntities();

      ctx.restore();
      ctx.strokeStyle='#FFF';
      ctx.beginPath();
      ctx.moveTo(i*halfWidth,0); ctx.lineTo(i*halfWidth,canvas.height); ctx.stroke();
    }
  } else {
    // Shared camera
    const centerX = (players[0].x + players[1].x)/2;
    const centerY = (players[0].y + players[1].y)/2;
    const camX = centerX - canvas.width/2;
    const camY = centerY - canvas.height/2;
    ctx.save();
    ctx.translate(-camX,-camY);

    drawMapAndEntities();
    ctx.restore();
  }
}

// Draw map, blocks, and players
function drawMapAndEntities(){
  // Map tiles
  for(let y=0;y<mapGrid.length;y++){
    for(let x=0;x<mapGrid[y].length;x++){
      const tile = mapGrid[y][x];
      if(tile==='W') drawRect(x*TILE_SIZE,y*TILE_SIZE,TILE_SIZE,TILE_SIZE,'#444');
      else if(tile==='G') drawRect(x*TILE_SIZE,y*TILE_SIZE,TILE_SIZE,TILE_SIZE,'#66FF66');
      else drawRect(x*TILE_SIZE,y*TILE_SIZE,TILE_SIZE,TILE_SIZE,'#111');
    }
  }

  // Pushable blocks
  for(const b of pushableBlocks) drawRect(b.x,b.y,TILE_SIZE,TILE_SIZE,'#FF66CC');

  // Players
  for(const p of players) drawRect(p.x,p.y,TILE_SIZE,TILE_SIZE,p.color);
}

// ------------------------
// MAIN LOOP
function loop(){
  update();
  render();
  requestAnimationFrame(loop);
}
loop();
