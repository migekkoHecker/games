const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 50;
const MOVE_SPEED = 8; // pixels per frame
const keys = {};

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);
window.addEventListener('resize', () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; });
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// MAPS
const maps = [
  {
    name:"Teamwork Starter",
    // Very simple introduction level
    grid:[
      ['W','W','W','W','W','W','W'],
      ['W','P','E','B','G','A','W'],
      ['W','W','W','W','W','W','W']
    ]
    // Explanation:
    // Player1 (P) pushes the block onto the goal (G). Player2 (A) is just at the side.
  },
  {
    name:"Double Push",
    // Both players must push blocks to goals
    grid:[
      ['W','W','W','W','W','W','W','W','W'],
      ['W','P','B','E','G','E','B','A','W'],
      ['W','E','W','E','W','E','W','E','W'],
      ['W','E','E','E','E','E','E','E','W'],
      ['W','W','W','W','W','W','W','W','W']
    ]
    // Explanation:
    // Player1 pushes left block to left goal.
    // Player2 pushes right block to right goal.
    // Both must cooperate to finish.
  },
  {
    name:"Bridge the Gap",
    // Players must move blocks sequentially to cross narrow paths
    grid:[
      ['W','W','W','W','W','W','W','W','W','W'],
      ['W','P','E','B','E','G','E','B','E','A','W'],
      ['W','E','W','E','W','E','W','E','W','E','W'],
      ['W','E','E','E','E','E','E','E','E','E','W'],
      ['W','W','W','W','W','W','W','W','W','W','W']
    ]
    // Explanation:
    // Players must push blocks to create paths for each other.
    // Cannot finish unless both push their blocks in correct order.
  }
];


let currentMap = 0;
let mapGrid = maps[currentMap].grid;
let pushableBlocks = [];
let goals = [];

const players = [
  {tileX:0, tileY:0, x:0, y:0, color:'#1E90FF', keyUp:'w', keyDown:'s', keyLeft:'a', keyRight:'d', moving:false, moveDir:null},
  {tileX:0, tileY:0, x:0, y:0, color:'#FF8C00', keyUp:'ArrowUp', keyDown:'ArrowDown', keyLeft:'ArrowLeft', keyRight:'ArrowRight', moving:false, moveDir:null}
];

function initMap(){
  pushableBlocks = [];
  goals = [];
  for(let y=0;y<mapGrid.length;y++){
    for(let x=0;x<mapGrid[y].length;x++){
      const tile = mapGrid[y][x];
      if(tile==='P'){ players[0].tileX=x; players[0].tileY=y; players[0].x=x*TILE_SIZE; players[0].y=y*TILE_SIZE; mapGrid[y][x]='E'; }
      if(tile==='A'){ players[1].tileX=x; players[1].tileY=y; players[1].x=x*TILE_SIZE; players[1].y=y*TILE_SIZE; mapGrid[y][x]='E'; }
      if(tile==='B') pushableBlocks.push({x:x,y:y});
      if(tile==='G') goals.push({x:x,y:y});
    }
  }
}
initMap();

let splitScreen = false;
window.addEventListener('keydown', e => { if(e.key==='Tab'){ splitScreen=!splitScreen; e.preventDefault(); }});
window.addEventListener('keydown', e => { const num=parseInt(e.key); if(num>=1 && num<=maps.length){ currentMap=num-1; mapGrid=maps[currentMap].grid; initMap(); }});

function canMove(tileX,tileY){
  if(tileY<0||tileY>=mapGrid.length||tileX<0||tileX>=mapGrid[0].length) return false;
  if(mapGrid[tileY][tileX]==='W') return false;
  for(const b of pushableBlocks){ if(b.x===tileX && b.y===tileY) return false; }
  return true;
}

function tryMovePlayer(i,dx,dy){
  const p = players[i];
  if(p.moving) return; // already moving
  const targetTileX = p.tileX + dx;
  const targetTileY = p.tileY + dy;

  // Check for block
  let block = pushableBlocks.find(b=>b.x===targetTileX && b.y===targetTileY);
  if(block){
    const nextX = block.x + dx;
    const nextY = block.y + dy;
    if(canMove(nextX,nextY)){
      block.x = nextX; block.y = nextY;
      p.tileX = targetTileX; p.tileY = targetTileY;
      p.moving = true; p.moveDir={dx,dy};
    }
  } else if(canMove(targetTileX,targetTileY)){
    p.tileX = targetTileX; p.tileY = targetTileY;
    p.moving = true; p.moveDir={dx,dy};
  }
}

function update(){
  for(let i=0;i<2;i++){
    const p = players[i];
    // handle input if not moving
    if(!p.moving){
      let dx=0, dy=0;
      if(keys[p.keyUp]) dy=-1;
      if(keys[p.keyDown]) dy=1;
      if(keys[p.keyLeft]) dx=-1;
      if(keys[p.keyRight]) dx=1;
      if(dx!==0 || dy!==0){
        tryMovePlayer(i, dx, dy);
        keys[p.keyUp]=keys[p.keyDown]=keys[p.keyLeft]=keys[p.keyRight]=false;
      }
    }

    // smooth movement
    if(p.moving){
      const targetX = p.tileX*TILE_SIZE;
      const targetY = p.tileY*TILE_SIZE;
      if(p.x<targetX) p.x = Math.min(p.x+MOVE_SPEED, targetX);
      if(p.x>targetX) p.x = Math.max(p.x-MOVE_SPEED, targetX);
      if(p.y<targetY) p.y = Math.min(p.y+MOVE_SPEED, targetY);
      if(p.y>targetY) p.y = Math.max(p.y-MOVE_SPEED, targetY);

      if(p.x===targetX && p.y===targetY) p.moving=false;
    }
  }

  checkWinCondition();
}

function checkWinCondition(){
  for(const g of goals){
    let covered=false;
    for(const b of pushableBlocks){
      if(b.x===g.x && b.y===g.y){ covered=true; break; }
    }
    if(!covered) return;
  }
  setTimeout(()=>{ alert(`Level Completed: ${maps[currentMap].name}`); nextMap(); },10);
}

function nextMap(){
  currentMap = (currentMap+1)%maps.length;
  mapGrid = maps[currentMap].grid;
  initMap();
}

function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(splitScreen){
    const halfWidth=canvas.width/2;
    for(let i=0;i<2;i++){
      ctx.save();
      ctx.beginPath();
      ctx.rect(i*halfWidth,0,halfWidth,canvas.height); ctx.clip();
      const camX = players[i].x - halfWidth/2 + TILE_SIZE/2;
      const camY = players[i].y - canvas.height/2 + TILE_SIZE/2;
      ctx.translate(-camX+i*halfWidth,-camY);
      drawMapAndEntities();
      ctx.restore();
      ctx.strokeStyle='#FFF'; ctx.beginPath(); ctx.moveTo(i*halfWidth,0); ctx.lineTo(i*halfWidth,canvas.height); ctx.stroke();
    }
  } else {
    const centerX=(players[0].x+players[1].x)/2;
    const centerY=(players[0].y+players[1].y)/2;
    ctx.save(); ctx.translate(-centerX+canvas.width/2, -centerY+canvas.height/2);
    drawMapAndEntities();
    ctx.restore();
  }
}

function drawRect(x, y, w, h, color){
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#222';
    ctx.strokeRect(x, y, w, h);
}

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

function loop(){ update(); render(); requestAnimationFrame(loop); }
loop();
