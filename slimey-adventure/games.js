const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// canvas fit
function fitCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

// TILE SIZE
const TILE_SIZE = 50;

// KEY INPUT
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// ------------------------
// MAP CONFIGURATION
// Use a 2D array to define your level
// W = wall
// P = Player 1 start
// A = Player 2 start
// E = empty space
// G = goal (example, optional)
const maps = [
  {
    name: "Level 1",
    grid: [
      ['W','W','W','W','W','W','W','W','W','W'],
      ['W','P','E','E','W','E','E','A','E','W'],
      ['W','E','W','E','W','E','W','E','E','W'],
      ['W','E','W','E','E','E','W','E','W','W'],
      ['W','E','E','E','W','E','E','E','E','W'],
      ['W','W','W','E','W','W','W','W','E','W'],
      ['W','E','E','E','E','E','E','W','E','W'],
      ['W','E','W','W','W','E','E','E','E','W'],
      ['W','E','E','E','E','E','W','E','G','W'],
      ['W','W','W','W','W','W','W','W','W','W'],
    ]
  }
];

// ------------------------
// GAME STATE
let currentMap = 0;
let mapGrid = maps[currentMap].grid;

// Players
const players = [
  { x:0, y:0, color:'#00FFFF', keyUp:'w', keyDown:'s', keyLeft:'a', keyRight:'d' },
  { x:0, y:0, color:'#FFFF00', keyUp:'ArrowUp', keyDown:'ArrowDown', keyLeft:'ArrowLeft', keyRight:'ArrowRight' }
];

// Initialize player positions based on map
function initPlayers() {
  for (let y=0;y<mapGrid.length;y++){
    for (let x=0;x<mapGrid[y].length;x++){
      if (mapGrid[y][x] === 'P') { players[0].x = x; players[0].y = y; mapGrid[y][x]='E'; }
      if (mapGrid[y][x] === 'A') { players[1].x = x; players[1].y = y; mapGrid[y][x]='E'; }
    }
  }
}
initPlayers();

// ------------------------
// HELPER FUNCTIONS
function drawTile(x, y, color){
  ctx.fillStyle = color;
  ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = '#222';
  ctx.strokeRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

// Check if a tile is walkable
function isWalkable(x,y){
  if (y<0||y>=mapGrid.length||x<0||x>=mapGrid[0].length) return false;
  return mapGrid[y][x] === 'E' || mapGrid[y][x] === 'G';
}

// ------------------------
// GAME LOOP
function update(){
  // Player movement
  for (const p of players){
    let dx=0, dy=0;
    if (keys[p.keyUp]) dy=-1;
    if (keys[p.keyDown]) dy=1;
    if (keys[p.keyLeft]) dx=-1;
    if (keys[p.keyRight]) dx=1;

    // Only move if destination is walkable
    const newX = p.x + dx;
    const newY = p.y + dy;
    if (isWalkable(newX,newY)) { p.x=newX; p.y=newY; }

    // Reset keys so holding doesn't move multiple tiles instantly
    if (dx!==0||dy!==0){
      keys[p.keyUp]=keys[p.keyDown]=keys[p.keyLeft]=keys[p.keyRight]=false;
    }
  }
}

// Render map and players
function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Draw tiles
  for (let y=0;y<mapGrid.length;y++){
    for (let x=0;x<mapGrid[y].length;x++){
      const tile = mapGrid[y][x];
      if (tile==='W') drawTile(x,y,'#444');
      else if (tile==='G') drawTile(x,y,'#66FF66');
      else drawTile(x,y,'#111');
    }
  }

  // Draw players
  for (const p of players){
    drawTile(p.x, p.y, p.color);
  }
}

// Main loop
function loop(){
  update();
  render();
  requestAnimationFrame(loop);
}
loop();

// ------------------------
// MAP SWITCH EXAMPLE (press 1/2/3 to switch maps)
window.addEventListener('keydown', e=>{
  if (e.key==='1'){ currentMap=0; mapGrid=maps[currentMap].grid; initPlayers(); }
});
