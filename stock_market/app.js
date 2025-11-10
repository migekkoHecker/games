// --- Stocks & Players ---
const stocks = {
  "Oenvast BV": { waarde: Math.random() * 90 + 10, succes: 50, color: 'red', lowCount: 0 },
  "GekkoGames": { waarde: Math.random() * 90 + 10, succes: 50, color: 'blue', lowCount: 0 },
  "Minecraft": { waarde: Math.random() * 90 + 10, succes: 50, color: 'green', lowCount: 0 },
  "Pon BV": { waarde: Math.random() * 90 + 10, succes: 50, color: 'orange', lowCount: 0 },
  "Bombardilo BV": { waarde: Math.random() * 90 + 10, succes: 50, color: 'purple', lowCount: 0 },
};

const players = {
  "Miguel": { geld: 500, aandelen: {} },
  "David": { geld: 500, aandelen: {} },
  "Alejandro": { geld: 500, aandelen: {} },
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
    datasets: Object.entries(stocks).map(([name, s]) => ({
      label: name,
      borderColor: s.color,
      data: buffers[name],
      tension: 0.2
    }))
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    layout: {
      padding: { left: 50, right: 20, top: 20, bottom: 50 }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 10, callback: v => `$${Math.round(v)}` }
      },
      x: { ticks: { display: false } }
    },
    plugins: {
      legend: { display: true, position: 'bottom', labels: { boxWidth: 15, padding: 10 } },
      title: { display: true, text: 'Stock Prices' }
    }
  }
});

// --- Logging ---
function log(msg) {
  const logBox = document.getElementById('log');
  logBox.textContent += msg + "\n";
  logBox.scrollTop = logBox.scrollHeight;
}

// --- Portfolio & Market Update ---
function updatePortfolio() {
  const playerName = document.getElementById('player').value;
  const player = players[playerName];

  // Portfolio tab
  const div = document.getElementById('portfolio');
  let totalValue = player.geld;
  let html = `<h3>${playerName}'s Rekening</h3>`;
  html += `<p><strong>Geld:</strong> €${Math.round(player.geld)}</p>`;
  html += `<table><tr><th>Aandeel</th><th>Aantal</th><th>Waarde/stuk</th><th>Verkoopwaarde</th></tr>`;
  for (let [aandeel, aantal] of Object.entries(player.aandelen)) {
    const waarde = stocks[aandeel].waarde;
    const verkoopWaarde = waarde * 0.9; // 90% van de huidige waarde
    const totaal = aantal * verkoopWaarde;
    totalValue += totaal;
    html += `<tr>
      <td>${aandeel}</td>
      <td>${aantal}</td>
      <td>€${Math.round(waarde)}</td>
      <td>€${Math.round(totaal)}</td>
    </tr>`;
  }
  html += `</table><p><strong>Totaalwaarde (inclusief verkoopwaarde):</strong> €${Math.round(totalValue)}</p>`;
  div.innerHTML = html;

  // Market tab blijft hetzelfde
  const marketDiv = document.getElementById('market');
  let marketHtml = `<h3>Stock Market Info</h3>`;
  marketHtml += `<table><tr><th>Aandeel</th><th>Waarde</th><th>Owned/Max</th><th>Totaal Marktwaarde</th></tr>`;
  for (let [name, stock] of Object.entries(stocks)) {
    const price = stock.waarde;
    let maxAllowed = Math.round((price / 50) * 10);
    if (maxAllowed < 1 && price > 0) maxAllowed = 1;

    let totalOwned = Object.values(players).reduce((sum, p) => sum + (p.aandelen[name] || 0), 0);
    let totalMarketValue = totalOwned * price;

    marketHtml += `<tr>
      <td>${name}</td>
      <td>€${Math.round(price)}</td>
      <td>${totalOwned}/${maxAllowed}</td>
      <td>€${Math.round(totalMarketValue)}</td>
    </tr>`;
  }
  marketHtml += `</table>`;
  marketDiv.innerHTML = marketHtml;
}


// --- Tick Function ---
let crashTicksLeft = 0;
let preCrashTicks = 0;
function tick() {
  // Tick-gewijze aanpassing van succes
  for (let stock of Object.values(stocks)) {
    stock.succes += (Math.random() * 6) - 3; // -3 tot +3
    stock.succes = Math.max(0, Math.min(100, stock.succes)); // clamp
  }

  // --- Normale stock updates ---
  for (let [name, info] of Object.entries(stocks)) {
    const change = Math.random() * 3;
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

  chart.options.scales.y.max = Math.max(...Object.values(stocks).map(s => s.waarde) * 1.1, 100);
  chart.update();
  updatePortfolio();
}


function koop(aandeel, aantal, speler) {
  const stock = stocks[aandeel];
  const player = players[speler];
  const prijs = stock.waarde * aantal;

  if ((player.aandelen[aandeel] || 0) + aantal > Math.round((stock.waarde / 50) * 10)) {
    log(`❌ ${speler} kan niet meer kopen.`);
    return;
  }

  if (player.geld >= prijs) {
    player.geld -= prijs;
    player.aandelen[aandeel] = (player.aandelen[aandeel] || 0) + aantal;
    stock.succes += 2; // koop verhoogt succes
    stock.succes = Math.min(stock.succes, 100);
    log(`✅ ${speler} kocht ${aantal}x ${aandeel} voor €${Math.round(prijs)}`);
    updatePortfolio();
  } else log(`❌ ${speler} heeft niet genoeg geld!`);
}

function verkoop(aandeel, aantal, speler) {
  const player = players[speler];
  if ((player.aandelen[aandeel] || 0) >= aantal) {
    player.aandelen[aandeel] -= aantal;
    if (player.aandelen[aandeel] <= 0) delete player.aandelen[aandeel];
    const opbrengst = stocks[aandeel].waarde * aantal * 0.9;
    player.geld += opbrengst;
    stocks[aandeel].succes -= 2; // verkoop verlaagt succes
    stocks[aandeel].succes = Math.max(stocks[aandeel].succes, 0);
    log(`💰 ${speler} verkocht ${aantal}x ${aandeel} voor €${Math.round(opbrengst)} (90%)`);
    updatePortfolio();
  } else log(`❌ ${speler} heeft niet genoeg aandelen!`);
}


// --- Save / Load Clipboard ---
function saveGameToClipboard() {
  const data = { stocks, buffers, players, crashTicksLeft, preCrashTicks };
  const json = JSON.stringify(data, null, 2);
  navigator.clipboard.writeText(json)
    .then(() => log("💾 Game saved to clipboard! Paste it somewhere safe."))
    .catch(err => log("❌ Failed to copy save: " + err));
}

function loadGameFromClipboard() {
  const json = prompt("Paste your saved game JSON here:");
  if (!json) return;
  try {
    const data = JSON.parse(json);
    Object.assign(stocks, data.stocks);
    Object.assign(buffers, data.buffers);
    Object.assign(players, data.players);
    crashTicksLeft = data.crashTicksLeft || 0;
    preCrashTicks = data.preCrashTicks || 0;
    chart.data.datasets.forEach(ds => ds.data = buffers[ds.label]);
    chart.update();
    updatePortfolio();
    log("📂 Game loaded from clipboard!");
  } catch (err) {
    log("❌ Failed to load save: " + err);
  }
}

// Hook buttons
document.getElementById('save').onclick = saveGameToClipboard;
document.getElementById('loadBtn').onclick = loadGameFromClipboard;

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
