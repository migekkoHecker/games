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

// INPUT
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// ------------------------
// MAP CONFIGURATION
// W = Wall, E = Empty, P = Player1, A = Player2, G = Goal
const maps = [
  {
    name: "Labyrinth",
    grid: [
      ['W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W'],
      ['W','P','E','E','W','E','E','E','W','E','E','E','E','W','E','E','E','E','A','W'],
      ['W','E','W','E','W','E','W','E','W','E','W','E','W','E','W','E','W','E','E','W'],
      ['W','E','W','E','E','E','W','E','E','E','W','E','E','E','W','E','E','E','E','W'],
      ['W','E','E','E','W','E','E','E','W','E','E','E','W','E','E','E','E','W','E','W'],
      ['W','W','W','E','W','W','W','E','W','W','W','E','W','W','W','E','W','W','E','W'],
      ['W','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','W'],
      ['W','E','W','W','W','E','E','E','W','W','W','E','E','E','W','W','W','E','E','W'],
      ['W','E','E','E','E','E','W','E','E','E','E','E','W','E','E','E','E','E','G','W'],
      ['W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W','W'],
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
// SPLITSCREEN TOGGLE
let splitScreen = false;
window.addEventListener('keydown', e => { if(e.key==='Tab'){ splitScreen = !splitScreen; e.preventDefault(); } });

// ------------------------
// HELPER FUNCTIONS
function drawTile(x, y, color){
  ctx.fillStyle = color;
  ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = '#222';
  ctx.strokeRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function isWalkable(x,y){
  if (y<0||y>=mapGrid.length||x<0||x>=mapGrid[0].length) return false;
  return mapGrid[y][x]==='E' || mapGrid[y][x]==='G';
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

    const newX = p.x + dx;
    const newY = p.y + dy;
    if(isWalkable(newX,newY)) p.x=newX, p.y=newY;

    if(dx!==0||dy!==0){
      keys[p.keyUp]=keys[p.keyDown]=keys[p.keyLeft]=keys[p.keyRight]=false;
    }
  }
}

// ------------------------
// CAMERA & RENDER
function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(splitScreen){
    // Draw each player in own viewport
    const halfWidth = canvas.width/2;
    for(let i=0;i<2;i++){
      ctx.save();
      ctx.beginPath();
      ctx.rect(i*halfWidth,0,halfWidth,canvas.height);
      ctx.clip();

      // Camera centers on player
      const camX = players[i].x*TILE_SIZE - halfWidth/2 + TILE_SIZE/2;
      const camY = players[i].y*TILE_SIZE - canvas.height/2 + TILE_SIZE/2;
      ctx.translate(-camX + i*halfWidth, -camY);

      // Draw map
      for(let y=0;y<mapGrid.length;y++){
        for(let x=0;x<mapGrid[y].length;x++){
          const tile = mapGrid[y][x];
          if(tile==='W') drawTile(x,y,'#444');
          else if(tile==='G') drawTile(x,y,'#66FF66');
          else drawTile(x,y,'#111');
        }
      }

      // Draw players
      for(const p of players) drawTile(p.x, p.y, p.color);

      ctx.restore();
      // Split line
      ctx.strokeStyle='#FFF'; ctx.beginPath();
      ctx.moveTo(i*halfWidth,0); ctx.lineTo(i*halfWidth,canvas.height); ctx.stroke();
    }
  } else {
    // Non-split: shared camera (center between players)
    const centerX = (players[0].x+players[1].x)/2*TILE_SIZE;
    const centerY = (players[0].y+players[1].y)/2*TILE_SIZE;
    const camX = centerX - canvas.width/2;
    const camY = centerY - canvas.height/2;
    ctx.save();
    ctx.translate(-camX,-camY);

    for(let y=0;y<mapGrid.length;y++){
      for(let x=0;x<mapGrid[y].length;x++){
        const tile = mapGrid[y][x];
        if(tile==='W') drawTile(x,y,'#444');
        else if(tile==='G') drawTile(x,y,'#66FF66');
        else drawTile(x,y,'#111');
      }
    }
    for(const p of players) drawTile(p.x, p.y, p.color);

    ctx.restore();
  }
}

// ------------------------
// MAIN LOOP
function loop(){
  update();
  render();
  requestAnimationFrame(loop);
}
loop();
