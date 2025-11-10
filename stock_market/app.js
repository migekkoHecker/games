// app.js - full file (replace existing app.js with this)
const stocks = {
  "Oenvast BV": { waarde: Math.random()*90+10, succes: 50, color: 'red' },
  "GekkoGames": { waarde: Math.random()*90+10, succes: 50, color: 'blue' },
  "Minecraft": { waarde: Math.random()*90+10, succes: 50, color: 'green' },
  "Pon BV": { waarde: Math.random()*90+10, succes: 50, color: 'orange' },
  "Bombardilo BV": { waarde: Math.random()*90+10, succes: 50, color: 'purple' },
};

const players = {
  "Miguel": { geld: 500, aandelen: {} },
  "David": { geld: 500, aandelen: {} },
  "Alejandro": { geld: 500, aandelen: {} },
};

const MAX_TICKS = 100;
const buffers = {};
for (let s in stocks) buffers[s] = [stocks[s].waarde];

/* ---------------- Chart setup ---------------- */
const ctx = document.getElementById('chart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array(MAX_TICKS).fill(""),
    datasets: Object.entries(stocks).map(([name, s]) => ({
      label: name,
      borderColor: s.color,
      backgroundColor: 'transparent',
      data: buffers[name],
      tension: 0.2,
      pointRadius: 0,
    })),
  },
  options: {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true }
    }
  },
});

/* ---------------- Utilities ---------------- */
function log(msg) {
  const logBox = document.getElementById('log');
  if (!logBox) return;
  logBox.textContent += msg + "\n";
  logBox.scrollTop = logBox.scrollHeight;
}

function updatePortfolio() {
  const playerSel = document.getElementById('player');
  if (!playerSel) return;
  const playerName = playerSel.value;
  const player = players[playerName];
  const div = document.getElementById('portfolio');
  if (!player || !div) return;

  let totalValue = player.geld;
  let html = `<h3>${playerName}'s Rekening</h3>`;
  html += `<p><strong>Geld:</strong> €${player.geld.toFixed(2)}</p>`;
  html += `<table><tr><th>Aandeel</th><th>Aantal</th><th>Waarde/stuk</th><th>Totaal</th></tr>`;

  for (let [aandeel, aantal] of Object.entries(player.aandelen)) {
    const waarde = (stocks[aandeel] && stocks[aandeel].waarde) ? stocks[aandeel].waarde : 0;
    const totaal = aantal * waarde;
    totalValue += totaal;
    html += `<tr><td>${aandeel}</td><td>${aantal}</td><td>€${waarde.toFixed(2)}</td><td>€${totaal.toFixed(2)}</td></tr>`;
  }

  html += `</table><p><strong>Totaalwaarde:</strong> €${totalValue.toFixed(2)}</p>`;
  div.innerHTML = html;
}

/* ---------------- Simulation tick ---------------- */
function tick() {
  try {
    for (let [name, info] of Object.entries(stocks)) {
      const change = Math.random() * 10;
      if (Math.random() * 100 < info.succes) info.waarde += change;
      else info.waarde -= change;
      if (info.waarde < 1) info.waarde = 1;
      buffers[name].push(info.waarde);
      if (buffers[name].length > MAX_TICKS) buffers[name].shift();
    }
    chart.update();
    updatePortfolio();
  } catch (err) {
    console.error("Tick error:", err);
  }
}

/* ---------------- Buy / Sell ---------------- */
function koop(aandeel, aantal, speler) {
  if (!aandeel || !speler) return;
  aantal = Number(aantal) || 0;
  if (aantal <= 0) { log("Voer een positief aantal in."); return; }

  const stock = stocks[aandeel];
  const player = players[speler];
  if (!stock || !player) return;
  const prijs = stock.waarde * aantal;
  if (player.geld >= prijs) {
    player.geld -= prijs;
    player.aandelen[aandeel] = (player.aandelen[aandeel] || 0) + aantal;
    log(`${speler} kocht ${aantal}x ${aandeel} voor €${prijs.toFixed(2)}`);
    updatePortfolio();
  } else log(`${speler} heeft niet genoeg geld!`);
}

function verkoop(aandeel, aantal, speler) {
  if (!aandeel || !speler) return;
  aantal = Number(aantal) || 0;
  if (aantal <= 0) { log("Voer een positief aantal in."); return; }

  const player = players[speler];
  if (!player) return;
  if ((player.aandelen[aandeel] || 0) >= aantal) {
    player.aandelen[aandeel] -= aantal;
    const opbrengst = stocks[aandeel].waarde * aantal;
    player.geld += opbrengst;
    log(`${speler} verkocht ${aantal}x ${aandeel} voor €${opbrengst.toFixed(2)}`);
    updatePortfolio();
  } else log(`${speler} heeft niet genoeg aandelen!`);
}

/* ---------------- Ticker (robust speed control) ---------------- */
let currentSpeed = 1000;     // milliseconds
let tickTimerId = null;

function startTicker(ms) {
  // guard - clear existing timer first
  if (tickTimerId !== null) {
    clearInterval(tickTimerId);
    tickTimerId = null;
  }
  currentSpeed = Number(ms) || 1000;
  // immediately run one tick for snappy response, then schedule
  tick();
  tickTimerId = setInterval(tick, currentSpeed);
  // update active classes
  document.querySelectorAll("#speed-controls button").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`#speed-controls button[data-speed='${currentSpeed}']`);
  if (btn) btn.classList.add("active");
  console.log(`Ticker started at ${currentSpeed} ms`);
}

function stopTicker() {
  if (tickTimerId !== null) {
    clearInterval(tickTimerId);
    tickTimerId = null;
    console.log("Ticker stopped");
  }
}

function togglePause() {
  if (tickTimerId === null) startTicker(currentSpeed);
  else stopTicker();
}

/* ---------------- Initialization: wire UI ---------------- */
function initUI() {
  // populate players
  const playerSelect = document.getElementById('player');
  if (!playerSelect) { console.error("player select not found"); return; }
  playerSelect.innerHTML = '';
  Object.keys(players).forEach(p => {
    const opt = document.createElement('option'); opt.value = p; opt.textContent = p;
    playerSelect.append(opt);
  });

  // populate stocks
  const stockSelect = document.getElementById('stock');
  if (!stockSelect) { console.error("stock select not found"); return; }
  stockSelect.innerHTML = '';
  Object.keys(stocks).forEach(s => {
    const opt = document.createElement('option'); opt.value = s; opt.textContent = s;
    stockSelect.append(opt);
  });

  // buy / sell buttons
  const buyBtn = document.getElementById('buy');
  const sellBtn = document.getElementById('sell');
  if (buyBtn) buyBtn.onclick = () => koop(stockSelect.value, +document.getElementById('amount').value, playerSelect.value);
  if (sellBtn) sellBtn.onclick = () => verkoop(stockSelect.value, +document.getElementById('amount').value, playerSelect.value);

  // player change -> update portfolio
  playerSelect.onchange = updatePortfolio;

  // speed buttons
  document.querySelectorAll("#speed-controls button").forEach(btn => {
    const ms = Number(btn.dataset.speed);
    btn.addEventListener('click', () => startTicker(ms));
  });

  // optional: add pause key (space)
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); togglePause(); }
  });

  updatePortfolio();
  startTicker(currentSpeed); // start default ticker
}

/* ---------------- Run init after DOM loaded ---------------- */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUI);
} else {
  initUI();
}
