const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

const WORLD = { w: 1200, h: 800 };

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rnd(min, max) { return Math.random()*(max-min)+min; }
function now() { return performance.now(); }

// PLAYER CONFIG
const PLAYER_CONFIGS = [
  { color: '#00FFFF', start: {x:200,y:200}, keys: {up:'w',down:'s',left:'a',right:'d',attack:' '}, name:'P1' },
  { color: '#FFFF00', start: {x:400,y:200}, keys: {up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',attack:'Enter'}, name:'P2' }
];

// obstacles
const obstacles = [
  {x:300,y:150,w:200,h:40}, {x:600,y:100,w:40,h:300},
  {x:150,y:400,w:400,h:40}, {x:700,y:500,w:500,h:40},
];

// pickups
const pickups = []; // {x,y,type,spawnTime}

// bullets
const bullets = []; // {x,y,vx,vy,owner,ttl,damage}

// players
const players = [];
const defaultSize = 40;
for (let i=0;i<PLAYER_CONFIGS.length;i++){
  const cfg = PLAYER_CONFIGS[i];
  players.push({
    id: i,
    name: cfg.name,
    color: cfg.color,
    x: cfg.start.x,
    y: cfg.start.y,
    vx: 0,
    vy: 0,
    w: defaultSize,
    h: defaultSize,
    speed: 2.5, // slower speed
    maxHp: 100,
    hp: 100,
    dirX: 1, dirY: 0,
    attackCooldown: 0,
    score: 0,
  });
}

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => { keys[e.key] = false; });

// collisions
function rectsOverlap(a,b){
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}
function resolveCollisions(p) {
  p.x = clamp(p.x, 0, WORLD.w - p.w);
  p.y = clamp(p.y, 0, WORLD.h - p.h);
  for (const o of obstacles) {
    if (!rectsOverlap(p, o)) continue;
    const dxLeft = (o.x) - (p.x + p.w);
    const dxRight = (o.x + o.w) - p.x;
    const dyTop = o.y - (p.y + p.h);
    const dyBottom = (o.y + o.h) - p.y;
    const absX = Math.min(Math.abs(dxLeft), Math.abs(dxRight));
    const absY = Math.min(Math.abs(dyTop), Math.abs(dyBottom));
    if (absX < absY) {
      if (Math.abs(dxLeft) < Math.abs(dxRight)) p.x = o.x - p.w; else p.x = o.x + o.w;
      p.vx = 0;
    } else {
      if (Math.abs(dyTop) < Math.abs(dyBottom)) p.y = o.y - p.h; else p.y = o.y + o.h;
      p.vy = 0;
    }
  }
  for (const other of players) {
    if (other === p) continue;
    if (rectsOverlap(p, other)) {
      const mx = (p.x + p.w/2) - (other.x + other.w/2);
      const my = (p.y + p.h/2) - (other.y + other.h/2);
      const dist = Math.max(1, Math.abs(mx)+Math.abs(my));
      const push = 6;
      const nx = mx/dist; const ny = my/dist;
      p.x += nx * push;
      p.y += ny * push;
      other.x -= nx * push;
      other.y -= ny * push;
    }
  }
}

// pickups
let lastPickupTime = now();
function maybeSpawnPickup() {
  if (now() - lastPickupTime < 3000) return;
  lastPickupTime = now();
  if (pickups.length > 4) return;
  for (let attempt=0; attempt<20; attempt++){
    const x = rnd(50, WORLD.w - 50);
    const y = rnd(50, WORLD.h - 50);
    const rect = {x:x-12,y:y-12,w:24,h:24};
    let ok=true;
    for (const o of obstacles) if (rectsOverlap(rect,o)) { ok=false; break; }
    if (!ok) continue;
    const type = Math.random()<0.7 ? 'health':'speed';
    pickups.push({x,y,type,spawnTime:now(), ttl:15000});
    break;
  }
}

// attack
function doAttack(p){
  if (p.attackCooldown>0) return;
  p.attackCooldown = 650;
  const speed = 7;
  const dirx = p.dirX || 1;
  const diry = p.dirY || 0;
  const mag = Math.hypot(dirx,diry) || 1;
  bullets.push({x: p.x+p.w/2, y:p.y+p.h/2, vx:dirx/mag*speed, vy:diry/mag*speed, owner:p.id, ttl:2000, damage:20, size:10});
}

// damage
function hurtPlayer(p,dmg,attackerId){
  p.hp -= dmg;
  if (p.hp<=0){
    p.hp=p.maxHp;
    p.x = rnd(60, WORLD.w-60);
    p.y = rnd(60, WORLD.h-60);
    const atk = players.find(z=>z.id===attackerId);
    if (atk) atk.score += 1;
  }
}

// bullets update
function updateBullets(dt){
  for (let i=bullets.length-1;i>=0;i--){
    const b = bullets[i];
    b.x += b.vx * dt/16;
    b.y += b.vy * dt/16;
    b.ttl -= dt;
    const rectB = {x:b.x-b.size/2, y:b.y-b.size/2, w:b.size, h:b.size};
    if (b.x<0||b.y<0||b.x>WORLD.w||b.y>WORLD.h){ bullets.splice(i,1); continue; }
    for (const o of obstacles) if (rectsOverlap(rectB,o)) { bullets.splice(i,1); break; }
    for (const p of players){
      if (p.id===b.owner) continue;
      if (rectsOverlap(rectB,p)) { hurtPlayer(p,b.damage,b.owner); bullets.splice(i,1); break; }
    }
  }
}

// main update
let lastTime = now();
function update(){
  const t = now();
  const dt = Math.min(40,t-lastTime);
  lastTime=t;

  maybeSpawnPickup();
  updateBullets(dt);

  for (const p of players){
    const cfg = PLAYER_CONFIGS[p.id].keys;
    let mx=0,my=0;
    if (keys[cfg.up]) my-=1;
    if (keys[cfg.down]) my+=1;
    if (keys[cfg.left]) mx-=1;
    if (keys[cfg.right]) mx+=1;
    if (mx||my){ p.dirX=mx; p.dirY=my; }

    const ms = p.speed * (p.speedBoost||1);
    if (mx||my){
      const m = Math.hypot(mx,my)||1;
      p.vx += mx/m*ms*dt/16;
      p.vy += my/m*ms*dt/16;
    } else { p.vx*=0.85; p.vy*=0.85; }

    if (keys[cfg.attack]) doAttack(p);

    p.x+=p.vx; p.y+=p.vy;

    if (p.attackCooldown>0) p.attackCooldown=Math.max(0,p.attackCooldown-dt);

    // pickups
    for (let i=pickups.length-1;i>=0;i--){
      const pk=pickups[i];
      const pr={x:pk.x-12,y:pk.y-12,w:24,h:24};
      if (rectsOverlap(pr,p)){
        if (pk.type==='health') p.hp=Math.min(p.maxHp,p.hp+35);
        else if (pk.type==='speed'){
          p.speedBoost=1.6;
          setTimeout(()=>{p.speedBoost=1;},5000);
        }
        pickups.splice(i,1);
      }
    }

    resolveCollisions(p);
  }
}

// render
function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const viewW=canvas.width, viewH=canvas.height;
  // camera center at avg
  const camCenter = {x:(players[0].x+players[1].x)/2, y:(players[0].y+players[1].y)/2};
  const cam = {x: clamp(camCenter.x-viewW/2,0,WORLD.w-viewW), y: clamp(camCenter.y-viewH/2,0,WORLD.h-viewH)};

  ctx.save();
  ctx.translate(-cam.x,-cam.y);

  // background grid
  ctx.fillStyle='#0b0b0b';
  for (let gx=0;gx<WORLD.w;gx+=80) ctx.fillRect(gx,0,2,WORLD.h);
  for (let gy=0;gy<WORLD.h;gy+=80) ctx.fillRect(0,gy,WORLD.w,2);

  // obstacles
  for (const o of obstacles){ ctx.fillStyle='#444'; ctx.fillRect(o.x,o.y,o.w,o.h); }

  // pickups
  for (const pk of pickups){
    ctx.fillStyle=(pk.type==='health')?'#ff6666':'#66f';
    ctx.fillRect(pk.x-12,pk.y-12,24,24);
  }

  // bullets
  for (const b of bullets){
    ctx.fillStyle='#ffcc66';
    ctx.beginPath();
    ctx.arc(b.x,b.y,b.size/2,0,Math.PI*2);
    ctx.fill();
  }

  // players
  for (const p of players){
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x,p.y,p.w,p.h);
    // hp bar
    ctx.fillStyle='#000';
    ctx.fillRect(p.x,p.y-12,p.w,8);
    ctx.fillStyle='#e33';
    ctx.fillRect(p.x,p.y-12,p.w*(p.hp/p.maxHp),8);
    ctx.fillStyle='#fff';
    ctx.font='12px sans-serif';
    ctx.fillText(`${p.name} ${Math.floor(p.hp)}/${p.maxHp}`,p.x,p.y-18);
  }

  ctx.restore();

  // HUD
  ctx.fillStyle='#fff';
  ctx.font='14px sans-serif';
  ctx.fillText(`P1 Score:${players[0].score} HP:${Math.floor(players[0].hp)}`,10,20);
  ctx.fillText(`P2 Score:${players[1].score} HP:${Math.floor(players[1].hp)}`,10,40);
}
function loop(){ update(); render(); requestAnimationFrame(loop); }
loop();
