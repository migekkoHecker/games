/* game.js
  Local 4-player multiplayer with cubes:
  - Movement, collisions, projectiles, health, pickups, dash, camera, split-screen
  Controls:
   P1: WASD, Space (attack), Shift (dash)
   P2: Arrow keys, Enter (attack), RightShift (dash)
   P3: IJKL, M (attack), N (dash)
   P4: TFGH, Y (attack), R (dash)
  Toggle split-screen: Tab
*/

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

// WORLD
const WORLD = { w: 2400, h: 1600 };

// Utilities
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rnd(min, max) { return Math.random()*(max-min)+min; }
function now() { return performance.now(); }

// PLAYER CONFIG
const PLAYER_CONFIGS = [
  { color: '#00FFFF', start: {x:200,y:200}, keys: {up:'w',down:'s',left:'a',right:'d',attack:' ',dash:'Shift'}, name:'P1' },
  { color: '#FFFF00', start: {x:400,y:200}, keys: {up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',attack:'Enter',dash:'ShiftRight'}, name:'P2' },
  { color: '#FF88FF', start: {x:200,y:400}, keys: {up:'i',down:'k',left:'j',right:'l',attack:'m',dash:'n'}, name:'P3' },
  { color: '#88FF88', start: {x:400,y:400}, keys: {up:'t',down:'g',left:'f',right:'h',attack:'y',dash:'r'}, name:'P4' },
];

// map obstacles (rectangles)
const obstacles = [
  {x:600,y:300,w:300,h:60}, {x:1200,y:200,w:60,h:500},
  {x:300,y:900,w:700,h:60}, {x:1400,y:900,w:800,h:60},
  {x:1800,y:400,w:60,h:600}, {x:900,y:1200,w:400,h:60}
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
    speed: 3.6,
    maxHp: 100,
    hp: 100,
    dirX: 1, dirY: 0,
    dashCooldown: 0,
    attackCooldown: 0,
    dashTime: 0,
    invulnTime: 0,
    score: 0,
  });
}

// input state
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  // prevent default for movement keys to avoid scroll
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ',' '].includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

let splitScreen = false;
window.addEventListener('keydown', e => {
  if (e.key === 'Tab') { e.preventDefault(); splitScreen = !splitScreen; }
});

// Camera helpers
function getGroupCenter() {
  // center average of active players
  let ax=0, ay=0, n=0;
  for (const p of players) { ax+=p.x; ay+=p.y; n++; }
  return {x: ax/n, y: ay/n};
}

function worldToScreen(cam, wx, wy, viewW, viewH) {
  return { x: Math.floor((wx - cam.x + viewW/2)), y: Math.floor((wy - cam.y + viewH/2)) };
}

