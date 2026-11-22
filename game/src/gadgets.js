// gadgets.js — Smoke vials, pebble decoys, and tactical distraction systems
import { sound } from './sound.js';
import { GUARD_STATE } from './guards.js';

export class GadgetManager {
  constructor() {
    this.smokeCount = 2;
    this.pebbleCount = 3;
    this.smokeClouds = [];  // active smoke clouds
    this.pebbles = [];      // flying pebbles
    this.noiseRipples = []; // expanding acoustic ripples
  }

  reset() {
    this.smokeCount = 2;
    this.pebbleCount = 3;
    this.smokeClouds = [];
    this.pebbles = [];
    this.noiseRipples = [];
  }

  deploySmoke(x, y) {
    if (this.smokeCount <= 0) return false;
    this.smokeCount--;
    sound.playSmoke();

    // Spawn 24 billowing smoke puff particles
    const particles = [];
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.9;
      const baseR = 20 + Math.random() * 18;
      particles.push({
        x: x + Math.cos(angle) * (Math.random() * 24),
        y: y + Math.sin(angle) * (Math.random() * 24),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: baseR,
        alpha: 0.55 + Math.random() * 0.35,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
      });
    }

    this.smokeClouds.push({
      x,
      y,
      radius: 72,
      life: 320, // ~5.3 seconds at 60fps
      maxLife: 320,
      particles,
    });

    return true;
  }

  throwPebble(startX, startY, targetX, targetY, guards) {
    if (this.pebbleCount <= 0) return false;
    this.pebbleCount--;

    this.pebbles.push({
      startX,
      startY,
      targetX,
      targetY,
      x: startX,
      y: startY,
      progress: 0,
      duration: 36, // ~0.6 seconds in flight
      guardsRef: guards,
    });

    return true;
  }

  update(guards) {
    // 1. Update flying pebbles
    for (let i = this.pebbles.length - 1; i >= 0; i--) {
      const p = this.pebbles[i];
      p.progress += 1 / p.duration;
      if (p.progress >= 1) {
        // Pebble landed on floor
        sound.playPebble();
        this.noiseRipples.push({
          x: p.targetX,
          y: p.targetY,
          radius: 12,
          maxRadius: 190,
          alpha: 0.85,
        });

        // Distract nearby guards
        for (const guard of guards) {
          const dist = Math.hypot(guard.x - p.targetX, guard.y - p.targetY);
          if (dist <= 210 && guard.state !== GUARD_STATE.ALERT) {
            guard.state = GUARD_STATE.SUSPICIOUS;
            guard.investigatePos = { x: p.targetX, y: p.targetY };
            guard.targetAngle = Math.atan2(p.targetY - guard.y, p.targetX - guard.x);
            guard.detection = Math.max(guard.detection, 0.55);
            guard.searchTimer = 200;
          }
        }
        this.pebbles.splice(i, 1);
      } else {
        // Ballistic parabolic trajectory
        const t = p.progress;
        p.x = p.startX + (p.targetX - p.startX) * t;
        const heightArc = Math.sin(t * Math.PI) * 44;
        p.y = p.startY + (p.targetY - p.startY) * t - heightArc;
      }
    }

    // 2. Update acoustic noise ripples
    for (let i = this.noiseRipples.length - 1; i >= 0; i--) {
      const r = this.noiseRipples[i];
      r.radius += (r.maxRadius - r.radius) * 0.08 + 1.4;
      r.alpha -= 0.016;
      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        this.noiseRipples.splice(i, 1);
      }
    }

    // 3. Update smoke plumes
    for (let i = this.smokeClouds.length - 1; i >= 0; i--) {
      const cloud = this.smokeClouds[i];
      cloud.life--;
      for (const pt of cloud.particles) {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.rotation += pt.rotSpeed;
        pt.radius += 0.07;
      }
      if (cloud.life <= 0) {
        this.smokeClouds.splice(i, 1);
      }
    }
  }

  isPointInSmoke(x, y) {
    for (const cloud of this.smokeClouds) {
      const dist = Math.hypot(cloud.x - x, cloud.y - y);
      if (dist <= cloud.radius) return true;
    }
    return false;
  }

  isLineBlockedBySmoke(x1, y1, x2, y2) {
    for (const cloud of this.smokeClouds) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;
      const t = Math.max(0, Math.min(1, ((cloud.x - x1) * dx + (cloud.y - y1) * dy) / lenSq));
      const projX = x1 + t * dx;
      const projY = y1 + t * dy;
      const dist = Math.hypot(cloud.x - projX, cloud.y - projY);
      if (dist <= cloud.radius * 0.88) return true;
    }
    return false;
  }
}
