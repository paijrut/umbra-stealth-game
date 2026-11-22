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

    // 1. Fill darkness mask with balanced noir ambient shadows
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = COLORS.shadow;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Punch out holes for static lights
    ctx.globalCompositeOperation = 'destination-out';

    for (const light of lights) {
      const flicker = light.flicker ? Math.sin(this._flickerOffset + light.x) * 4 : 0;
      const radius = light.radius + flicker;

      const grad = ctx.createRadialGradient(light.x, light.y, 10, light.x, light.y, radius);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.65, 'rgba(0,0,0,0.80)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(light.x, light.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Subtle operative presence glow
    const playerGlowRadius = player.inCover ? 32 : 54;
    const playerGrad = ctx.createRadialGradient(player.x, player.y, 4, player.x, player.y, playerGlowRadius);
    playerGrad.addColorStop(0, 'rgba(0,0,0,0.75)');
    playerGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, playerGlowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 4. Guard flashlights illuminate dark zones
    for (const guard of guards) {
      if (guard.visionPolygon.length > 2) {
        ctx.beginPath();
        ctx.moveTo(guard.visionPolygon[0].x, guard.visionPolygon[0].y);
        for (let i = 1; i < guard.visionPolygon.length; i++) {
          ctx.lineTo(guard.visionPolygon[i].x, guard.visionPolygon[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fill();
      }
    }

    // 5. Composite darkness overlay back onto main canvas
    mainCtx.save();
    mainCtx.globalCompositeOperation = 'source-over';
    mainCtx.drawImage(this.canvas, 0, 0);

    // 6. Radiant color tint overlays for warm vintage chandeliers & lamps
    mainCtx.globalCompositeOperation = 'screen';
    for (const light of lights) {
      const radius = light.radius * 0.95;
      const tint = mainCtx.createRadialGradient(light.x, light.y, 0, light.x, light.y, radius);
      if (light.color === 'warm') {
        tint.addColorStop(0, 'rgba(255, 215, 130, 0.42)');
        tint.addColorStop(0.5, 'rgba(255, 180, 85, 0.22)');
        tint.addColorStop(1, 'rgba(255, 150, 60, 0)');
      } else {
        tint.addColorStop(0, 'rgba(130, 205, 255, 0.32)');
        tint.addColorStop(0.5, 'rgba(110, 180, 255, 0.16)');
        tint.addColorStop(1, 'rgba(80, 140, 255, 0)');
      }
      mainCtx.fillStyle = tint;
      mainCtx.beginPath();
      mainCtx.arc(light.x, light.y, radius, 0, Math.PI * 2);
      mainCtx.fill();
    }
    mainCtx.restore();
  }
}
