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
      this.footprints[i].alpha -= 0.005;
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

    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        if (isSolid(grid, col, row)) {
          // Circle-rectangle collision test
          const rx = col * TILE_SIZE;
          const ry = row * TILE_SIZE;
          const closestX = Math.max(rx, Math.min(px, rx + TILE_SIZE));
          const closestY = Math.max(ry, Math.min(py, ry + TILE_SIZE));
          const distX = px - closestX;
          const distY = py - closestY;
          if (distX * distX + distY * distY < r * r) {
            return true;
          }
        }
      }
    }
    return false;
  }

  _calculateLightExposure(lights, grid) {
    let maxLight = 0.15; // Ambient base darkness
    for (const light of lights) {
      const dx = this.x - light.x;
      const dy = this.y - light.y;
      const dist = Math.hypot(dx, dy);
      if (dist < light.radius) {
        // Simple raycast to check if wall blocks the light
        if (!this._isLineBlocked(light.x, light.y, this.x, this.y, grid)) {
          const falloff = 1 - dist / light.radius;
          const intensity = falloff * 0.85;
          if (intensity > maxLight) maxLight = intensity;
        }
      }
    }
    this.lightLevel = maxLight;
  }

  _isLineBlocked(x1, y1, x2, y2, grid) {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 10);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const cx = x1 + (x2 - x1) * t;
      const cy = y1 + (y2 - y1) * t;
      const c = Math.floor(cx / TILE_SIZE);
      const r = Math.floor(cy / TILE_SIZE);
      if (isSolid(grid, c, r)) return true;
    }
    return false;
  }
}
