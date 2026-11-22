// security.js — Surveillance cameras, laser tripwires, and facility countermeasures
import { sound } from './sound.js';

export class SecuritySystem {
  constructor(cameras = [], lasers = []) {
    this.cameras = (cameras || []).map(c => new SecurityCamera(c));
    this.lasers = (lasers || []).map(l => new LaserTripwire(l));
  }

  update(player, grid, gadgets, onAlarm) {
    for (const cam of this.cameras) {
      cam.update(player, grid, gadgets, onAlarm);
    }
    for (const laser of this.lasers) {
      laser.update(player, onAlarm);
    }
  }
}

export class SecurityCamera {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.baseAngle = config.angle || 0;
    this.sweepAngle = config.sweepAngle || (Math.PI / 2.2); // ~80 degrees
    this.sweepSpeed = config.speed || 0.014;
    this.range = config.range || 170;
    this.fov = config.fov || (Math.PI / 3.2); // ~56 degrees
    this.currentAngle = this.baseAngle;
    this.sweepOffset = 0;
    this.sweepDir = 1;
    this.detection = 0;
    this.isAlerting = false;
    this.visionPolygon = [];
  }

  update(player, grid, gadgets, onAlarm) {
    // 1. Sweep rotation back and forth
    this.sweepOffset += this.sweepSpeed * this.sweepDir;
    if (Math.abs(this.sweepOffset) > this.sweepAngle / 2) {
      this.sweepDir *= -1;
    }
    this.currentAngle = this.baseAngle + this.sweepOffset;

    // 2. Compute vision polygon raycast
    this._computeVisionPolygon(grid, gadgets);

    // 3. Check if player is detected in beam
    const canSee = this._checkPlayerInVision(player, grid, gadgets);
    if (canSee) {
      this.detection = Math.min(1.0, this.detection + 0.045);
      if (this.detection >= 0.45 && !this.isAlerting) {
        sound.playCameraAlert();
        this.isAlerting = true;
      }
      if (this.detection >= 1.0) {
        onAlarm('Security camera detected intruder!');
      }
    } else {
      this.detection = Math.max(0, this.detection - 0.02);
      if (this.detection < 0.3) {
        this.isAlerting = false;
      }
    }
  }

  _computeVisionPolygon(grid, gadgets) {
    const rays = 24;
    const halfFov = this.fov / 2;
    const startAngle = this.currentAngle - halfFov;
    const step = this.fov / rays;
    const poly = [{ x: this.x, y: this.y }];

    for (let i = 0; i <= rays; i++) {
      const angle = startAngle + i * step;
      let castDist = this.range;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Raycast against walls
      for (let d = 8; d <= this.range; d += 8) {
        const testX = this.x + cosA * d;
        const testY = this.y + sinA * d;
        const col = Math.floor(testX / 32);
        const row = Math.floor(testY / 32);
        if (col < 0 || col >= 30 || row < 0 || row >= 20 || (grid[row] && (grid[row][col] === 1 || grid[row][col] === 3))) {
          castDist = d;
          break;
        }
        if (gadgets && gadgets.isPointInSmoke(testX, testY)) {
          castDist = d;
          break;
        }
      }
      poly.push({
        x: this.x + cosA * castDist,
        y: this.y + sinA * castDist,
      });
    }
    this.visionPolygon = poly;
  }

  _checkPlayerInVision(player, grid, gadgets) {
    if (gadgets && (gadgets.isPointInSmoke(player.x, player.y) || gadgets.isLineBlockedBySmoke(this.x, this.y, player.x, player.y))) {
      return false;
    }
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.range) return false;

    const angleToPlayer = Math.atan2(dy, dx);
    let diff = angleToPlayer - this.currentAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    if (Math.abs(diff) > this.fov / 2) return false;

    // Check line of sight
    const steps = Math.floor(dist / 12);
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const checkX = this.x + dx * t;
      const checkY = this.y + dy * t;
      const col = Math.floor(checkX / 32);
      const row = Math.floor(checkY / 32);
      if (grid[row] && (grid[row][col] === 1 || grid[row][col] === 3)) return false;
    }
    return true;
  }
}

export class LaserTripwire {
  constructor(config) {
    this.x1 = config.x1;
    this.y1 = config.y1;
    this.x2 = config.x2;
    this.y2 = config.y2;
    this.cycle = config.cycle || 0; // If > 0, cycles on and off
    this.activeTime = config.activeTime || 140;
    this.inactiveTime = config.inactiveTime || 90;
    this.timer = config.offset || 0;
    this.isActive = true;
  }

  update(player, onAlarm) {
    if (this.cycle > 0) {
      this.timer = (this.timer + 1) % (this.activeTime + this.inactiveTime);
      this.isActive = this.timer < this.activeTime;
    }

    if (!this.isActive) return;

    // Check player circle intersection with laser line segment
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return;

    const t = Math.max(0, Math.min(1, ((player.x - this.x1) * dx + (player.y - this.y1) * dy) / lenSq));
    const projX = this.x1 + t * dx;
    const projY = this.y1 + t * dy;
    const dist = Math.hypot(player.x - projX, player.y - projY);

    if (dist < player.radius + 2) {
      sound.playLaser();
      onAlarm('Intruder tripped high-voltage laser barrier!');
    }
  }
}
