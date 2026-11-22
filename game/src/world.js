// world.js — Game simulation, collision, security systems, gadgets, win/caught conditions
import { LEVELS, findTile, getTile, isSolid } from './levels.js';
import { Player } from './player.js';
import { Guard } from './guards.js';
import { LightingEngine } from './lighting.js';
import { SecuritySystem } from './security.js';
import { GadgetManager } from './gadgets.js';
import { TILE, TILE_SIZE, ALERT_THRESHOLD } from './constants.js';
import { sound } from './sound.js';

export class GameWorld {
  constructor() {
    this.currentLevelIndex = 0;
    this.lighting = new LightingEngine();
    this.gadgets = new GadgetManager();
    this.security = new SecuritySystem();
    this.player = null;
    this.guards = [];
    this.exitUnlocked = false;
    this.isVictory = false;
    this.isCaught = false;
    this.maxDetection = 0;

    this.loadLevel(0);
  }

  loadLevel(index) {
    this.currentLevelIndex = index % LEVELS.length;
    this.level = LEVELS[this.currentLevelIndex];
    this.exitUnlocked = !this.level.exitRequiresKey;
    this.isVictory = false;
    this.isCaught = false;
    this.maxDetection = 0;

    // 1. Initialize Player at spawn tile
    const spawnPos = findTile(this.level.grid, TILE.SPAWN);
    if (!this.player) {
      this.player = new Player(spawnPos.x, spawnPos.y);
    } else {
      this.player.reset(spawnPos.x, spawnPos.y);
    }

    // 2. Initialize Guards
    this.guards = (this.level.guards || []).map(cfg => new Guard(cfg));

    // 3. Initialize Security Systems (Cameras & Laser Tripwires)
    this.security = new SecuritySystem(this.level.cameras, this.level.lasers);

    // 4. Reset Gadgets
    this.gadgets.reset();
  }

  restartLevel() {
    this.loadLevel(this.currentLevelIndex);
  }

  nextLevel() {
    this.loadLevel(this.currentLevelIndex + 1);
  }

  update(input) {
    if (this.isVictory || this.isCaught) return;

    // 1. Handle Gadget Inputs (Q: Smoke Vial, E: Decoy Pebble)
    if (input.wasPressed('KeyQ')) {
      this.gadgets.deploySmoke(this.player.x, this.player.y);
    }

    if (input.wasPressed('KeyE')) {
      let targetX = input.mouseX;
      let targetY = input.mouseY;
      const dist = Math.hypot(targetX - this.player.x, targetY - this.player.y);
      if (dist > 220 || dist < 20) {
        // Default target: 140px in facing direction
        targetX = this.player.x + Math.cos(this.player.angle) * 140;
        targetY = this.player.y + Math.sin(this.player.angle) * 140;
      }
      this.gadgets.throwPebble(this.player.x, this.player.y, targetX, targetY, this.guards);
    }

    // 2. Update Gadgets Simulation
    this.gadgets.update(this.guards);

    // 3. Update Player
    this.player.update(input, this.level.grid, this.level.lights);

    // 4. Update Security Systems (Surveillance Cameras & Laser Grids)
    this.security.update(this.player, this.level.grid, this.gadgets, (reason) => {
      this._triggerCaught(reason);
    });
    if (this.isCaught) return;

    // 5. Update Guards
    let highestDet = 0;
    for (const guard of this.guards) {
      guard.update(this.player, this.level.grid, this.gadgets);
      if (guard.detection > highestDet) highestDet = guard.detection;

      // Check physical catch collision
      const dist = Math.hypot(guard.x - this.player.x, guard.y - this.player.y);
      if (dist < guard.radius + this.player.radius - 2) {
        this._triggerCaught('A sentry apprehended you!');
        return;
      }
    }
    this.maxDetection = highestDet;
    this.player.detectionLevel = highestDet;

    // Full detection trigger
    if (this.maxDetection >= ALERT_THRESHOLD) {
      this._triggerCaught('The alarm was raised! Infiltration failed.');
      return;
    }

    // 6. Tile Interaction Check (Key, Door, Exit)
    const pCol = Math.floor(this.player.x / TILE_SIZE);
    const pRow = Math.floor(this.player.y / TILE_SIZE);
    const standingTile = getTile(this.level.grid, pCol, pRow);

    // Pick up key
    if (standingTile === TILE.KEY_ITEM && !this.player.hasKey) {
      this.player.hasKey = true;
      this.exitUnlocked = true;
      this.level.grid[pRow][pCol] = TILE.EMPTY; // Remove key from map
      sound.playKeyPickup();

      // Unlock doors in grid
      for (let r = 0; r < this.level.grid.length; r++) {
        for (let c = 0; c < this.level.grid[r].length; c++) {
          if (this.level.grid[r][c] === TILE.DOOR_LOCKED) {
            this.level.grid[r][c] = TILE.EMPTY;
          }
        }
      }
    }

    // Touch exit zone
    if (standingTile === TILE.EXIT && this.exitUnlocked) {
      this._triggerVictory();
    }
  }

  _triggerCaught(reason) {
    this.isCaught = true;
    this.caughtReason = reason;
    sound.playCaught();
  }

  _triggerVictory() {
    this.isVictory = true;
    sound.playVictory();
  }
}
