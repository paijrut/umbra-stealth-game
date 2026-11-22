// guards.js — Guard AI, state machine, line-of-sight raycasting, vision cones
import {
  GUARD_SPEED, GUARD_RADIUS, GUARD_VIEW_RANGE, GUARD_VIEW_ANGLE,
  TILE_SIZE, DETECTION_RATE, DEESCALATION_RATE, ALERT_THRESHOLD,
  SUSPICIOUS_THRESHOLD, COLORS
} from './constants.js';
import { isSolid } from './levels.js';
import { sound } from './sound.js';

export const GUARD_STATE = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  ALERT: 'alert',
  SEARCH: 'search',
  RETURN: 'return',
};

export class Guard {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.patrol = config.patrol || [{ x: config.x, y: config.y }];
    this.currentWaypoint = 0;
    this.speed = config.speed || GUARD_SPEED;
    this.radius = GUARD_RADIUS;

    this.angle = 0;
    this.targetAngle = 0;
    this.state = GUARD_STATE.PATROL;

    this.detection = 0; // 0.0 to 1.0
    this.investigatePos = null;
    this.searchTimer = 0;
    this.waitTime = 0;

    this.visionPolygon = [];
    this._playedSuspicious = false;
    this._playedAlert = false;
  }

  update(player, grid, gadgets = null, dt = 1) {
    // 1. Raycast vision cone against world walls and smoke clouds
    this._computeVisionPolygon(grid, gadgets);

    // 2. Check Line of Sight & Detection
    const canSeePlayer = this._checkPlayerInVision(player, grid, gadgets);
    const canHearPlayer = this._checkPlayerNoise(player, grid);

    if (canSeePlayer) {
      // Detection rate depends on player light exposure and cover
      let rate = DETECTION_RATE * (0.5 + player.lightLevel * 1.5);
      if (player.inCover) rate *= 0.3; // Low cover reduces sight significantly
      if (player.isSneaking && !player.isMoving) rate *= 0.5;

      this.detection = Math.min(ALERT_THRESHOLD, this.detection + rate * 0.016 * dt);
      this.investigatePos = { x: player.x, y: player.y };

      if (this.detection >= ALERT_THRESHOLD) {
        if (!this._playedAlert) {
          sound.playAlert();
          this._playedAlert = true;
        }
        this.state = GUARD_STATE.ALERT;
      } else if (this.detection >= SUSPICIOUS_THRESHOLD && this.state !== GUARD_STATE.ALERT) {
        if (!this._playedSuspicious) {
          sound.playSuspicious();
          this._playedSuspicious = true;
        }
        this.state = GUARD_STATE.SUSPICIOUS;
        this.targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
      }
    } else if (canHearPlayer && this.state === GUARD_STATE.PATROL) {
      // Heard running footstep
      this.state = GUARD_STATE.SUSPICIOUS;
      this.investigatePos = { x: player.x, y: player.y };
      this.targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
      this.detection = Math.max(this.detection, SUSPICIOUS_THRESHOLD * 0.8);
      if (!this._playedSuspicious) {
        sound.playSuspicious();
        this._playedSuspicious = true;
      }
    } else {
      // Lose detection gradually when player is hidden
      this.detection = Math.max(0, this.detection - DEESCALATION_RATE * 0.016 * dt);
      if (this.detection < SUSPICIOUS_THRESHOLD) {
        this._playedSuspicious = false;
        this._playedAlert = false;
      }
    }

    // 3. State Machine Behavior
    switch (this.state) {
      case GUARD_STATE.ALERT:
        this._chase(player, grid);
        if (!canSeePlayer) {
          this.state = GUARD_STATE.SEARCH;
          this.searchTimer = 180; // Search last known spot for 3 seconds
        }
        break;

      case GUARD_STATE.SUSPICIOUS:
        this._investigate(grid);
        break;

      case GUARD_STATE.SEARCH:
        this._searchLookAround();
        this.searchTimer -= dt;
        if (this.searchTimer <= 0) {
          this.state = GUARD_STATE.RETURN;
        }
        break;

      case GUARD_STATE.RETURN:
        this._returnToPatrol(grid);
        break;

      case GUARD_STATE.PATROL:
      default:
        this._patrol(grid, dt);
        break;
    }

    // 4. Smooth angle turning towards target angle
    this._turnTowardsTarget(0.12 * dt);
  }

  _computeVisionPolygon(grid, gadgets = null) {
    const rays = 32;
    const halfAngle = GUARD_VIEW_ANGLE / 2;
    const startAngle = this.angle - halfAngle;
    const step = GUARD_VIEW_ANGLE / rays;
    const poly = [{ x: this.x, y: this.y }];

    for (let i = 0; i <= rays; i++) {
      const rayAngle = startAngle + i * step;
      let castDist = GUARD_VIEW_RANGE;
      const cosA = Math.cos(rayAngle);
      const sinA = Math.sin(rayAngle);

      // Step along ray until wall or boundary
      for (let d = 8; d <= GUARD_VIEW_RANGE; d += 8) {
        const testX = this.x + cosA * d;
        const testY = this.y + sinA * d;
        const col = Math.floor(testX / TILE_SIZE);
        const row = Math.floor(testY / TILE_SIZE);

        if (isSolid(grid, col, row)) {
          castDist = d;
          break;
        }
        // Vision blocked by smoke clouds
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

  _checkPlayerInVision(player, grid, gadgets = null) {
    // If player is inside smoke cloud or smoke lies between guard and player, vision is blocked
    if (gadgets) {
      if (gadgets.isPointInSmoke(player.x, player.y)) return false;
      if (gadgets.isLineBlockedBySmoke(this.x, this.y, player.x, player.y)) return false;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Distance check
    if (dist > GUARD_VIEW_RANGE) return false;

    // Angle check (is within FOV cone?)
    const angleToPlayer = Math.atan2(dy, dx);
    let diff = angleToPlayer - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    if (Math.abs(diff) > GUARD_VIEW_ANGLE / 2) return false;

    // Line of sight raycast against solid tiles
    const steps = Math.floor(dist / 10);
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const checkX = this.x + dx * t;
      const checkY = this.y + dy * t;
      const col = Math.floor(checkX / TILE_SIZE);
      const row = Math.floor(checkY / TILE_SIZE);
      if (isSolid(grid, col, row)) return false;
    }

    return true;
  }

  _checkPlayerNoise(player, grid) {
    if (!player.isMoving || player.isSneaking) return false;
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    return dist < 120; // Running footstep auditory threshold
  }

  _patrol(grid, dt) {
    if (!this.patrol || this.patrol.length === 0) return;

    if (this.waitTime > 0) {
      this.waitTime -= dt;
      return;
    }

    const target = this.patrol[this.currentWaypoint];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 8) {
      this.currentWaypoint = (this.currentWaypoint + 1) % this.patrol.length;
      this.waitTime = 60; // Pause for 1 second at each waypoint
    } else {
      this.targetAngle = Math.atan2(dy, dx);
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
  }

  _chase(player, grid) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 4) {
      this.targetAngle = Math.atan2(dy, dx);
      this.x += (dx / dist) * (this.speed * 1.45);
      this.y += (dy / dist) * (this.speed * 1.45);
    }
  }

  _investigate(grid) {
    if (!this.investigatePos) {
      this.state = GUARD_STATE.PATROL;
      return;
    }
    const dx = this.investigatePos.x - this.x;
    const dy = this.investigatePos.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 16) {
      this.investigatePos = null;
      this.state = GUARD_STATE.SEARCH;
      this.searchTimer = 140;
    } else {
      this.targetAngle = Math.atan2(dy, dx);
      this.x += (dx / dist) * (this.speed * 1.1);
      this.y += (dy / dist) * (this.speed * 1.1);
    }
  }

  _searchLookAround() {
    this.targetAngle += 0.04; // Slowly scan in circle
  }

  _returnToPatrol(grid) {
    const target = this.patrol[this.currentWaypoint] || { x: this.x, y: this.y };
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 12) {
      this.state = GUARD_STATE.PATROL;
    } else {
      this.targetAngle = Math.atan2(dy, dx);
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  _turnTowardsTarget(turnSpeed) {
    let diff = this.targetAngle - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.angle += diff * turnSpeed;
  }
}
