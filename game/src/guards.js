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

  update(player, grid, dt = 1) {
    // 1. Raycast vision cone against world walls
    this._computeVisionPolygon(grid);

    // 2. Check Line of Sight & Detection
    const canSeePlayer = this._checkPlayerInVision(player, grid);
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
        this._turnTowardsTarget();
        if (this.detection === 0) {
          this.state = GUARD_STATE.PATROL;
        }
        break;

      case GUARD_STATE.SEARCH:
        this._search(grid);
        break;

      case GUARD_STATE.RETURN:
        this._returnToPatrol(grid);
        break;

      case GUARD_STATE.PATROL:
      default:
        this._patrol(grid);
        break;
    }
  }

  _patrol(grid) {
    if (this.patrol.length === 0) return;

    if (this.waitTime > 0) {
      this.waitTime--;
      return;
    }

    const target = this.patrol[this.currentWaypoint];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 4) {
      this.currentWaypoint = (this.currentWaypoint + 1) % this.patrol.length;
      this.waitTime = 30; // Pause at waypoint
    } else {
      this.targetAngle = Math.atan2(dy, dx);
      this._turnTowardsTarget(0.08);
      const moveX = Math.cos(this.angle) * this.speed;
      const moveY = Math.sin(this.angle) * this.speed;
      this.x += moveX;
      this.y += moveY;
    }
  }

  _chase(player, grid) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    this.targetAngle = Math.atan2(dy, dx);
    this._turnTowardsTarget(0.15);

    const speed = this.speed * 1.5;
    const moveX = Math.cos(this.angle) * speed;
    const moveY = Math.sin(this.angle) * speed;
    if (!this._collides(this.x + moveX, this.y + moveY, grid)) {
      this.x += moveX;
      this.y += moveY;
    }
  }

  _search(grid) {
    if (this.investigatePos) {
      const dx = this.investigatePos.x - this.x;
      const dy = this.investigatePos.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) {
        this.targetAngle = Math.atan2(dy, dx);
        this._turnTowardsTarget(0.1);
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        return;
      }
    }

    // Look around at last known position
    this.searchTimer--;
    this.targetAngle += 0.04;
    this._turnTowardsTarget(0.08);

    if (this.searchTimer <= 0) {
      this.state = GUARD_STATE.RETURN;
    }
  }

  _returnToPatrol(grid) {
    const target = this.patrol[this.currentWaypoint];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 6) {
      this.state = GUARD_STATE.PATROL;
    } else {
      this.targetAngle = Math.atan2(dy, dx);
      this._turnTowardsTarget(0.08);
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
    }
  }

  _turnTowardsTarget(turnSpeed = 0.1) {
    let diff = this.targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.angle += diff * turnSpeed;
  }

  _computeVisionPolygon(grid) {
    const rayCount = 48;
    const halfAngle = GUARD_VIEW_ANGLE / 2;
    const startAngle = this.angle - halfAngle;
    const step = GUARD_VIEW_ANGLE / (rayCount - 1);

    this.visionPolygon = [{ x: this.x, y: this.y }];

    for (let i = 0; i < rayCount; i++) {
      const rayAngle = startAngle + i * step;
      const hit = this._castRay(this.x, this.y, rayAngle, GUARD_VIEW_RANGE, grid);
      this.visionPolygon.push(hit);
    }
  }

  _castRay(ox, oy, angle, maxDist, grid) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let dist = 0;
    const step = 6;

    while (dist < maxDist) {
      dist += step;
      const px = ox + cos * dist;
      const py = oy + sin * dist;
      const c = Math.floor(px / TILE_SIZE);
      const r = Math.floor(py / TILE_SIZE);

      if (isSolid(grid, c, r)) {
        return { x: px, y: py };
      }
    }
    return { x: ox + cos * maxDist, y: oy + sin * maxDist };
  }

  _checkPlayerInVision(player, grid) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > GUARD_VIEW_RANGE) return false;

    // Check angle relative to facing direction
    let angleToPlayer = Math.atan2(dy, dx) - this.angle;
    while (angleToPlayer < -Math.PI) angleToPlayer += Math.PI * 2;
    while (angleToPlayer > Math.PI) angleToPlayer -= Math.PI * 2;

    if (Math.abs(angleToPlayer) > GUARD_VIEW_ANGLE / 2) {
      // Can't see unless very close behind (proximity detection)
      if (dist > GUARD_RADIUS + player.radius + 6) return false;
    }

    // Check line-of-sight obstruction
    return !this._isLineBlocked(this.x, this.y, player.x, player.y, grid);
  }

  _checkPlayerNoise(player, grid) {
    if (!player.isMoving || player.isSneaking) return false;
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    return dist < 85;
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

  _collides(px, py, grid) {
    const c = Math.floor(px / TILE_SIZE);
    const r = Math.floor(py / TILE_SIZE);
    return isSolid(grid, c, r);
  }
}
