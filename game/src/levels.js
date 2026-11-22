// levels.js — Level data and map definitions
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
  {
    name: 'The Vaulted Gallery',
    subtitle: 'Retrieve the cipher key and reach the rooftop.',
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
#..............c........K....#
##############################`, COLS),
    guards: [
      { x: 400, y: 160, patrol: [{ x: 400, y: 160 }, { x: 560, y: 160 }, { x: 560, y: 260 }, { x: 400, y: 260 }], speed: 1.3 },
      { x: 200, y: 350, patrol: [{ x: 200, y: 350 }, { x: 200, y: 480 }, { x: 100, y: 480 }, { x: 100, y: 350 }], speed: 1.1 },
      { x: 650, y: 300, patrol: [{ x: 650, y: 300 }, { x: 800, y: 300 }, { x: 800, y: 500 }, { x: 650, y: 500 }], speed: 1.4 },
      { x: 500, y: 500, patrol: [{ x: 500, y: 500 }, { x: 350, y: 500 }, { x: 350, y: 580 }, { x: 500, y: 580 }], speed: 1.2 },
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
  {
    name: 'The Clock Tower',
    subtitle: 'Ascend through the guard station unseen.',
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
  {
    name: 'The Iron Archives',
    subtitle: 'The final vault. No mistakes.',
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
