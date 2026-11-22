// levels.js — Level data, security definitions, and map grids
import { TILE, COLS, ROWS } from './constants.js';

function parseLevelString(str, width) {
  const charMap = {
    '.': TILE.EMPTY, '#': TILE.WALL, 'c': TILE.COVER_LOW, 'C': TILE.COVER_TALL,
    'E': TILE.EXIT, 'S': TILE.SPAWN, 'L': TILE.LIGHT_WARM, 'l': TILE.LIGHT_COOL,
    'V': TILE.VENT, 'K': TILE.KEY_ITEM, 'D': TILE.DOOR_LOCKED, 'P': TILE.CHECKPOINT,
    'd': TILE.DECORATION,
  };
  const lines = str.trim().split('\n').map(l => l.trim());
  const grid = [];
  for (let y = 0; y < lines.length; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const ch = lines[y]?.[x] || '.';
      row.push(charMap[ch] ?? TILE.EMPTY);
    }
    grid.push(row);
  }
  return grid;
}

export const LEVELS = [
  // Level 1: The Vaulted Gallery (Ground Floor)
  {
    name: 'The Vaulted Gallery',
    subtitle: 'Retrieve the brass cipher key and bypass the security corridor.',
    grid: parseLevelString(`
##############################
#S...L..........#............#
#....#..........#....c.c..c..#
#....#....cc....#............#
#..........c....D............#
#....#..........#....c...c...#
###.##..L.......#............#
#.............###.####.####..#
#....cc.cc.........L.........#
#....cc.cc..c................#
#............c..........cc...#
#...L........c...c.......c...#
#...........##.###.....c.c...#
#.cc..cc.........#...........#
#.cc..cc..L......#....L......#
#................#...........#
#..........####..#.########.##
#....L.........c.............#
#..............c........K..E.#
##############################`, COLS),
    guards: [
      { x: 380, y: 140, patrol: [{ x: 380, y: 140 }, { x: 540, y: 140 }, { x: 540, y: 260 }, { x: 380, y: 260 }], speed: 1.3 },
      { x: 180, y: 350, patrol: [{ x: 180, y: 350 }, { x: 180, y: 480 }, { x: 100, y: 480 }, { x: 100, y: 350 }], speed: 1.1 },
      { x: 660, y: 280, patrol: [{ x: 660, y: 280 }, { x: 820, y: 280 }, { x: 820, y: 480 }, { x: 660, y: 480 }], speed: 1.35 },
      { x: 480, y: 500, patrol: [{ x: 480, y: 500 }, { x: 340, y: 500 }, { x: 340, y: 580 }, { x: 480, y: 580 }], speed: 1.2 },
    ],
    cameras: [
      { x: 480, y: 34, angle: Math.PI / 2, sweepAngle: Math.PI / 3, speed: 0.012, range: 160 },
      { x: 880, y: 220, angle: Math.PI, sweepAngle: Math.PI / 2.5, speed: 0.015, range: 170 },
    ],
    lasers: [
      { x1: 512, y1: 192, x2: 512, y2: 288, cycle: 240, activeTime: 140, inactiveTime: 100 },
    ],
    lights: [
      { x: 170, y: 48, radius: 120, color: 'warm', flicker: true },
      { x: 300, y: 256, radius: 100, color: 'warm', flicker: false },
      { x: 170, y: 368, radius: 110, color: 'warm', flicker: true },
      { x: 560, y: 48, radius: 90, color: 'cool', flicker: false },
      { x: 750, y: 272, radius: 100, color: 'warm', flicker: false },
      { x: 560, y: 480, radius: 110, color: 'warm', flicker: true },
      { x: 750, y: 460, radius: 90, color: 'cool', flicker: false },
    ],
    exitRequiresKey: true,
  },

  // Level 2: The Clock Tower (The Gearworks)
  {
    name: 'The Clock Tower',
    subtitle: 'Ascend through rotating security checkpoints and gear shafts.',
    grid: parseLevelString(`
##############################
#.........#.........#........#
#..S......#....L....#........#
#.........#.........#.....c..#
#..cc..##.#....c....#........#
#.........#.........####.#####
####.######.........#........#
#..........c........#...L....#
#...L......c........#........#
#....cc............##........#
#....cc....#.......#...cc.cc.#
#..........#..L....#...cc.cc.#
######.#####.......#.........#
#..........#.......####.######
#..c..L....#.................#
#..c.......#.........c.......#
#..........#####.#####.......#
#..c.c...........#.....L.....#
#................#.........E.#
##############################`, COLS),
    guards: [
      { x: 350, y: 130, patrol: [{ x: 350, y: 130 }, { x: 350, y: 300 }, { x: 480, y: 300 }, { x: 480, y: 130 }], speed: 1.3 },
      { x: 150, y: 420, patrol: [{ x: 150, y: 420 }, { x: 350, y: 420 }, { x: 350, y: 530 }, { x: 150, y: 530 }], speed: 1.2 },
      { x: 700, y: 200, patrol: [{ x: 700, y: 200 }, { x: 850, y: 200 }, { x: 850, y: 350 }, { x: 700, y: 350 }], speed: 1.4 },
      { x: 650, y: 480, patrol: [{ x: 650, y: 480 }, { x: 850, y: 480 }, { x: 850, y: 580 }, { x: 650, y: 580 }], speed: 1.1 },
      { x: 200, y: 260, patrol: [{ x: 200, y: 260 }, { x: 100, y: 260 }, { x: 100, y: 380 }, { x: 200, y: 380 }], speed: 1.0 },
    ],
    cameras: [
      { x: 512, y: 192, angle: Math.PI * 0.75, sweepAngle: Math.PI / 2, speed: 0.014, range: 165 },
      { x: 640, y: 416, angle: Math.PI / 2, sweepAngle: Math.PI / 2.5, speed: 0.016, range: 175 },
    ],
    lasers: [
      { x1: 224, y1: 192, x2: 384, y2: 192, cycle: 200, activeTime: 120, inactiveTime: 80 },
    ],
    lights: [
      { x: 430, y: 100, radius: 120, color: 'warm', flicker: true },
      { x: 170, y: 272, radius: 100, color: 'warm', flicker: false },
      { x: 410, y: 368, radius: 90, color: 'warm', flicker: true },
      { x: 750, y: 270, radius: 110, color: 'warm', flicker: false },
      { x: 200, y: 465, radius: 100, color: 'warm', flicker: true },
      { x: 750, y: 560, radius: 100, color: 'warm', flicker: false },
    ],
    exitRequiresKey: false,
  },

  // Level 3: The Iron Archives (Subterranean Vault)
  {
    name: 'The Iron Archives',
    subtitle: 'Infiltrate the subterranean vault through intersecting laser grids.',
    grid: parseLevelString(`
##############################
#....L....#..................#
#.........#....cc..cc........#
#..S......#....cc..cc........#
#.........#..................#
####.######...L..............#
#.........#..............#####
#..c......#.............##...#
#..c..L...####.####.#####.E.#
#.........#..............#...#
#.........#...c..........#####
#.........#...c...L..........#
####.######..................#
#............cc..............#
#...L........cc..............#
#............cc..####.########
#............cc..#...........#
#....c.c.........#....L......#
#................#...........#
##############################`, COLS),
    guards: [
      { x: 150, y: 160, patrol: [{ x: 150, y: 160 }, { x: 150, y: 300 }, { x: 50, y: 300 }, { x: 50, y: 160 }], speed: 1.5 },
      { x: 450, y: 100, patrol: [{ x: 450, y: 100 }, { x: 700, y: 100 }, { x: 700, y: 200 }, { x: 450, y: 200 }], speed: 1.4 },
      { x: 500, y: 350, patrol: [{ x: 500, y: 350 }, { x: 700, y: 350 }, { x: 700, y: 500 }, { x: 500, y: 500 }], speed: 1.3 },
      { x: 200, y: 450, patrol: [{ x: 200, y: 450 }, { x: 400, y: 450 }, { x: 400, y: 560 }, { x: 200, y: 560 }], speed: 1.2 },
      { x: 700, y: 540, patrol: [{ x: 700, y: 540 }, { x: 850, y: 540 }, { x: 850, y: 400 }, { x: 700, y: 400 }], speed: 1.5 },
      { x: 350, y: 260, patrol: [{ x: 350, y: 260 }, { x: 350, y: 380 }, { x: 480, y: 380 }, { x: 480, y: 260 }], speed: 1.1 },
    ],
    cameras: [
      { x: 288, y: 384, angle: Math.PI / 4, sweepAngle: Math.PI / 2, speed: 0.015, range: 175 },
      { x: 672, y: 288, angle: Math.PI * 0.9, sweepAngle: Math.PI / 2.2, speed: 0.018, range: 180 },
    ],
    lasers: [
      { x1: 320, y1: 192, x2: 320, y2: 384, cycle: 220, activeTime: 130, inactiveTime: 90 },
      { x1: 544, y1: 288, x2: 704, y2: 288, cycle: 190, activeTime: 110, inactiveTime: 80, offset: 50 },
    ],
    lights: [
      { x: 170, y: 48, radius: 110, color: 'warm', flicker: true },
      { x: 230, y: 272, radius: 100, color: 'warm', flicker: false },
      { x: 450, y: 180, radius: 90, color: 'cool', flicker: false },
      { x: 170, y: 465, radius: 110, color: 'warm', flicker: true },
      { x: 550, y: 370, radius: 100, color: 'warm', flicker: true },
      { x: 750, y: 560, radius: 90, color: 'warm', flicker: false },
    ],
    exitRequiresKey: false,
  },

  // Level 4: Midnight Observatory (Stellar Dome)
  {
    name: 'Midnight Observatory',
    subtitle: 'Infiltrate the stellar dome under astronomical spotlight sweeps.',
    grid: parseLevelString(`
##############################
#S...L......#......L.........#
#...........#................#
#..cc...cc..#...c...c...c....#
#..cc...cc..#................#
#...........#..c.....c.......#
###.#########..c..L..c..######
#...........#................#
#...L.......#................#
#.....c.....#....cc....cc....#
#.....c.....######.####.######
#.....c.....#................#
#...........#...c...L...c....#
######.######................#
#...........#....cc....cc....#
#...L.......#................#
#...........######.###########
#....cc.....#..........L.....#
#....cc.....#..............E.#
##############################`, COLS),
    guards: [
      { x: 240, y: 130, patrol: [{ x: 240, y: 130 }, { x: 340, y: 130 }, { x: 340, y: 280 }, { x: 240, y: 280 }], speed: 1.35 },
      { x: 580, y: 140, patrol: [{ x: 580, y: 140 }, { x: 840, y: 140 }, { x: 840, y: 260 }, { x: 580, y: 260 }], speed: 1.45 },
      { x: 220, y: 440, patrol: [{ x: 220, y: 440 }, { x: 340, y: 440 }, { x: 340, y: 560 }, { x: 120, y: 560 }], speed: 1.25 },
      { x: 560, y: 440, patrol: [{ x: 560, y: 440 }, { x: 820, y: 440 }, { x: 820, y: 560 }, { x: 560, y: 560 }], speed: 1.4 },
    ],
    cameras: [
      { x: 384, y: 34, angle: Math.PI / 2, sweepAngle: Math.PI / 2.2, speed: 0.015, range: 175 },
      { x: 608, y: 288, angle: Math.PI / 2, sweepAngle: Math.PI / 2, speed: 0.014, range: 170 },
      { x: 384, y: 416, angle: 0, sweepAngle: Math.PI / 2.5, speed: 0.016, range: 165 },
    ],
    lasers: [
      { x1: 384, y1: 192, x2: 544, y2: 192, cycle: 210, activeTime: 130, inactiveTime: 80 },
      { x1: 544, y1: 384, x2: 704, y2: 384, cycle: 230, activeTime: 140, inactiveTime: 90, offset: 60 },
    ],
    lights: [
      { x: 170, y: 48, radius: 120, color: 'warm', flicker: true },
      { x: 650, y: 48, radius: 110, color: 'cool', flicker: false },
      { x: 170, y: 272, radius: 95, color: 'warm', flicker: false },
      { x: 670, y: 192, radius: 100, color: 'warm', flicker: true },
      { x: 170, y: 480, radius: 105, color: 'warm', flicker: false },
      { x: 670, y: 384, radius: 95, color: 'cool', flicker: true },
      { x: 780, y: 560, radius: 110, color: 'warm', flicker: false },
    ],
    exitRequiresKey: false,
  },

  // Level 5: Rooftop Helipad (Extraction Apex)
  {
    name: 'Rooftop Helipad',
    subtitle: 'The extraction apex. Evade elite sentries to reach the escape chopper.',
    grid: parseLevelString(`
##############################
#S...L......#............L...#
#...........#..cc...cc.......#
#..cc...cc..#..cc...cc.......#
#..cc...cc..#................#
#...........#......c.........#
######.######..L...c...#######
#............................#
#...L.......#................#
#.....c.....#....cc....cc....#
#.....c.....######.####.######
#.....c.....#................#
#...........#...c...L...c....#
######.######................#
#...........#....cc....cc....#
#...L.......#................#
#...........######.###########
#....cc.....#..........L.....#
#....cc.....#..............E.#
##############################`, COLS),
    guards: [
      { x: 260, y: 120, patrol: [{ x: 260, y: 120 }, { x: 340, y: 120 }, { x: 340, y: 260 }, { x: 260, y: 260 }], speed: 1.4 },
      { x: 560, y: 130, patrol: [{ x: 560, y: 130 }, { x: 800, y: 130 }, { x: 800, y: 240 }, { x: 560, y: 240 }], speed: 1.5 },
      { x: 420, y: 280, patrol: [{ x: 420, y: 280 }, { x: 740, y: 280 }, { x: 740, y: 360 }, { x: 420, y: 360 }], speed: 1.4 },
      { x: 220, y: 460, patrol: [{ x: 220, y: 460 }, { x: 340, y: 460 }, { x: 340, y: 560 }, { x: 120, y: 560 }], speed: 1.3 },
      { x: 620, y: 480, patrol: [{ x: 620, y: 480 }, { x: 820, y: 480 }, { x: 820, y: 560 }, { x: 620, y: 560 }], speed: 1.5 },
    ],
    cameras: [
      { x: 384, y: 34, angle: Math.PI / 2, sweepAngle: Math.PI / 2.2, speed: 0.016, range: 180 },
      { x: 736, y: 34, angle: Math.PI / 2, sweepAngle: Math.PI / 2, speed: 0.015, range: 175 },
      { x: 384, y: 416, angle: 0, sweepAngle: Math.PI / 2.4, speed: 0.017, range: 170 },
    ],
    lasers: [
      { x1: 384, y1: 192, x2: 384, y2: 384, cycle: 200, activeTime: 120, inactiveTime: 80 },
      { x1: 672, y1: 384, x2: 832, y2: 384, cycle: 220, activeTime: 130, inactiveTime: 90, offset: 40 },
    ],
    lights: [
      { x: 170, y: 48, radius: 120, color: 'warm', flicker: true },
      { x: 780, y: 48, radius: 120, color: 'cool', flicker: false },
      { x: 170, y: 272, radius: 100, color: 'warm', flicker: false },
      { x: 530, y: 192, radius: 110, color: 'warm', flicker: true },
      { x: 170, y: 480, radius: 105, color: 'warm', flicker: false },
      { x: 670, y: 384, radius: 100, color: 'cool', flicker: true },
      { x: 780, y: 560, radius: 120, color: 'warm', flicker: false },
    ],
    exitRequiresKey: false,
  },
];

export function getTile(grid, col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return TILE.WALL;
  return grid[row]?.[col] ?? TILE.WALL;
}

export function isSolid(grid, col, row) {
  const t = getTile(grid, col, row);
  return t === TILE.WALL || t === TILE.COVER_TALL || t === TILE.DOOR_LOCKED;
}

export function isLowCover(grid, col, row) {
  return getTile(grid, col, row) === TILE.COVER_LOW;
}

export function findTile(grid, type) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === type) return { x: c * 32 + 16, y: r * 32 + 16 };
    }
  }
  return { x: 80, y: 80 };
}

export function findAllTiles(grid, type) {
  const result = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === type) result.push({ x: c * 32 + 16, y: r * 32 + 16, col: c, row: r });
    }
  }
  return result;
}
