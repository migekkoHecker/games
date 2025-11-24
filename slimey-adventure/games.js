const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// canvas fit
function fitCanvas(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
fitCanvas();
window.addEventListener('resize',fitCanvas);

const TILE_SIZE=50;
const keys={};
window.addEventListener('keydown',e=>keys[e.key]=true);
window.addEventListener('keyup',e=>keys[e.key]=false);

// ------------------------
// MAPS
// W=Wall, P=Player1 start, A=Player2 start, E=Empty, G=Goal, B=Pushable block
const maps=[
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
let currentMap=0;
let mapGrid=maps[currentMap].grid;
const pushableBlocks=[]; 
const goals=[];

const players=[
  {x:0,y:0,color:'#00FFFF',keyUp:'w',keyDown:'s',keyLeft:'a',keyRight:'d',speed:2.5},
  {x:0,y:0,color:'#FFFF00',keyUp:'ArrowUp',keyDown:'ArrowDown',keyLeft:'ArrowLeft',keyRight:'ArrowRight',speed:2.5}
];

function initMap(){
  pushableBlocks.length=0;
  goals.length=0;
  for(let y=0;y<mapGrid.length;y++){
    for(let x=0;x<mapGrid[y].length;x++){
      const tile=mapGrid[y][x];
      if(tile==='P'){ players[0].x=x*TILE_SIZE; players[0].y=y*TILE_SIZE; mapGrid[y][x]='E'; }
      if(tile==='A'){ players[1].x=x*TILE_SIZE; players[1].y=y*TILE_SIZE; mapGrid[y][x]='E'; }
      if(tile==='B') pushableBlocks.push({x:x*TILE_SIZE,y:y*TILE_SIZE});
      if(tile==='G') goals.push({x:x*TILE_SIZE,y:y*TILE_SIZE});
    }
  }
}
initMap();

// ------------------------
// SPLITSCREEN TOGGLE
let splitScreen=false;
window.addEventListener('keydown',e=>{ if(e.key==='Tab'){ splitScreen=!splitScreen; e.preventDefault(); } });

// ------------------------
// HELPER FUNCTIONS
function drawRect(x,y,w,h,color){
  ctx.fillStyle=color;
  ctx.fillRect(x,y,w,h);
  ctx.strokeStyle='#222';
  ctx.strokeRect(x,y,w,h);
}
function isCollidingRect(a,b){ return a.x<a.x+b.w && a.x+a.w>b.x && a.y<a.y+b.h && a.y+a.h>b.y; }
function isWalkable(x,y){
  const gridX=Math.floor(x/TILE_SIZE);
  const gridY=Math.floor(y/TILE_SIZE);
  if(gridY<0||gridY>=mapGrid.length||gridX<0||gridX>=mapGrid[0].length) return false;
  return mapGrid[gridY][gridX]==='E' || mapGrid[gridY][gridX]==='G';
}

// ------------------------
// UPDATE
function update(){
  for(const p of players){
    let dx=0,dy=0;
    if(keys[p.keyUp]) dy=-1;
    if(keys[p.keyDown]) dy=1;
    if(keys[p.keyLeft]) dx=-1;
    if(keys[p.keyRight]) dx=1;
    if(dx!==0||dy!==0){
      const len=Math.hypot(dx,dy)||1;
      dx=dx/len*p.speed;
      dy=dy/len*p.speed;
      movePlayer(p,dx,dy);
      keys[p.keyUp]=keys[p.keyDown]=keys[p.keyLeft]=keys[p.keyRight]=false;
    }
  }
  checkWinCondition();
}

function movePlayer(p, dx, dy){
  // Attempt X movement
  if(dx!==0){
    let newX = p.x + dx;
    const rectX = {x:newX, y:p.y, w:TILE_SIZE, h:TILE_SIZE};

    if(!checkCollision(rectX)){
      p.x = newX;
    }
  }

  // Attempt Y movement
  if(dy!==0){
    let newY = p.y + dy;
    const rectY = {x:p.x, y:newY, w:TILE_SIZE, h:TILE_SIZE};

    if(!checkCollision(rectY)){
      p.y = newY;
    }
  }
}

// Check collisions with walls and blocks
function checkCollision(rect){
  // Walls
  const gridX = Math.floor(rect.x / TILE_SIZE);
  const gridY = Math.floor(rect.y / TILE_SIZE);
  if(gridY<0||gridY>=mapGrid.length||gridX<0||gridX>=mapGrid[0].length) return true;
  if(mapGrid[gridY][gridX]==='W') return true;

  // Blocks
  for(const block of pushableBlocks){
    const blockRect={x:block.x, y:block.y, w:TILE_SIZE, h:TILE_SIZE};
    if(isCollidingRect(rect, blockRect)){
      // Try pushing
      if(pushBlock(block, rect.x - rectPrevX, rect.y - rectPrevY)){
        continue; // pushed block, no collision
      } else return true; // block cannot move
    }
  }
  return false;
}


// Push block if possible
function pushBlock(block,dx,dy){
  const newPos={x:block.x+dx,y:block.y+dy,w:TILE_SIZE,h:TILE_SIZE};
  const gridX=Math.floor(newPos.x/TILE_SIZE);
  const gridY=Math.floor(newPos.y/TILE_SIZE);
  if(gridY<0||gridY>=mapGrid.length||gridX<0||gridX>=mapGrid[0].length) return false;
  if(mapGrid[gridY][gridX]==='W') return false;
  for(const b of pushableBlocks){ if(b!==block && isCollidingRect(newPos,b)) return false; }
  block.x+=dx; block.y+=dy; return true;
}

// ------------------------
// WIN CONDITION
function checkWinCondition(){
  for(const goal of goals){
    let blockOnGoal=false;
    for(const block of pushableBlocks){
      if(Math.abs(block.x-goal.x)<TILE_SIZE/2 && Math.abs(block.y-goal.y)<TILE_SIZE/2){
        blockOnGoal=true; break;
      }
    }
    if(!blockOnGoal) return; // one goal not covered
  }
  // All goals covered!
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
// MAP SWITCHING
window.addEventListener('keydown',e=>{
  const num = parseInt(e.key);
  if(num>=1 && num<=maps.length){ currentMap=num-1; mapGrid=maps[currentMap].grid; initMap(); }
});

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
      const camX=players[i].x-halfWidth/2+TILE_SIZE/2;
      const camY=players[i].y-canvas.height/2+TILE_SIZE/2;
      ctx.translate(-camX+i*halfWidth,-camY);
      drawMapAndEntities();
      ctx.restore();
      ctx.strokeStyle='#FFF';
      ctx.beginPath(); ctx.moveTo(i*halfWidth,0); ctx.lineTo(i*halfWidth,canvas.height); ctx.stroke();
    }
  }else{
    const centerX=(players[0].x+players[1].x)/2;
    const centerY=(players[0].y+players[1].y)/2;
    const camX=centerX-canvas.width/2;
    const camY=centerY-canvas.height/2;
    ctx.save(); ctx.translate(-camX,-camY);
    drawMapAndEntities();
    ctx.restore();
  }
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
  for(const b of pushableBlocks) drawRect(b.x,b.y,TILE_SIZE,TILE_SIZE,'#FF66CC');
  for(const p of players) drawRect(p.x,p.y,TILE_SIZE,TILE_SIZE,p.color);
}

// ------------------------
// MAIN LOOP
function loop(){ update(); render(); requestAnimationFrame(loop); }
loop();
