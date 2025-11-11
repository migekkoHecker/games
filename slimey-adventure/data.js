// data.js

// === CHARACTERS ===
const CHARACTERS = {
  ivo: {
    name: "Ivo",
    class: "Magier",
    type: "Controleur",
    hp: 12,
    special: 1,
    abilities: 0,
    color: "#6f42c1"
  },
  aria: {
    name: "Aria",
    class: "Ridder",
    type: "Tank",
    hp: 16,
    special: 1,
    abilities: 0,
    color: "#c9182a"
  },
  nox: {
    name: "Nox",
    class: "Boogschutter",
    type: "Marksman",
    hp: 8,
    special: 1,
    abilities: 0,
    color: "#0b7285"
  }
};


// === MAPS ===
const MAPS = {
  // Example: “Meadow Plains” starter map
  meadow: {
    name: "Meadow Plains",
    size: { w: 7, h: 5 },

    // logic map — determines movement, collisions, etc.
    logic: [
      [0,0,0,0,0,0,0],
      [0,1,0,1,0,1,0],
      [0,0,0,0,0,0,0],
      [0,1,0,1,0,1,0],
      [0,0,0,0,0,0,0],
    ],

    // art map — what tile to render visually
    art: [
      [0,0,0,0,0,0,0],
      [0,2,0,2,0,2,0],
      [0,0,0,0,0,0,0],
      [0,2,0,2,0,2,0],
      [0,0,0,0,0,0,0],
    ],

    // legend for tile types
    artLegend: {
      0: "grass",
      1: "stone",
      2: "wall"
    }
  },

  // Example: “Lava Ruins”
  lava: {
    name: "Lava Ruins",
    size: { w: 7, h: 5 },
    logic: [
      [0,0,1,1,1,0,0],
      [0,0,0,0,0,0,0],
      [1,1,0,0,0,1,1],
      [0,0,0,0,0,0,0],
      [0,0,1,1,1,0,0],
    ],
    art: [
      [2,2,1,1,1,2,2],
      [2,0,0,0,0,0,2],
      [1,1,0,0,0,1,1],
      [2,0,0,0,0,0,2],
      [2,2,1,1,1,2,2],
    ],
    artLegend: {
      0: "lava",
      1: "stone",
      2: "obsidian"
    }
  }
};
