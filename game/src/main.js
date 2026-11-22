// main.js — Main game loop, state management, screenshot staging
// Umbra: The Shadow Heist — Enhanced tactical stealth engine
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_STATE, COLORS } from './constants.js';
import { InputManager } from './input.js';
import { GameWorld } from './world.js';
import { GameRenderer } from './renderer.js';

const canvas = document.getElementById('gameCanvas');
const input = new InputManager();
const world = new GameWorld();
const renderer = new GameRenderer(canvas);

let state = GAME_STATE.TITLE;
let transitionTimer = 0;

// URL parameters for automated screenshot staging (?shot=1|2|3|4)
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

function stageScreenshot(shotName) {
  if (shotName === '1' || shotName === 'start' || shotName === 'cover') {
    // Shot 1: The Vaulted Gallery — Operative in cover near key, guard patrolling
    world.loadLevel(0);
    world.player.x = 240;
    world.player.y = 144;
    world.player.inCover = true;
    world.player.isSneaking = true;
    world.player.angle = 0;
    world.guards[0].x = 420;
    world.guards[0].y = 160;
    world.guards[0].angle = Math.PI; // Looking left towards operative
    world.guards[0].detection = 0.25;
    world.guards[0].state = 'patrol';
    world.guards[0]._computeVisionPolygon(world.level.grid);
    state = GAME_STATE.PLAYING;
  } else if (shotName === '2' || shotName === 'play' || shotName === 'shadow') {
    // Shot 2: The Clock Tower — Stealth navigation through dynamic shadows and lamps
    world.loadLevel(1);
    world.player.x = 240;
    world.player.y = 270;
    world.player.inCover = false;
    world.player.isSneaking = true;
    world.player.angle = Math.PI / 2;
    world.player.footprints = [
      { x: 180, y: 150, angle: Math.PI / 4, alpha: 0.2, isSneak: true },
      { x: 200, y: 200, angle: Math.PI / 3, alpha: 0.4, isSneak: true },
      { x: 220, y: 240, angle: Math.PI / 2.5, alpha: 0.6, isSneak: true }
    ];
    world.guards[0].x = 350;
    world.guards[0].y = 200;
    world.guards[0].angle = Math.PI / 2;
    world.guards[0]._computeVisionPolygon(world.level.grid);
    world.guards[1].x = 220;
    world.guards[1].y = 440;
    world.guards[1].angle = -Math.PI / 2;
    world.guards[1]._computeVisionPolygon(world.level.grid);
    state = GAME_STATE.PLAYING;
  } else if (shotName === '3' || shotName === 'alert' || shotName === 'tension') {
    // Shot 3: The Iron Archives — Near-miss alert evasion!
    world.loadLevel(2);
    world.player.x = 410;
    world.player.y = 220;
    world.player.inCover = true;
    world.player.isSneaking = true;
    world.guards[1].x = 480;
    world.guards[1].y = 180;
    world.guards[1].angle = Math.PI * 0.9;
    world.guards[1].detection = 0.85;
    world.guards[1].state = 'alert';
    world.guards[1]._computeVisionPolygon(world.level.grid);
    world.maxDetection = 0.85;
    state = GAME_STATE.PLAYING;
  } else if (shotName === '4' || shotName === 'end' || shotName === 'extract') {
    // Shot 4: Sector 1 Rooftop Extraction Unlocked
    world.loadLevel(0);
    world.player.x = 830;
    world.player.y = 560;
    world.player.hasKey = true;
    world.exitUnlocked = true;
    world.player.angle = 0;
    world.guards[2].x = 680;
    world.guards[2].y = 420;
    world.guards[2].angle = Math.PI / 4;
    world.guards[2]._computeVisionPolygon(world.level.grid);
    state = GAME_STATE.PLAYING;
  }

  // Double frame render to guarantee canvas paint completion
  let frames = 0;
  function renderShot() {
    renderer.render(world);
    frames++;
    if (frames < 2) {
      requestAnimationFrame(renderShot);
    } else {
      window.__shotReady = true;
    }
  }
  requestAnimationFrame(renderShot);
}

