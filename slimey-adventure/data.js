// === CHARACTERS ===
const CHARACTERS = {
  slime: {
    name: "Slime",
    rarity: "Normaal",
    class: "Slime",
    hp: 10,
    int: "1d20",
    color: "#77dd77",

    actions: {
      action1: { name: "Slime", attack: "1d4", range: 2 },
      special: { name: "Slimey shield", heal: 2, shield: 3, cooldown: 4 },
      movement: { name: "Move", move: "1d4" }
    }
  },

  ridder: {
    name: "Ridder",
    rarity: "Zeldzaam",
    class: "Ridder",
    hp: 12,
    int: "1d20 -4",
    color: "#0077b6",

    actions: {
      action1: { name: "Sword", attack: "1d6 +1" },
      special: { name: "Swift slash", attack1: "1d4", move1: 2, attack2: "1d4 -1", move2: 2, attack3: "1d4 -2", cooldown: 5 },
      movement: { name: "Move", move: "1d4" }
    }
  },

  boogschutter: {
    name: "Boogschutter",
    rarity: "Zeldzaam",
    class: "Boogschutter",
    hp: 8,
    int: "1d6 +10",
    color: "#e3b505",

    actions: {
      action1: { name: "Bow", attack: "1d6", range: 4 },
      special: { name: "Multishot", attack1: "1d4", range: 3, target: 3, cooldown: 4 },
      movement: { name: "Move", move: 3 }
    }
  }
};

// === MAPS ===
const MAPS = {
  meadow: {
    name: "Meadow Plains",
    size: { w: 7, h: 5 },
    logic: [
      [0,0,0,0,0,0,0],
      [0,1,0,1,0,1,0],
      [0,0,0,0,0,0,0],
      [0,1,0,1,0,1,0],
      [0,0,0,0,0,0,0]
    ],
    art: [
      [0,0,0,0,0,0,0],
      [0,2,0,2,0,2,0],
      [0,0,0,0,0,0,0],
      [0,2,0,2,0,2,0],
      [0,0,0,0,0,0,0]
    ],
    artLegend: { 0: "grass", 1: "stone", 2: "wall" }
  }
};
