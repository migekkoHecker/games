const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// PLAYER DATA
const p1 = { x: 100, y: 100, size: 40, color: "cyan", speed: 5 };
const p2 = { x: 300, y: 100, size: 40, color: "yellow", speed: 5 };

let keys = {};

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// MOVEMENT LOGIC
function movePlayers() {
    // Player 1 (WASD)
    if (keys["w"]) p1.y -= p1.speed;
    if (keys["s"]) p1.y += p1.speed;
    if (keys["a"]) p1.x -= p1.speed;
    if (keys["d"]) p1.x += p1.speed;

    // Player 2 (Arrow keys)
    if (keys["ArrowUp"]) p2.y -= p2.speed;
    if (keys["ArrowDown"]) p2.y += p2.speed;
    if (keys["ArrowLeft"]) p2.x -= p2.speed;
    if (keys["ArrowRight"]) p2.x += p2.speed;
}

// DRAW PLAYERS
function drawPlayer(p) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
}

// GAME LOOP
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    movePlayers();
    drawPlayer(p1);
    drawPlayer(p2);

    requestAnimationFrame(loop);
}

loop();
