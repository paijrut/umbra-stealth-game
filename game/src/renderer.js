// renderer.js — World rendering, vision cones, security cameras, lasers, smoke, HUD
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, COLS, ROWS,
  COLORS, TILE
} from './constants.js';
import { GUARD_STATE } from './guards.js';

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx = canvas.getContext('2d');
    this.pulse = 0;
  }

  render(world) {
    this.pulse += 0.04;
    const ctx = this.ctx;

    // 1. Clear background
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Render floor and tiles
    this._renderMap(world.level.grid, world.exitUnlocked);

    // 3. Render tactical patrol routes with directional arrows
    this._renderPatrolRoutes(world.guards);

    // 4. Render footprints
    this._renderFootprints(world.player.footprints);

    // 5. Render security cameras and vision cones
    this._renderSecurity(world.security);
    this._renderVisionCones(world.guards);

    // 6. Render gadgets (smoke clouds, pebbles, acoustic ripples)
    this._renderGadgets(world.gadgets);

    // 7. Render characters (guards and player)
    this._renderGuards(world.guards);
    this._renderPlayer(world.player);

    // 8. Dynamic lighting and shadows
    world.lighting.render(ctx, world.level.lights, world.guards, world.player);

    // 9. Render laser tripwires on top of lighting for brilliant glow
    this._renderLasers(world.security);

    // 10. Heads-Up Display (HUD)
    this._renderHUD(world);
  }

  _renderMap(grid, exitUnlocked) {
    const ctx = this.ctx;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = grid[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        // Elegant floor tile pattern
        if ((r + c) % 2 === 0) {
          ctx.fillStyle = COLORS.floorAlt;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

        if (tile === TILE.WALL) {
          // Solid wall block with 3D depth bevel
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          ctx.fillStyle = COLORS.wallTop;
          ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 6);

          ctx.fillStyle = COLORS.wallEdge;
          ctx.fillRect(x, y + TILE_SIZE - 4, TILE_SIZE, 4);
        } else if (tile === TILE.COVER_LOW) {
          // Low cover (wooden crate / barricade)
          ctx.fillStyle = COLORS.cover;
          ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);

          ctx.fillStyle = COLORS.coverTop;
          ctx.fillRect(x + 6, y + 6, TILE_SIZE - 12, TILE_SIZE - 12);

          // Crate cross hatch
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x + 6, y + 6);
          ctx.lineTo(x + TILE_SIZE - 6, y + TILE_SIZE - 6);
          ctx.moveTo(x + TILE_SIZE - 6, y + 6);
          ctx.lineTo(x + 6, y + TILE_SIZE - 6);
          ctx.stroke();
        } else if (tile === TILE.DOOR_LOCKED) {
          // Locked security gate
          ctx.fillStyle = exitUnlocked ? '#225533' : '#662222';
          ctx.fillRect(x, y + 10, TILE_SIZE, 12);

          ctx.strokeStyle = exitUnlocked ? '#38ef7d' : '#ff4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 10, TILE_SIZE - 4, 12);

          // Padlock indicator
          ctx.fillStyle = exitUnlocked ? '#38ef7d' : '#ffd700';
          ctx.beginPath();
          ctx.arc(x + 16, y + 16, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === TILE.KEY_ITEM) {
          // Golden cipher key / briefcase
          const bounce = Math.sin(this.pulse * 2.5) * 2.5;
          const kx = x + 16;
          const ky = y + 16 + bounce;

          // Aura glow
          const aura = ctx.createRadialGradient(kx, ky, 2, kx, ky, 22);
          aura.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
          aura.addColorStop(0.5, 'rgba(255, 180, 0, 0.25)');
          aura.addColorStop(1, 'rgba(255, 215, 0, 0)');
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(kx, ky, 22, 0, Math.PI * 2);
          ctx.fill();

          // Key briefcase icon
          ctx.fillStyle = COLORS.keyItem;
          ctx.fillRect(kx - 8, ky - 6, 16, 12);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(kx - 4, ky - 8, 8, 3);
        } else if (tile === TILE.EXIT) {
          // Extraction zone
          const glow = (Math.sin(this.pulse * 3) + 1) * 0.2 + 0.2;
          ctx.fillStyle = `rgba(56, 239, 125, ${glow})`;
          ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          ctx.strokeStyle = COLORS.exit;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
          ctx.setLineDash([]);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('EXIT', x + 16, y + 19);
        }
      }
    }
  }

  _renderPatrolRoutes(guards) {
    const ctx = this.ctx;
    ctx.save();
    for (const guard of guards) {
      if (!guard.patrol || guard.patrol.length < 2) continue;

      ctx.strokeStyle = 'rgba(255, 140, 80, 0.28)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < guard.patrol.length; i++) {
        const wp = guard.patrol[i];
        if (i === 0) ctx.moveTo(wp.x, wp.y);
        else ctx.lineTo(wp.x, wp.y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // Waypoint nodes
      for (let i = 0; i < guard.patrol.length; i++) {
        const wp = guard.patrol[i];
        ctx.fillStyle = 'rgba(255, 160, 90, 0.45)';
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  _renderFootprints(footprints) {
    const ctx = this.ctx;
    for (const fp of footprints) {
      ctx.save();
      ctx.translate(fp.x, fp.y);
      ctx.rotate(fp.angle);

      ctx.fillStyle = `rgba(56, 216, 255, ${fp.alpha * 0.45})`;
      ctx.beginPath();
      ctx.ellipse(-2, -3, 3.5, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sound ring ripple
      if (!fp.isSneak && fp.alpha > 0.4) {
        ctx.strokeStyle = `rgba(255, 110, 110, ${fp.alpha * 0.35})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, (1 - fp.alpha) * 36, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  _renderSecurity(security) {
    if (!security || !security.cameras) return;
    const ctx = this.ctx;

    for (const cam of security.cameras) {
      if (cam.visionPolygon.length < 3) continue;

      ctx.save();
      // Sweeping vision cone
      const coneGrad = ctx.createRadialGradient(cam.x, cam.y, 8, cam.x, cam.y, cam.range);
      if (cam.detection > 0) {
        coneGrad.addColorStop(0, 'rgba(255, 50, 50, 0.42)');
        coneGrad.addColorStop(1, 'rgba(255, 50, 50, 0.05)');
      } else {
        coneGrad.addColorStop(0, 'rgba(0, 225, 255, 0.28)');
        coneGrad.addColorStop(1, 'rgba(0, 225, 255, 0.03)');
      }

      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      cam.visionPolygon.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = cam.detection > 0 ? 'rgba(255, 50, 50, 0.55)' : 'rgba(0, 225, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Camera base fixture
      ctx.fillStyle = '#202030';
      ctx.beginPath();
      ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = cam.detection > 0 ? '#ff3344' : '#00e5ff';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Lens emitter pointing along currentAngle
      ctx.strokeStyle = cam.detection > 0 ? '#ff7777' : '#ffffff';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(cam.x, cam.y);
      ctx.lineTo(cam.x + Math.cos(cam.currentAngle) * 12, cam.y + Math.sin(cam.currentAngle) * 12);
      ctx.stroke();

      ctx.restore();
    }
  }

  _renderLasers(security) {
    if (!security || !security.lasers) return;
    const ctx = this.ctx;

    for (const laser of security.lasers) {
      if (!laser.isActive) continue;

      ctx.save();
      // Outer neon red halo
      ctx.strokeStyle = 'rgba(255, 34, 68, 0.55)';
      ctx.lineWidth = 7 + Math.sin(this.pulse * 5) * 1.8;
      ctx.beginPath();
      ctx.moveTo(laser.x1, laser.y1);
      ctx.lineTo(laser.x2, laser.y2);
      ctx.stroke();

      // Bright core laser beam
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(laser.x1, laser.y1);
      ctx.lineTo(laser.x2, laser.y2);
      ctx.stroke();

      // Terminal emitter nodes
      [{ x: laser.x1, y: laser.y1 }, { x: laser.x2, y: laser.y2 }].forEach(node => {
        ctx.fillStyle = '#ff2244';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }
  }

  _renderGadgets(gadgets) {
    if (!gadgets) return;
    const ctx = this.ctx;

    // 1. Acoustic noise expansion ripples
    for (const r of gadgets.noiseRipples) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 225, 110, ${r.alpha})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 200, 80, ${r.alpha * 0.45})`;
      ctx.beginPath();
      ctx.arc(r.x, r.y, Math.max(0, r.radius - 12), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Flying pebble projectile
    for (const p of gadgets.pebbles) {
      ctx.save();
      ctx.fillStyle = '#ffe0b2';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Shadow on floor
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      const floorY = p.startY + (p.targetY - p.startY) * p.progress;
      ctx.beginPath();
      ctx.arc(p.x, floorY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Volumetric billowing smoke plumes
    for (const cloud of gadgets.smokeClouds) {
      ctx.save();
      for (const pt of cloud.particles) {
        const grad = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, pt.radius);
        grad.addColorStop(0, `rgba(230, 240, 255, ${pt.alpha * 0.42})`);
        grad.addColorStop(0.6, `rgba(180, 195, 215, ${pt.alpha * 0.25})`);
        grad.addColorStop(1, 'rgba(120, 130, 150, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _renderVisionCones(guards) {
    const ctx = this.ctx;

    for (const guard of guards) {
      if (guard.visionPolygon.length < 3) continue;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(guard.visionPolygon[0].x, guard.visionPolygon[0].y);
      for (let i = 1; i < guard.visionPolygon.length; i++) {
        ctx.lineTo(guard.visionPolygon[i].x, guard.visionPolygon[i].y);
      }
      ctx.closePath();

      // Color varies by alertness
      let coneGrad;
      if (guard.state === GUARD_STATE.ALERT) {
        coneGrad = ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, 185);
        coneGrad.addColorStop(0, 'rgba(255, 45, 45, 0.42)');
        coneGrad.addColorStop(1, 'rgba(255, 45, 45, 0.06)');
      } else if (guard.state === GUARD_STATE.SUSPICIOUS) {
        coneGrad = ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, 185);
        coneGrad.addColorStop(0, 'rgba(255, 185, 45, 0.32)');
        coneGrad.addColorStop(1, 'rgba(255, 185, 45, 0.05)');
      } else {
        coneGrad = ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, 185);
        coneGrad.addColorStop(0, 'rgba(255, 195, 80, 0.22)');
        coneGrad.addColorStop(1, 'rgba(255, 195, 80, 0.03)');
      }

      ctx.fillStyle = coneGrad;
      ctx.fill();

      // Cone perimeter line
      ctx.strokeStyle = guard.state === GUARD_STATE.ALERT
        ? 'rgba(255, 60, 60, 0.55)'
        : guard.state === GUARD_STATE.SUSPICIOUS
          ? 'rgba(255, 185, 45, 0.45)'
          : 'rgba(255, 195, 80, 0.25)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.restore();
    }
  }

  _renderGuards(guards) {
    const ctx = this.ctx;

    for (const guard of guards) {
      ctx.save();
      ctx.translate(guard.x, guard.y);

      // Body drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 3.5, guard.radius, guard.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Guard torso & head
      ctx.rotate(guard.angle);
      ctx.fillStyle = guard.state === GUARD_STATE.ALERT
        ? COLORS.guardAlert
        : guard.state === GUARD_STATE.SUSPICIOUS
          ? COLORS.guardSuspicious
          : COLORS.guardCalm;

      ctx.beginPath();
      ctx.arc(0, 0, guard.radius, 0, Math.PI * 2);
      ctx.fill();

      // Flashlight fixture
      ctx.fillStyle = '#222';
      ctx.fillRect(guard.radius - 2, -3, 8, 6);

      // Facing visor
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(4, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Alertness Badge above head
      if (guard.state === GUARD_STATE.ALERT) {
        ctx.fillStyle = '#ff2222';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', guard.x, guard.y - 18);
      } else if (guard.state === GUARD_STATE.SUSPICIOUS) {
        ctx.fillStyle = '#ffaa22';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', guard.x, guard.y - 18);
      }
    }
  }

  _renderPlayer(player) {
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(player.x, player.y);

    // Cover shield indicator
    if (player.inCover) {
      ctx.strokeStyle = 'rgba(56, 216, 255, 0.55)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 4, player.radius, player.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Player body (operative)
    ctx.rotate(player.angle);
    ctx.fillStyle = player.inCover ? '#227799' : COLORS.player;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Trench coat shoulders
    ctx.fillStyle = '#112233';
    ctx.beginPath();
    ctx.arc(-2, 0, player.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Directional visor
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _renderHUD(world) {
    const ctx = this.ctx;
    const player = world.player;

    // Top status banner (dark glassmorphism)
    ctx.fillStyle = 'rgba(10, 14, 26, 0.92)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 44);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.beginPath();
    ctx.moveTo(0, 44);
    ctx.lineTo(CANVAS_WIDTH, 44);
    ctx.stroke();

    // Level Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`HEIST 0${world.currentLevelIndex + 1}: ${world.level.name.toUpperCase()}`, 20, 22);

    ctx.fillStyle = '#99aabb';
    ctx.font = '11px sans-serif';
    ctx.fillText(world.level.subtitle, 20, 37);

    // Objective
    let objText = world.exitUnlocked
      ? 'OBJECTIVE: Extract through the rooftop door'
      : world.level.exitRequiresKey
        ? player.hasKey
          ? 'OBJECTIVE: Key acquired! Reach extraction zone'
          : 'OBJECTIVE: Retrieve cipher key from vault'
        : 'OBJECTIVE: Reach the exit unseen';

    ctx.fillStyle = world.exitUnlocked || player.hasKey ? '#38ef7d' : '#ffd700';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(objText, CANVAS_WIDTH / 2, 27);

    // Detection Meter (Right side)
    const meterWidth = 140;
    const meterHeight = 12;
    const mx = CANVAS_WIDTH - meterWidth - 24;
    const my = 16;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(mx, my, meterWidth, meterHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.strokeRect(mx, my, meterWidth, meterHeight);

    // Meter Fill
    const maxDet = world.maxDetection;
    if (maxDet > 0) {
      const fillW = meterWidth * Math.min(1, maxDet);
      ctx.fillStyle = maxDet > 0.8 ? '#ff3333' : maxDet > 0.4 ? '#ffaa22' : '#38d8ff';
      ctx.fillRect(mx + 1, my + 1, fillW - 2, meterHeight - 2);
    }

    ctx.fillStyle = maxDet > 0.8 ? '#ff4444' : '#ccddee';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right';
    const pct = Math.round(maxDet * 100);
    ctx.fillText(maxDet > 0.8 ? `ALARM! ${pct}%` : maxDet > 0.4 ? `ALERT ${pct}%` : `STEALTH ${pct}%`, mx - 8, 26);

    // Bottom Controls & Gadgets Bar
    ctx.fillStyle = 'rgba(10, 14, 26, 0.92)';
    ctx.fillRect(0, CANVAS_HEIGHT - 28, CANVAS_WIDTH, 28);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - 28);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 28);
    ctx.stroke();

    // Gadget Slots (Left)
    const smokeCount = world.gadgets?.smokeCount ?? 2;
    const pebbleCount = world.gadgets?.pebbleCount ?? 3;

    ctx.fillStyle = smokeCount > 0 ? '#38d8ff' : '#667788';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`[Q] SMOKE VIAL: ${smokeCount}/2`, 20, CANVAS_HEIGHT - 10);

    ctx.fillStyle = pebbleCount > 0 ? '#ffd700' : '#667788';
    ctx.fillText(`[E] DECOY PEBBLE: ${pebbleCount}/3`, 170, CANVAS_HEIGHT - 10);

    ctx.fillStyle = '#8899aa';
    ctx.font = '11px sans-serif';
    ctx.fillText('WASD: Move  |  SHIFT: Sneak  |  R: Restart', 350, CANVAS_HEIGHT - 10);

    // Stealth Stance Indicator (Right)
    const stanceText = player.inCover
      ? 'STANCE: CONCEALED IN COVER'
      : player.isSneaking
        ? 'STANCE: SNEAKING (SILENT)'
        : 'STANCE: NORMAL (AUDIBLE)';
    ctx.fillStyle = player.inCover ? '#38ef7d' : player.isSneaking ? '#38d8ff' : '#ffaa44';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(stanceText, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 10);
  }
}