function renderTitleScreen() {
  const ctx = renderer.ctx;

  // Background ambiance
  ctx.fillStyle = '#080812';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Decorative grid lines
  ctx.strokeStyle = 'rgba(68, 204, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  // Title Logo
  ctx.fillStyle = '#44ccff';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('UMBRA: THE SHADOW HEIST', CANVAS_WIDTH / 2, 190);

  ctx.fillStyle = '#8899aa';
  ctx.font = '16px monospace';
  ctx.fillText('A Tactical Top-Down Stealth Infiltration Experience', CANVAS_WIDTH / 2, 230);

  // Features list
  ctx.fillStyle = '#ccddee';
  ctx.font = '13px sans-serif';
  const features = [
    '• Dynamic Vision Cones & Raycasted Wall Occlusion',
    '• Light Exposure Mechanics: Hide in Deep Shadows',
    '• Low Cover Concealment & Silent Footstep Stances',
    '• Multi-Sector Infiltration: Gallery, Clock Tower, Iron Archives'
  ];
  features.forEach((feat, idx) => {
    ctx.fillText(feat, CANVAS_WIDTH / 2, 290 + idx * 26);
  });

  // Prompt to Start (pulsing)
  const pulseAlpha = (Math.sin(Date.now() * 0.005) + 1) * 0.4 + 0.2;
  ctx.fillStyle = `rgba(68, 255, 136, ${pulseAlpha})`;
  ctx.font = 'bold 18px monospace';
  ctx.fillText('[ PRESS SPACE OR CLICK TO INFILTRATE ]', CANVAS_WIDTH / 2, 440);

  // Controls Guide
  ctx.fillStyle = '#556677';
  ctx.font = '12px sans-serif';
  ctx.fillText('WASD / Arrows to Move  |  SHIFT to Sneak Silently  |  R to Reset Level', CANVAS_WIDTH / 2, 520);
}

function renderVictoryScreen() {
  const ctx = renderer.ctx;
  ctx.fillStyle = 'rgba(8, 24, 16, 0.88)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#44ff88';
  ctx.font = 'bold 38px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SECTOR SECURED: EXTRACTION COMPLETE', CANVAS_WIDTH / 2, 240);

  ctx.fillStyle = '#aaddcc';
  ctx.font = '16px monospace';
  ctx.fillText(`You evaded the guards unseen and reached the rooftop exit.`, CANVAS_WIDTH / 2, 290);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('[ PRESS SPACE TO PROCEED TO NEXT SECTOR ]', CANVAS_WIDTH / 2, 380);
}

function renderCaughtScreen() {
  const ctx = renderer.ctx;
  ctx.fillStyle = 'rgba(28, 8, 8, 0.90)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#ff3333';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('INFILTRATION COMPROMISED', CANVAS_WIDTH / 2, 240);

  ctx.fillStyle = '#ffaaaa';
  ctx.font = '16px monospace';
  ctx.fillText(world.caughtReason || 'You were detected by security forces.', CANVAS_WIDTH / 2, 290);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('[ PRESS R OR SPACE TO RETRY SECTOR ]', CANVAS_WIDTH / 2, 380);
}

function gameLoop() {
  input.update();

  if (state === GAME_STATE.TITLE) {
    renderTitleScreen();
    if (input.wasPressed('Space') || input.mouseDown) {
      state = GAME_STATE.PLAYING;
      world.loadLevel(0);
    }
  } else if (state === GAME_STATE.PLAYING) {
    if (input.wasPressed('KeyR')) {
      world.restartLevel();
    }

    world.update(input);
    renderer.render(world);

    if (world.isVictory) {
      state = GAME_STATE.WIN;
    } else if (world.isCaught) {
      state = GAME_STATE.CAUGHT;
    }
  } else if (state === GAME_STATE.WIN) {
    renderVictoryScreen();
    if (input.wasPressed('Space') || input.mouseDown) {
      world.nextLevel();
      state = GAME_STATE.PLAYING;
    }
  } else if (state === GAME_STATE.CAUGHT) {
    renderCaughtScreen();
    if (input.wasPressed('Space') || input.wasPressed('KeyR') || input.mouseDown) {
      world.restartLevel();
      state = GAME_STATE.PLAYING;
    }
  }

  requestAnimationFrame(gameLoop);
}

// Start game or stage screenshot
if (shot) {
  stageScreenshot(shot);
} else {
  gameLoop();
}
