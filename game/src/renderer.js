// renderer.js — World rendering, vision cones, particles, HUD
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

    // 3. Render footprints
    this._renderFootprints(world.player.footprints);

    // 4. Render guard vision cones
    this._renderVisionCones(world.guards);

    // 5. Render characters (player and guards)
    this._renderGuards(world.guards);
    this._renderPlayer(world.player);

    // 6. Dynamic lighting and shadows
    world.lighting.render(ctx, world.level.lights, world.guards, world.player);

    // 7. Heads-Up Display (HUD)
    this._renderHUD(world);
  }

  _renderMap(grid, exitUnlocked) {
    const ctx = this.ctx;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = grid[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        // Subtle floor checkered pattern
        if ((r + c) % 2 === 0) {
          ctx.fillStyle = COLORS.floorAlt;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }

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
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
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

          ctx.strokeStyle = exitUnlocked ? '#44ff88' : '#ff4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 10, TILE_SIZE - 4, 12);

          // Padlock indicator
          ctx.fillStyle = exitUnlocked ? '#44ff88' : '#ffdd44';
          ctx.beginPath();
          ctx.arc(x + 16, y + 16, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === TILE.KEY_ITEM) {
          // Golden cipher key / briefcase
          const bounce = Math.sin(this.pulse * 2) * 2;
          const kx = x + 16;
          const ky = y + 16 + bounce;

          // Aura glow
          const aura = ctx.createRadialGradient(kx, ky, 2, kx, ky, 18);
          aura.addColorStop(0, 'rgba(255, 220, 68, 0.4)');
          aura.addColorStop(1, 'rgba(255, 220, 68, 0)');
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(kx, ky, 18, 0, Math.PI * 2);
          ctx.fill();

          // Key briefcase icon
          ctx.fillStyle = COLORS.keyItem;
          ctx.fillRect(kx - 7, ky - 5, 14, 10);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.strokeRect(kx - 3, ky - 7, 6, 3);
        } else if (tile === TILE.EXIT) {
          // Extraction zone
          const glow = (Math.sin(this.pulse * 3) + 1) * 0.15 + 0.15;
          ctx.fillStyle = `rgba(68, 255, 136, ${glow})`;
          ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          ctx.strokeStyle = COLORS.exit;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
          ctx.setLineDash([]);

          ctx.fillStyle = COLORS.exit;
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('EXIT', x + 16, y + 19);
        }
      }
    }
  }

  _renderFootprints(footprints) {
    const ctx = this.ctx;
    for (const fp of footprints) {
      ctx.save();
      ctx.translate(fp.x, fp.y);
      ctx.rotate(fp.angle);

      ctx.fillStyle = `rgba(68, 204, 255, ${fp.alpha * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(-2, -3, 3, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sound ring ripple
      if (!fp.isSneak && fp.alpha > 0.4) {
        ctx.strokeStyle = `rgba(255, 100, 100, ${fp.alpha * 0.25})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, (1 - fp.alpha) * 35, 0, Math.PI * 2);
        ctx.stroke();
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
        coneGrad = ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, 180);
        coneGrad.addColorStop(0, 'rgba(255, 40, 40, 0.35)');
        coneGrad.addColorStop(1, 'rgba(255, 40, 40, 0.05)');
      } else if (guard.state === GUARD_STATE.SUSPICIOUS) {
        coneGrad = ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, 180);
        coneGrad.addColorStop(0, 'rgba(255, 180, 40, 0.25)');
        coneGrad.addColorStop(1, 'rgba(255, 180, 40, 0.04)');
      } else {
        coneGrad = ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, 180);
        coneGrad.addColorStop(0, 'rgba(255, 200, 100, 0.16)');
        coneGrad.addColorStop(1, 'rgba(255, 200, 100, 0.02)');
      }

      ctx.fillStyle = coneGrad;
      ctx.fill();

      // Cone perimeter line
      ctx.strokeStyle = guard.state === GUARD_STATE.ALERT
        ? 'rgba(255, 60, 60, 0.4)'
        : guard.state === GUARD_STATE.SUSPICIOUS
          ? 'rgba(255, 180, 40, 0.3)'
          : 'rgba(255, 200, 100, 0.15)';
      ctx.lineWidth = 1.5;
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
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 3, guard.radius, guard.radius * 0.7, 0, 0, Math.PI * 2);
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

      // Shoulders & flashlight barrel
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
      ctx.strokeStyle = 'rgba(68, 204, 255, 0.4)';
      ctx.lineWidth = 1.5;
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

    // Player body (stylish operative)
    ctx.rotate(player.angle);
    ctx.fillStyle = player.inCover ? '#226688' : COLORS.player;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Trench coat shoulders
    ctx.fillStyle = '#112233';
    ctx.beginPath();
    ctx.arc(-2, 0, player.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Directional visor
    ctx.fillStyle = '#88eeff';
    ctx.beginPath();
    ctx.arc(4, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _renderHUD(world) {
    const ctx = this.ctx;
    const player = world.player;

    // Top status banner (dark glassmorphism)
    ctx.fillStyle = 'rgba(10, 14, 24, 0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 44);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(0, 44);
    ctx.lineTo(CANVAS_WIDTH, 44);
    ctx.stroke();

    // Level Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SECTOR ${world.currentLevelIndex + 1}: ${world.level.name.toUpperCase()}`, 20, 22);

    ctx.fillStyle = '#8899aa';
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

    ctx.fillStyle = world.exitUnlocked || player.hasKey ? '#44ff88' : '#ffdd44';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(objText, CANVAS_WIDTH / 2, 27);

    // Detection Meter (Right side)
    const meterWidth = 140;
    const meterHeight = 12;
    const mx = CANVAS_WIDTH - meterWidth - 24;
    const my = 16;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(mx, my, meterWidth, meterHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(mx, my, meterWidth, meterHeight);

    // Meter Fill
    const maxDet = world.maxDetection;
    if (maxDet > 0) {
      const fillW = meterWidth * Math.min(1, maxDet);
      ctx.fillStyle = maxDet > 0.8 ? '#ff3333' : maxDet > 0.4 ? '#ffaa22' : '#44ccff';
      ctx.fillRect(mx + 1, my + 1, fillW - 2, meterHeight - 2);
    }

    ctx.fillStyle = maxDet > 0.8 ? '#ff4444' : '#ccddee';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(maxDet > 0.8 ? 'ALARM!' : maxDet > 0.4 ? 'SUSPICIOUS' : 'STEALTH', mx - 8, 26);

    // Bottom Controls Bar
    ctx.fillStyle = 'rgba(10, 14, 24, 0.75)';
    ctx.fillRect(0, CANVAS_HEIGHT - 26, CANVAS_WIDTH, 26);

    ctx.fillStyle = '#778899';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WASD / Arrows: Infiltrate  |  SHIFT: Silent Sneak  |  Crater/Boxes: Cover  |  R: Quick Restart', 20, CANVAS_HEIGHT - 9);

    // Stealth Stance Indicator
    const stanceText = player.inCover
      ? 'STANCE: CONCEALED IN COVER'
      : player.isSneaking
        ? 'STANCE: SNEAKING (SILENT)'
        : 'STANCE: NORMAL (FOOTSTEPS HEARD)';
    ctx.fillStyle = player.inCover ? '#44ff88' : player.isSneaking ? '#44ccff' : '#ffaa44';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(stanceText, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 9);
  }
}
