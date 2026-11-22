// lighting.js — Dynamic 2D shadows, lighting and ambient darkness
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './constants.js';

export class LightingEngine {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d');
    this._flickerOffset = 0;
  }

  render(mainCtx, lights, guards, player) {
    this._flickerOffset += 0.05;
    const ctx = this.ctx;

    // 1. Fill darkness mask (noir ambient shadow)
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(8, 8, 16, 0.90)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Punch out holes for static lights
    ctx.globalCompositeOperation = 'destination-out';

    for (const light of lights) {
      const flicker = light.flicker ? Math.sin(this._flickerOffset + light.x) * 4 : 0;
      const radius = light.radius + flicker;

      const grad = ctx.createRadialGradient(light.x, light.y, 10, light.x, light.y, radius);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.65)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(light.x, light.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Small subtle vision glow around player
    const playerGlowRadius = player.inCover ? 24 : 42;
    const playerGrad = ctx.createRadialGradient(player.x, player.y, 4, player.x, player.y, playerGlowRadius);
    playerGrad.addColorStop(0, 'rgba(0,0,0,0.6)');
    playerGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, playerGlowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 4. Guard flashlights punch out light too
    for (const guard of guards) {
      if (guard.visionPolygon.length > 2) {
        ctx.beginPath();
        ctx.moveTo(guard.visionPolygon[0].x, guard.visionPolygon[0].y);
        for (let i = 1; i < guard.visionPolygon.length; i++) {
          ctx.lineTo(guard.visionPolygon[i].x, guard.visionPolygon[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fill();
      }
    }

    // 5. Composite darkness overlay back onto main canvas
    mainCtx.save();
    mainCtx.globalCompositeOperation = 'source-over';
    mainCtx.drawImage(this.canvas, 0, 0);

    // 6. Warm/cool color tint overlays for atmospheric lighting
    mainCtx.globalCompositeOperation = 'screen';
    for (const light of lights) {
      const radius = light.radius * 0.85;
      const tint = mainCtx.createRadialGradient(light.x, light.y, 0, light.x, light.y, radius);
      if (light.color === 'warm') {
        tint.addColorStop(0, 'rgba(255, 190, 100, 0.22)');
        tint.addColorStop(1, 'rgba(255, 190, 100, 0)');
      } else {
        tint.addColorStop(0, 'rgba(120, 180, 255, 0.18)');
        tint.addColorStop(1, 'rgba(120, 180, 255, 0)');
      }
      mainCtx.fillStyle = tint;
      mainCtx.beginPath();
      mainCtx.arc(light.x, light.y, radius, 0, Math.PI * 2);
      mainCtx.fill();
    }
    mainCtx.restore();
  }
}