// collision helpers
function rectsOverlap(a,b){
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

// block movement by obstacles and world bounds
function resolveCollisions(p) {
  // world bounds
  p.x = clamp(p.x, 0, WORLD.w - p.w);
  p.y = clamp(p.y, 0, WORLD.h - p.h);

  // obstacle collisions - simple axis separation
  for (const o of obstacles) {
    const rectP = {x:p.x, y:p.y, w:p.w, h:p.h};
    if (!rectsOverlap(rectP, o)) continue;
    // get penetration distances
    const dxLeft = (o.x) - (p.x + p.w);
    const dxRight = (o.x + o.w) - p.x;
    const dyTop = o.y - (p.y + p.h);
    const dyBottom = (o.y + o.h) - p.y;

    // pick minimal penetration axis
    const absX = Math.min(Math.abs(dxLeft), Math.abs(dxRight));
    const absY = Math.min(Math.abs(dyTop), Math.abs(dyBottom));

    if (absX < absY) {
      // separate X
      if (Math.abs(dxLeft) < Math.abs(dxRight)) p.x = o.x - p.w; else p.x = o.x + o.w;
      p.vx = 0;
    } else {
      // separate Y
      if (Math.abs(dyTop) < Math.abs(dyBottom)) p.y = o.y - p.h; else p.y = o.y + o.h;
      p.vy = 0;
    }
  }

  // player-player collisions (simple)
  for (const other of players) {
    if (other === p) continue;
    if (rectsOverlap(p, other)) {
      // push them apart half-half
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

// spawn pickups periodically
let lastPickupTime = now();
function maybeSpawnPickup() {
  if (now() - lastPickupTime < 2500) return;
  lastPickupTime = now();
  if (pickups.length > 6) return;
  // spawn near random location not inside obstacle
  for (let attempt=0; attempt<30; attempt++){
    const x = rnd(80, WORLD.w - 80);
    const y = rnd(80, WORLD.h - 80);
    const rect = {x:x-12,y:y-12,w:24,h:24};
    let ok=true;
    for (const o of obstacles) if (rectsOverlap(rect,o)) { ok=false; break; }
    if (!ok) continue;
    const type = Math.random() < 0.6 ? 'health' : 'speed';
    pickups.push({x,y,type,spawnTime:now(), ttl:20000});
    break;
  }
}

// player attack (creates bullet)
function doAttack(p) {
  if (p.attackCooldown > 0) return;
  p.attackCooldown = 650; // ms
  const speed = 8;
  const dirx = p.dirX || 1;
  const diry = p.dirY || 0;
  // normalize
  const mag = Math.hypot(dirx, diry) || 1;
  const vx = (dirx/mag) * speed;
  const vy = (diry/mag) * speed;
  bullets.push({x: p.x + p.w/2, y: p.y + p.h/2, vx, vy, owner: p.id, ttl: 2500, damage: 18, size: 10});
}

// player dash
function doDash(p) {
  if (p.dashCooldown > 0) return;
  p.dashCooldown = 2000; // ms
  p.dashTime = 220; // ms
  p.invulnTime = 220;
  // burst velocity along facing direction
  const force = 12;
  const nx = p.dirX || 1;
  const ny = p.dirY || 0;
  const mag = Math.hypot(nx,ny) || 1;
  p.vx += (nx/mag) * force;
  p.vy += (ny/mag) * force;
}

// damage a player
function hurtPlayer(p, dmg, attackerId) {
  if (p.invulnTime > 0) return false;
  p.hp -= dmg;
  if (p.hp <= 0) {
    // respawn
    p.hp = p.maxHp;
    p.x = rnd(60, WORLD.w-60);
    p.y = rnd(60, WORLD.h-60);
    // attacker score
    const atk = players.find(z=>z.id===attackerId);
    if (atk) atk.score += 1;
  }
  return true;
}

// projectile update
function updateBullets(dt) {
  for (let i=bullets.length-1;i>=0;i--){
    const b = bullets[i];
    b.x += b.vx * (dt/16);
    b.y += b.vy * (dt/16);
    b.ttl -= dt;
    const rectB = {x:b.x-b.size/2, y:b.y-b.size/2, w:b.size, h:b.size};
    // collide with obstacles
    let removed=false;
    for (const o of obstacles) {
      if (rectsOverlap(rectB, o)) { removed=true; break; }
    }
    if (b.x < 0 || b.y < 0 || b.x > WORLD.w || b.y > WORLD.h) removed = true;
    if (removed || b.ttl <= 0) { bullets.splice(i,1); continue; }

    // collide with players other than owner
    for (const p of players) {
      if (p.id === b.owner) continue;
      const pr = {x:p.x, y:p.y, w:p.w, h:p.h};
      if (rectsOverlap(rectB, pr)) {
        hurtPlayer(p, b.damage, b.owner);
        bullets.splice(i,1);
        break;
      }
    }
  }
}

// draw helpers
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y, x+w,y+h, r);
  ctx.arcTo(x+w,y+h, x,y+h, r);
  ctx.arcTo(x,y+h, x,y, r);
  ctx.arcTo(x,y, x+w,y, r);
  ctx.closePath();
  ctx.fill();
}

// main update
let lastTime = now();
function update() {
  const t = now();
  const dt = Math.min(40, t - lastTime);
  lastTime = t;

  // spawn pickups occasionally
  maybeSpawnPickup();

  // update bullets
  updateBullets(dt);

  // update players
  for (const p of players) {
    // input read mapped by config
    const cfg = PLAYER_CONFIGS[p.id].keys;
    let mx=0,my=0;
    if (keys[cfg.up]) my -= 1;
    if (keys[cfg.down]) my += 1;
    if (keys[cfg.left]) mx -= 1;
    if (keys[cfg.right]) mx += 1;

    // facing
    if (mx !== 0 || my !== 0) {
      p.dirX = mx; p.dirY = my;
    }

    // apply base movement
    const ms = p.speed * ( (p.speedBoost || 1) );
    if (mx || my) {
      // normalize diagonal
      const m = Math.hypot(mx,my) || 1;
      p.vx += (mx/m) * ms * (dt/16);
      p.vy += (my/m) * ms * (dt/16);
    } else {
      // friction
      p.vx *= 0.85;
      p.vy *= 0.85;
    }

    // dash
    const dashKey = cfg.dash;
    if (dashKey && keys[dashKey]) {
      // only trigger once per keypress — key state holds true; we'll set cooldown so nothing repeats
      if (p.dashCooldown <= 0 && p.dashTime<=0) doDash(p);
    }

    // attack
    const atkKey = cfg.attack;
    if (atkKey && keys[atkKey]) {
      if (p.attackCooldown <= 0) doAttack(p);
    }

    // integrate velocity
    p.x += p.vx;
    p.y += p.vy;

    // clamp speed (so dash gives burst without forever)
    p.vx = clamp(p.vx, -18, 18);
    p.vy = clamp(p.vy, -18, 18);

    // timers
    if (p.dashTime > 0) p.dashTime = Math.max(0, p.dashTime - dt);
    if (p.invulnTime > 0) p.invulnTime = Math.max(0, p.invulnTime - dt);
    if (p.attackCooldown > 0) p.attackCooldown = Math.max(0, p.attackCooldown - dt);
    if (p.dashCooldown > 0 && p.dashTime<=0) p.dashCooldown = Math.max(0, p.dashCooldown - dt);

    // pickups collisions
    for (let i=pickups.length-1;i>=0;i--){
      const pk = pickups[i];
      const pr = {x: pk.x-12, y: pk.y-12, w:24, h:24};
      if (rectsOverlap(pr, p)) {
        if (pk.type === 'health') {
          p.hp = Math.min(p.maxHp, p.hp + 35);
        } else if (pk.type === 'speed') {
          p.speedBoost = 1.9;
          // expires
          setTimeout(() => { p.speedBoost = 1; }, 6000);
        }
        pickups.splice(i,1);
      }
    }

    // collisions with obstacles and players
    resolveCollisions(p);
  }

  lastRenderTime = t;
}

// drawing / render
let lastRenderTime = now();
function render() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if (!splitScreen) {
    // single camera following group center
    const camCenter = getGroupCenter();
    // camera position clamped so view inside world
    const viewW = canvas.width;
    const viewH = canvas.height;
    const cam = {
      x: clamp(camCenter.x - viewW/2, 0, WORLD.w - viewW),
      y: clamp(camCenter.y - viewH/2, 0, WORLD.h - viewH)
    };

    // draw world background
    ctx.fillStyle = '#111';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // draw obstacles shifted by camera
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    // background grid
    ctx.fillStyle = '#0b0b0b';
    for (let gx=0; gx<WORLD.w; gx+=80) {
      ctx.fillRect(gx,0,2,WORLD.h);
    }
    for (let gy=0; gy<WORLD.h; gy+=80) {
      ctx.fillRect(0,gy,WORLD.w,2);
    }

    // obstacles
    for (const o of obstacles) {
      ctx.fillStyle = '#444';
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }

    // pickups
    for (const pk of pickups) {
      if (pk.type === 'health') {
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(pk.x-12, pk.y-12, 24, 24);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText('+HP', pk.x-14, pk.y+4);
      } else {
        ctx.fillStyle = '#66f';
        ctx.fillRect(pk.x-12, pk.y-12, 24, 24);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText('SPD', pk.x-14, pk.y+4);
      }
    }

    // bullets
    for (const b of bullets) {
      ctx.fillStyle = '#ffcc66';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size/2, 0, Math.PI*2);
      ctx.fill();
    }

    // players
    for (const p of players) {
      // shadow / invuln
      if (p.invulnTime > 0) {
        ctx.globalAlpha = 0.5 + 0.5*Math.sin(now()/60);
      } else ctx.globalAlpha = 1;

      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // health bar
      const barW = p.w;
      const hpPerc = p.hp / p.maxHp;
      ctx.fillStyle = '#000';
      ctx.fillRect(p.x, p.y - 12, barW, 8);
      ctx.fillStyle = '#e33';
      ctx.fillRect(p.x, p.y - 12, Math.max(0.1, barW * hpPerc), 8);
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText(`${p.name} ${Math.floor(p.hp)}/${p.maxHp}`, p.x, p.y - 18);

      ctx.globalAlpha = 1;
    }

    // world frame / minimap
    ctx.restore();

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    let line = 20;
    for (const p of players) {
      ctx.fillStyle = p.color;
      ctx.fillText(`${p.name} Score:${p.score} HP:${Math.floor(p.hp)} Dash:${Math.ceil(p.dashCooldown)}ms Attack:${Math.ceil(p.attackCooldown)}ms`, 10, line);
      line += 18;
    }
    ctx.fillStyle = '#ddd';
    ctx.fillText('Tab: toggle split-screen', 10, line+6);

  } else {
    // split-screen 2x2
    // compute viewport per player
    const cols = 2, rows = 2;
    const cellW = Math.floor(canvas.width/cols);
    const cellH = Math.floor(canvas.height/rows);

    for (let i=0;i<players.length;i++){
      const p = players[i];
      const col = i % cols;
      const row = Math.floor(i/cols);
      const vx = col*cellW, vy = row*cellH;

      // camera for this player
      const cam = {
        x: clamp(p.x - cellW/2, 0, WORLD.w - cellW),
        y: clamp(p.y - cellH/2, 0, WORLD.h - cellH)
      };

      // clip region
      ctx.save();
      ctx.beginPath();
      ctx.rect(vx, vy, cellW, cellH);
      ctx.clip();

      // fill bg
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(vx, vy, cellW, cellH);

      // draw world offset
      ctx.translate(vx - cam.x, vy - cam.y);

      // grid
      for (let gx=0; gx<WORLD.w; gx+=80) {
        ctx.fillStyle = '#0b0b0b';
        ctx.fillRect(gx,0,2,WORLD.h);
      }
      for (let gy=0; gy<WORLD.h; gy+=80) {
        ctx.fillStyle = '#0b0b0b';
        ctx.fillRect(0,gy,WORLD.w,2);
      }

      // obstacles
      for (const o of obstacles) {
        ctx.fillStyle = '#444';
        ctx.fillRect(o.x, o.y, o.w, o.h);
      }

      // pickups
      for (const pk of pickups) {
        if (pk.type === 'health') {
          ctx.fillStyle = '#ff6666';
          ctx.fillRect(pk.x-12, pk.y-12, 24, 24);
        } else {
          ctx.fillStyle = '#66f';
          ctx.fillRect(pk.x-12, pk.y-12, 24, 24);
        }
      }

      // bullets
      for (const b of bullets) {
        ctx.fillStyle = '#ffcc66';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size/2, 0, Math.PI*2);
        ctx.fill();
      }

      // players
      for (const q of players) {
        if (q.invulnTime > 0) {
          ctx.globalAlpha = 0.5 + 0.5*Math.sin(now()/60);
        } else ctx.globalAlpha = 1;
        ctx.fillStyle = q.color;
        ctx.fillRect(q.x, q.y, q.w, q.h);

        // hp bar
        const barW = q.w;
        const hpPerc = q.hp / q.maxHp;
        ctx.fillStyle = '#000';
        ctx.fillRect(q.x, q.y - 12, barW, 8);
        ctx.fillStyle = '#e33';
        ctx.fillRect(q.x, q.y - 12, Math.max(0.1, barW * hpPerc), 8);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${q.name} ${Math.floor(q.hp)}/${q.maxHp}`, q.x, q.y - 18);
      }
      ctx.globalAlpha = 1;

      ctx.restore();

      // HUD per cell
      ctx.fillStyle = players[i].color;
      ctx.font = '13px monospace';
      ctx.fillText(`${players[i].name} Score:${players[i].score}`, vx + 6, vy + 16);
      ctx.fillStyle = '#ddd';
      ctx.fillText(`HP:${Math.floor(players[i].hp)} Dash:${Math.ceil(players[i].dashCooldown)}ms`, vx+6, vy+34);
    }

    ctx.fillStyle = '#ddd';
    ctx.fillText('Tab: toggle split-screen (current: split)', 10, canvas.height - 8);
  }
}

// main loop
function frame() {
  const t1 = now();
  update();
  render();
  const t2 = now();
  requestAnimationFrame(frame);
}
frame();

// debug: allow clicking to spawn pickups
canvas.addEventListener('dblclick', e => {
  const rect = canvas.getBoundingClientRect();
  // convert to world based on single or split
  if (!splitScreen) {
    const camCenter = getGroupCenter();
    const viewW = canvas.width, viewH = canvas.height;
    const cam = { x: clamp(camCenter.x - viewW/2, 0, WORLD.w - viewW), y: clamp(camCenter.y - viewH/2, 0, WORLD.h - viewH) };
    const mx = e.clientX - rect.left + cam.x;
    const my = e.clientY - rect.top + cam.y;
    pickups.push({x:mx,y:my,type:'health',spawnTime:now(),ttl:20000});
  } else {
    // spawn at center player
    const i = 0;
    pickups.push({x: players[i].x + players[i].w/2, y: players[i].y + players[i].h/2, type:'health', spawnTime:now(), ttl:20000});
  }
});

// Garbage pickup TTL
setInterval(()=> {
  const t = now();
  for (let i=pickups.length-1;i>=0;i--){
    if (t - pickups[i].spawnTime > pickups[i].ttl) pickups.splice(i,1);
  }
}, 1000);

// friendly instruction console (drawn on canvas)
(function drawInstructionsOverlay(){
  const overlay = document.createElement('div');
  overlay.style.position='fixed';
  overlay.style.right='8px';
  overlay.style.bottom='8px';
  overlay.style.background='rgba(0,0,0,0.4)';
  overlay.style.color='#fff';
  overlay.style.padding='8px';
  overlay.style.borderRadius='8px';
  overlay.style.fontSize='12px';
  overlay.style.maxWidth='320px';
  overlay.style.lineHeight='1.4';
  overlay.innerHTML = `
    <b>Controls</b><br>
    P1: WASD, Space (attack), Shift (dash)<br>
    P2: Arrows, Enter (attack), RightShift (dash)<br>
    P3: IJKL, M (attack), N (dash)<br>
    P4: TFGH, Y (attack), R (dash)<br>
    Tab: toggle split-screen<br>
    Double-click: spawn health pickup (debug)<br>
  `;
  document.body.appendChild(overlay);
})();
