// player.js — Player entity, movement, stealth states, footprints
import { PLAYER_SPEED, PLAYER_RADIUS, TILE_SIZE, COLORS } from './constants.js';
import { isSolid, isLowCover } from './levels.js';
import { sound } from './sound.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = PLAYER_RADIUS;
    this.angle = 0;
    this.hasKey = false;
    this.inCover = false;
    this.lightLevel = 0.2; // 0 = complete darkness, 1 = direct light
    this.isMoving = false;
    this.isSneaking = false;
    this.footprints = [];
    this._stepTimer = 0;
    this.detectionLevel = 0; // Max detection among all guards
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.hasKey = false;
    this.inCover = false;
    this.lightLevel = 0.2;
    this.isMoving = false;
    this.isSneaking = false;
    this.footprints = [];
    this._stepTimer = 0;
    this.detectionLevel = 0;
  }

  update(input, grid, lights) {
    const { dx, dy } = input.getMovement();
    this.isSneaking = input.isSneaking();
    const speed = this.isSneaking ? PLAYER_SPEED * 0.55 : PLAYER_SPEED;

    this.isMoving = dx !== 0 || dy !== 0;

    if (this.isMoving) {
      this.angle = Math.atan2(dy, dx);
      this._move(dx * speed, dy * speed, grid);

      // Footstep sound & visual footprint ripple
      this._stepTimer += speed;
      const stepInterval = this.isSneaking ? 28 : 16;
      if (this._stepTimer >= stepInterval) {
        this._stepTimer = 0;
        sound.playFootstep(this.isSneaking);
        this.footprints.push({
          x: this.x,
          y: this.y,
          angle: this.angle,
          alpha: this.isSneaking ? 0.3 : 0.6,
          radius: this.isSneaking ? 4 : 8,
          isSneak: this.isSneaking,
        });
      }
    }

    // Decay footprints
    for (let i = this.footprints.length - 1; i >= 0; i--) {
      this.footprints[i].alpha -= 0.006;
      if (this.footprints[i].alpha <= 0) {
        this.footprints.splice(i, 1);
      }
    }

    // Check if player is currently crouching behind low cover
    const col = Math.floor(this.x / TILE_SIZE);
    const row = Math.floor(this.y / TILE_SIZE);
    this.inCover = isLowCover(grid, col, row);

    // Calculate light exposure from nearby lamps
    this._calculateLightExposure(lights, grid);
  }

  _move(vx, vy, grid) {
    // Attempt movement on X axis with sliding
    const nextX = this.x + vx;
    if (!this._collides(nextX, this.y, grid)) {
      this.x = nextX;
    }

    // Attempt movement on Y axis with sliding
    const nextY = this.y + vy;
    if (!this._collides(this.x, nextY, grid)) {
      this.y = nextY;
    }
  }

  _collides(px, py, grid) {
    const r = this.radius;
    const minCol = Math.floor((px - r) / TILE_SIZE);
    const maxCol = Math.floor((px + r) / TILE_SIZE);
    const minRow = Math.floor((py - r) / TILE_SIZE);
    const maxRow = Math.floor((py + r) / TILE_SIZE);

    for (let rIdx = minRow; rIdx <= maxRow; rIdx++) {
      for (let cIdx = minCol; cIdx <= maxCol; cIdx++) {
        if (isSolid(grid, cIdx, rIdx)) {
          // Circle vs AABB tile collision
          const tileLeft = cIdx * TILE_SIZE;
          const tileTop = rIdx * TILE_SIZE;
          const nearestX = Math.max(tileLeft, Math.min(px, tileLeft + TILE_SIZE));
          const nearestY = Math.max(tileTop, Math.min(py, tileTop + TILE_SIZE));
          const dist = Math.hypot(px - nearestX, py - nearestY);
          if (dist < r) return true;
        }
      }
    }
    return false;
  }

  _calculateLightExposure(lights, grid) {
    if (!lights || lights.length === 0) {
      this.lightLevel = 0.2;
      return;
    }

    let maxExposure = 0.15; // Ambient shadows
    for (const light of lights) {
      const dist = Math.hypot(light.x - this.x, light.y - this.y);
      if (dist < light.radius) {
        // Line of sight check to light source
        if (this._hasLineOfSight(light.x, light.y, this.x, this.y, grid)) {
          const intensity = 1 - (dist / light.radius);
          if (intensity > maxExposure) {
            maxExposure = intensity;
          }
        }
      }
    }
    this.lightLevel = maxExposure;
  }

  _hasLineOfSight(x1, y1, x2, y2, grid) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.floor(dist / 12);
    const dx = (x2 - x1) / steps;
    const dy = (y2 - y1) / steps;

    for (let i = 1; i < steps; i++) {
      const cx = x1 + dx * i;
      const cy = y1 + dy * i;
      const col = Math.floor(cx / TILE_SIZE);
      const row = Math.floor(cy / TILE_SIZE);
      if (isSolid(grid, col, row)) return false;
    }
    return true;
  }
}
