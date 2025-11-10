// --- Stocks & Players ---
const stocks = {
  "Oenvast BV": { waarde: Math.random() * 90 + 10, succes: 50, color: 'red', lowCount: 0 },
  "GekkoGames": { waarde: Math.random() * 90 + 10, succes: 50, color: 'blue', lowCount: 0 },
  "Minecraft": { waarde: Math.random() * 90 + 10, succes: 50, color: 'green', lowCount: 0 },
  "Pon BV": { waarde: Math.random() * 90 + 10, succes: 50, color: 'orange', lowCount: 0 },
  "Bombardilo BV": { waarde: Math.random() * 90 + 10, succes: 50, color: 'purple', lowCount: 0 }
};

const players = {
  "Miguel": { geld: 500, aandelen: {} },
  "David": { geld: 500, aandelen: {} },
  "Alejandro": { geld: 500, aandelen: {} }
};

const MAX_TICKS = 100;
const buffers = {};
for (let s in stocks) buffers[s] = [stocks[s].waarde];

// --- Chart.js Setup ---
const ctx = document.getElementById('chart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array(MAX_TICKS).fill(""),
    datasets: Object.entries(stocks).map(([name, s]) => {
      return {
        label: name,
        borderColor: s.color,
        data: buffers[name],
        tension: 0.2
      };
    })
  },
  options: {
    responsive: false,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      y: { beginAtZero: true }
    }
  }
});

// --- Logging ---
function log(msg) {
  const logBox = document.getElementById('console');
  logBox.textContent += msg + "\n";
  logBox.scrollTop = logBox.scrollHeight;
}

// --- Update Portfolio & Market ---
function updatePortfolio() {
  const playerName = document.getElementById('player').value;
  const player = players[playerName];

  // Portfolio tab
  const div = document.getElementById('portfolio');
  let totalValue = player.geld;
  let html = `<h3>${playerName}'s Rekening</h3>`;
  html += `<p><strong>Geld:</strong> €${player.geld.toFixed(2)}</p>`;
  html += `<table><tr><th>Aandeel</th><th>Aantal</th><th>Waarde/stuk</th><th>Totaal</th></tr>`;
  for (let [aandeel, aantal] of Object.entries(player.aandelen)) {
    const waarde = stocks[aandeel].waarde;
    const totaal = aantal * waarde;
    totalValue += totaal;
    html += `<tr><td>${aandeel}</td><td>${aantal}</td><td>€${waarde.toFixed(2)}</td><td>€${totaal.toFixed(2)}</td></tr>`;
  }
  html += `</table><p><strong>Totaalwaarde:</strong> €${totalValue.toFixed(2)}</p>`;
  div.innerHTML = html;

  // Market tab
  const marketDiv = document.getElementById('market');
  let marketHtml = `<h3>Stock Market Info</h3>`;
  marketHtml += `<table><tr><th>Aandeel</th><th>Waarde</th><th>Max Aantal</th></tr>`;
  for (let [name, stock] of Object.entries(stocks)) {
    let maxAllowed = 0;
    if (stock.waarde <= 0) maxAllowed = 0;
    else if (stock.waarde <= 10) maxAllowed = 2;
    else if (stock.waarde <= 50) maxAllowed = 10;
    else if (stock.waarde <= 100) maxAllowed = 20;
    else maxAllowed = 40;
    marketHtml += `<tr><td>${name}</td><td>€${stock.waarde.toFixed(2)}</td><td>${maxAllowed}</td></tr>`;
  }
  marketHtml += `</table>`;
  marketDiv.innerHTML = marketHtml;
}

// --- Tick Function ---
function tick() {
  for (let [name, info] of Object.entries(stocks)) {
    const change = Math.random() * 10;
    if (Math.random() * 100 < info.succes) info.waarde += change;
    else info.waarde -= change;
    if (info.waarde < 0) info.waarde = 0;

    if (info.waarde < 1) info.lowCount++;
    else info.lowCount = 0;

    if (info.lowCount >= 3) {
      for (let pname in players) {
        const player = players[pname];
        if (player.aandelen[name] && player.aandelen[name] > 0) {
          const loss = Math.min(2, player.aandelen[name]);
          player.aandelen[name] -= loss;
          if (player.aandelen[name] <= 0) delete player.aandelen[name];
          log(`⚠️ ${pname} verloor ${loss}x ${name} (waarde te laag)`);
        }
      }
      info.lowCount = 0;
    }

    buffers[name].push(info.waarde);
    if (buffers[name].length > MAX_TICKS) buffers[name].shift();
  }

  // Dynamic y-axis scaling
  const maxValue = Math.max(...Object.values(stocks).map(s => s.waarde)) * 1.1;
  chart.options.scales.y.max = maxValue;
  chart.update();
  updatePortfolio();
}

// --- Buy / Sell ---
function koop(aandeel, aantal, speler) {
  const stock = stocks[aandeel];
  const player = players[speler];

  let maxAllowed = 0;
  if (stock.waarde <= 0) maxAllowed = 0;
  else if (stock.waarde <= 10) maxAllowed = 2;
  else if (stock.waarde <= 50) maxAllowed = 10;
  else if (stock.waarde <= 100) maxAllowed = 20;
  else maxAllowed = 40;

  const currentOwned = player.aandelen[aandeel] || 0;
  if (currentOwned + aantal > maxAllowed) {
    log(`❌ ${speler} kan max ${maxAllowed}x ${aandeel} kopen.`);
    return;
  }

  const prijs = stock.waarde * aantal;
  if (player.geld >= prijs) {
    player.geld -= prijs;
    player.aandelen[aandeel] = currentOwned + aantal;
    log(`✅ ${speler} kocht ${aantal}x ${aandeel} voor €${prijs.toFixed(2)}`);
    updatePortfolio();
  } else log(`❌ ${speler} heeft niet genoeg geld!`);
}

function verkoop(aandeel, aantal, speler) {
  const player = players[speler];
  if ((player.aandelen[aandeel] || 0) >= aantal) {
    player.aandelen[aandeel] -= aantal;
    if (player.aandelen[aandeel] <= 0) delete player.aandelen[aandeel];
    const opbrengst = stocks[aandeel].waarde * aantal;
    player.geld += opbrengst;
    log(`💰 ${speler} verkocht ${aantal}x ${aandeel} voor €${opbrengst.toFixed(2)}`);
    updatePortfolio();
  } else log(`❌ ${speler} heeft niet genoeg aandelen!`);
}

// --- Setup selects ---
const playerSelect = document.getElementById('player');
Object.keys(players).forEach(p => {
  const opt = document.createElement('option');
  opt.value = p; opt.textContent = p;
  playerSelect.append(opt);
});

const stockSelect = document.getElementById('stock');
Object.keys(stocks).forEach(s => {
  const opt = document.createElement('option');
  opt.value = s; opt.textContent = s;
  stockSelect.append(opt);
});

document.getElementById('buy').onclick = () =>
  koop(stockSelect.value, +document.getElementById('amount').value, playerSelect.value);

document.getElementById('sell').onclick = () =>
  verkoop(stockSelect.value, +document.getElementById('amount').value, playerSelect.value);

playerSelect.onchange = updatePortfolio;
updatePortfolio();

// --- Tabs ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  };
});

// --- Start Ticker ---
setInterval(tick, 1000);
