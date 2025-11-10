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

const ctx = document.getElementById('chart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array(MAX_TICKS).fill(""),
    datasets: Object.entries(stocks).map(([name, s]) => ({
      label: name,
      borderColor: s.color,
      data: buffers[name],
      tension: 0.2,
    })),
  },
  options: { animation: false, scales: { y: { beginAtZero: true } } },
});

function log(msg) {
  const logBox = document.getElementById('log');
  logBox.textContent += msg + "\n";
  logBox.scrollTop = logBox.scrollHeight;
}

function tick() {
  for (let [name, info] of Object.entries(stocks)) {
    const change = Math.random() * 10;
    if (Math.random() * 100 < info.succes) info.waarde += change;
    else info.waarde -= change;
    if (info.waarde < 1) info.waarde = 1;
    buffers[name].push(info.waarde);
    if (buffers[name].length > MAX_TICKS) buffers[name].shift();
  }
  chart.update();
}

function koop(aandeel, aantal, speler) {
  const stock = stocks[aandeel];
  const player = players[speler];
  const prijs = stock.waarde * aantal;
  if (player.geld >= prijs) {
    player.geld -= prijs;
    player.aandelen[aandeel] = (player.aandelen[aandeel] || 0) + aantal;
    log(`${speler} kocht ${aantal}x ${aandeel} voor €${prijs.toFixed(2)}`);
  } else log(`${speler} heeft niet genoeg geld!`);
}

function verkoop(aandeel, aantal, speler) {
  const player = players[speler];
  if ((player.aandelen[aandeel] || 0) >= aantal) {
    player.aandelen[aandeel] -= aantal;
    const opbrengst = stocks[aandeel].waarde * aantal;
    player.geld += opbrengst;
    log(`${speler} verkocht ${aantal}x ${aandeel} voor €${opbrengst.toFixed(2)}`);
  } else log(`${speler} heeft niet genoeg aandelen!`);
}

setInterval(tick, 900);

// Populate dropdowns
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
