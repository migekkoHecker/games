// === data.js ===

// === CHARACTERS ===
const CHARACTERS = {
  slime: {
    name: "Slime",
    rarity: "Normaal",
    class: "Slime",
    hp: 10,
    int: "1d20",
    color: "#77dd77",

    baseActions: {
      attack: { type: "attack", value: "1d4", range: 2 },
      special: {
        name: "Slimey shield",
        heal: 2,
        shield: 3,
        cooldown: 4
      },
      movement: { move: "1d4" }
    },

    abilities: {
      stickySlime: { name: "Sticky slime", slow: 1, range: 2 },
      speedySlime: { name: "Speedy slime", move: 4 }
    }
  },

  ridder: {
    name: "Ridder",
    rarity: "Zeldzaam",
    class: "Ridder",
    hp: 12,
    int: "1d20 -4",
    color: "#0077b6",

    baseActions: {
      sword: { type: "attack", value: "1d6 +1" },
      special: {
        name: "Swift slash",
        sequence: [
          { attack: "1d4" },
          { move: 2 },
          { attack: "1d4 -1" },
          { move: 2 },
          { attack: "1d4 -2" }
        ],
        cooldown: 5
      },
      movement: { move: "1d4" }
    },

    abilities: {
      shield: { name: "Shield", shield: 2 },
      sharpSword: { name: "Sharp sword", attackBonus: 2 }
    }
  },

  boogschutter: {
    name: "Boogschutter",
    rarity: "Zeldzaam",
    class: "Boogschutter",
    hp: 8,
    int: "1d6 +10",
    color: "#e3b505",

    baseActions: {
      bow: { type: "attack", value: "1d6", range: 4 },
      special: {
        name: "Multishot",
        attack: "1d4",
        range: 3,
        target: 3,
        cooldown: 4
      },
      movement: { move: 3, heal: "1d4 -2" }
    },

    abilities: {
      focus: { name: "Focus", rangeBonus: 1 },
      medkit: { name: "Medkit", heal: "1d4 +1" }
    }
  }
};

// === MAPS ===
const MAPS = {
  meadow: {
    name: "Meadow Plains",
    size: { w: 7, h: 5 },

    // logic grid (0 = walkable, 1 = wall)
    logic: [
      [0,0,0,0,0,0,0],
      [0,1,0,1,0,1,0],
      [0,0,0,0,0,0,0],
      [0,1,0,1,0,1,0],
      [0,0,0,0,0,0,0],
    ],

    // art grid (for rendering visuals)
    art: [
      [0,0,0,0,0,0,0],
      [0,2,0,2,0,2,0],
      [0,0,0,0,0,0,0],
      [0,2,0,2,0,2,0],
      [0,0,0,0,0,0,0],
    ],

    artLegend: {
      0: "grass",
      1: "stone",
      2: "wall"
    }
  }
};
