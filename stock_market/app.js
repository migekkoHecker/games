// --- Stocks & Players ---
const stocks = {
  "Oenvast BV": { waarde: Math.random()*90+10, succes:50, color:'red', lowCount:0 },
  "GekkoGames": { waarde: Math.random()*90+10, succes:50, color:'blue', lowCount:0 },
  "Minecraft": { waarde: Math.random()*90+10, succes:50, color:'green', lowCount:0 },
  "Pon BV": { waarde: Math.random()*90+10, succes:50, color:'orange', lowCount:0 },
  "Bombardilo BV": { waarde: Math.random()*90+10, succes:50, color:'purple', lowCount:0 },
};

const players = {
  "Migekko": { geld:500, aandelen:{} },
  "Davidtjou": { geld:500, aandelen:{} },
  "4l3jandr0": { geld:500, aandelen:{} },
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
    responsive: false,             // DISABLE responsive
    maintainAspectRatio: false,    // keep fixed canvas height
    animation: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: v => v.toFixed(0) }
      }
    }
  }
});


// --- Logging ---
function log(msg) {
  const logBox = document.getElementById('log');
  logBox.textContent += msg + "\n";
  logBox.scrollTop = logBox.scrollHeight;
}

// --- Portfolio ---
function updatePortfolio() {
  const playerName = document.getElementById('player').value;
  const player = players[playerName];
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
}

// --- Market Info ---
function updateMarket() {
  const div = document.getElementById('market');
  let html = `<h3>Stock Market Info</h3>`;
  html += `<table><tr><th>Stock</th><th>Current Price</th><th>Total Owned</th><th>Max Allowed</th><th>Base Price</th></tr>`;
  for (let [name, stock] of Object.entries(stocks)) {
    const totalOwned = Object.values(players).reduce((sum, p) => sum + (p.aandelen[name]||0), 0);
    // Global max based on price
    const effectivePrice = Math.max(stock.waarde,10);
    let maxAllowed;
    if (effectivePrice <= 10) maxAllowed = 2;
    else if (effectivePrice <= 50) maxAllowed = 10;
    else if (effectivePrice <= 100) maxAllowed = 20;
    else if (effectivePrice <= 200) maxAllowed = 40;
    else maxAllowed = 50;
    html += `<tr><td>${name}</td><td>€${stock.waarde.toFixed(2)}</td><td>${totalOwned}</td><td>${maxAllowed}</td><td>€${stock.waarde.toFixed(2)}</td></tr>`;
  }
  html += `</table>`;
  div.innerHTML = html;
}

// --- Tick Function ---
function tick() {
  for (let [name, info] of Object.entries(stocks)) {
    const change = Math.random()*10;
    if (Math.random()*100 < info.succes) info.waarde += change;
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
          if (player.aandelen[name]<=0) delete player.aandelen[name];
          log(`⚠️ ${pname} verloor ${loss}x ${name} (waarde te laag)`);
        }
      }
      info.lowCount = 0;
    }

    buffers[name].push(info.waarde);
    if (buffers[name].length > MAX_TICKS) buffers[name].shift();
  }

  // Dynamic y-axis scaling
  const currentMax = chart.options.scales.y.max || 100;
  const newMax = Math.max(...Object.values(stocks).map(s=>s.waarde))*1.1;
  chart.options.scales.y.max = Math.max(currentMax,newMax);

  chart.update();
  updatePortfolio();
  updateMarket();
}

// --- Buy/Sell ---
function koop(aandeel,aantal,speler){
  const stock = stocks[aandeel];
  const player = players[speler];
  const prijs = stock.waarde*aantal;
  const effectivePrice = Math.max(stock.waarde,10);
  let maxAllowed;
  if (effectivePrice <= 10) maxAllowed = 2;
  else if (effectivePrice <= 50) maxAllowed = 10;
  else if (effectivePrice <= 100) maxAllowed = 20;
  else if (effectivePrice <= 200) maxAllowed = 40;
  else maxAllowed = 50;

  const totalOwned = Object.values(players).reduce((sum,p)=>sum+(p.aandelen[aandeel]||0),0);

  if(totalOwned+aantal>maxAllowed){ log(`❌ ${speler} kan max ${maxAllowed}x ${aandeel} kopen (globaal)`); return; }
  if(player.geld>=prijs){ 
    player.geld -= prijs;
    player.aandelen[aandeel] = (player.aandelen[aandeel]||0)+aantal;
    log(`✅ ${speler} kocht ${aantal}x ${aandeel} voor €${prijs.toFixed(2)}`);
    updatePortfolio();
    updateMarket();
  }else log(`❌ ${speler} heeft niet genoeg geld!`);
}

function verkoop(aandeel,aantal,speler){
  const player = players[speler];
  if((player.aandelen[aandeel]||0)>=aantal){
    player.aandelen[aandeel]-=aantal;
    const opbrengst = stocks[aandeel].waarde*aantal;
    player.geld+=opbrengst;
    log(`💰 ${speler} verkocht ${aantal}x ${aandeel} voor €${opbrengst.toFixed(2)}`);
    updatePortfolio();
    updateMarket();
  }else log(`❌ ${speler} heeft niet genoeg aandelen!`);
}

// --- Setup ---
const playerSelect = document.getElementById('player');
Object.keys(players).forEach(p=>{
  const opt=document.createElement('option'); opt.value=p; opt.textContent=p; playerSelect.append(opt);
});
const stockSelect = document.getElementById('stock');
Object.keys(stocks).forEach(s=>{
  const opt=document.createElement('option'); opt.value=s; opt.textContent=s; stockSelect.append(opt);
});

document.getElementById('buy').onclick = ()=> koop(stockSelect.value,+document.getElementById('amount').value,playerSelect.value);
document.getElementById('sell').onclick = ()=> verkoop(stockSelect.value,+document.getElementById('amount').value,playerSelect.value);

playerSelect.onchange = updatePortfolio;
updatePortfolio();
updateMarket();

// --- Tabs ---
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-content").forEach(tc=>tc.style.display="none");
    document.getElementById(btn.dataset.tab).style.display="block";
  }
});

// --- Start Ticker ---
setInterval(tick,1000);
