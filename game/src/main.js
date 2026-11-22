// main.js — Main game loop, state management, screenshot staging
// Umbra: Midnight Observatory — Tactical stealth heist engine
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_STATE, COLORS } from './constants.js';
import { InputManager } from './input.js';
import { GameWorld } from './world.js';
import { GameRenderer } from './renderer.js';

const canvas = document.getElementById('gameCanvas');
const input = new InputManager();
const world = new GameWorld();
const renderer = new GameRenderer(canvas);

let state = GAME_STATE.TITLE;

// URL parameters for automated screenshot staging (?shot=1|2|3|4)
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

function stageScreenshot(shotName) {
  if (shotName === '1' || shotName === 'start' || shotName === 'cover') {
    // Shot 1: Midnight Observatory — Cover Infiltration, Camera Cones, Lasers & Pebble Distraction
    world.loadLevel(3);
    world.player.x = 240;
    world.player.y = 144;
    world.player.inCover = true;
    world.player.isSneaking = true;
    world.player.angle = 0;

    // Distraction pebble landed with acoustic noise ripple
    world.gadgets.pebbleCount = 2;
    world.gadgets.noiseRipples.push({
      x: 350,
      y: 240,
      radius: 48,
      maxRadius: 180,
      alpha: 0.75,
    });

    // Guard investigating pebble ripple
    world.guards[0].x = 360;
    world.guards[0].y = 180;
    world.guards[0].angle = Math.PI / 2;
    world.guards[0].detection = 0.28;
    world.guards[0].state = 'suspicious';
    world.guards[0]._computeVisionPolygon(world.level.grid, world.gadgets);

    // Active security camera and laser
    if (world.security.cameras[0]) {
      world.security.cameras[0].currentAngle = Math.PI / 2.2;
      world.security.cameras[0]._computeVisionPolygon(world.level.grid, world.gadgets);
    }
    if (world.security.lasers[0]) {
      world.security.lasers[0].isActive = true;
    }

    world.maxDetection = 0.28;
    state = GAME_STATE.PLAYING;
  } else if (shotName === '2' || shotName === 'play' || shotName === 'shadow') {
    // Shot 2: The Clock Tower — Smoke Screen Disruption & Shadow Navigation
    world.loadLevel(1);
    world.player.x = 240;
    world.player.y = 270;
    world.player.inCover = false;
    world.player.isSneaking = true;
    world.player.angle = Math.PI / 2;
    world.player.footprints = [
      { x: 180, y: 150, angle: Math.PI / 4, alpha: 0.25, isSneak: true },
      { x: 200, y: 200, angle: Math.PI / 3, alpha: 0.45, isSneak: true },
      { x: 220, y: 240, angle: Math.PI / 2.5, alpha: 0.65, isSneak: true },
    ];

    // Deploy billowing smoke screen in central corridor
    world.gadgets.smokeCount = 1;
    world.gadgets.deploySmoke(340, 210);

    world.guards[0].x = 360;
    world.guards[0].y = 180;
    world.guards[0].angle = Math.PI / 2;
    world.guards[0].state = 'suspicious';
    world.guards[0].detection = 0.35;
    world.guards[0]._computeVisionPolygon(world.level.grid, world.gadgets);

    world.guards[1].x = 220;
    world.guards[1].y = 440;
    world.guards[1].angle = -Math.PI / 2;
    world.guards[1]._computeVisionPolygon(world.level.grid, world.gadgets);

    state = GAME_STATE.PLAYING;
  } else if (shotName === '3' || shotName === 'alert' || shotName === 'tension') {
    // Shot 3: The Iron Archives — High-Voltage Laser Grid & Alert Evasion
    world.loadLevel(2);
    world.player.x = 410;
    world.player.y = 220;
    world.player.inCover = true;
    world.player.isSneaking = true;

    // Laser tripwire active right near corridor
    if (world.security.lasers[0]) {
      world.security.lasers[0].isActive = true;
    }

    world.guards[1].x = 480;
    world.guards[1].y = 180;
    world.guards[1].angle = Math.PI * 0.9;
    world.guards[1].detection = 0.88;
    world.guards[1].state = 'alert';
    world.guards[1]._computeVisionPolygon(world.level.grid, world.gadgets);

    world.maxDetection = 0.88;
    state = GAME_STATE.PLAYING;
  } else if (shotName === '4' || shotName === 'end' || shotName === 'extract') {
    // Shot 4: Rooftop Helipad — Vault Objective Secured & Extraction Apex
    world.loadLevel(4);
    world.player.x = 830;
    world.player.y = 550;
    world.player.hasKey = true;
    world.exitUnlocked = true;
    world.player.angle = 0;

    world.guards[4].x = 650;
    world.guards[4].y = 460;
    world.guards[4].angle = Math.PI / 4;
    world.guards[4]._computeVisionPolygon(world.level.grid, world.gadgets);

    if (world.security.cameras[2]) {
      world.security.cameras[2].currentAngle = Math.PI / 6;
      world.security.cameras[2]._computeVisionPolygon(world.level.grid, world.gadgets);
    }

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
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('UMBRA: MIDNIGHT OBSERVATORY', CANVAS_WIDTH / 2, 175);

  ctx.fillStyle = '#8899aa';
  ctx.font = '15px monospace';
  ctx.fillText('Art-Deco Tactical Stealth Heist Engine', CANVAS_WIDTH / 2, 215);

  // Features list
  ctx.fillStyle = '#ccddee';
  ctx.font = '13px sans-serif';
  const features = [
    '• 5 Distinct Heists: Gallery, Clock Tower, Iron Archives, Observatory & Helipad',
    '• Tactical Gadgets: Smoke Vials ([Q]) & Acoustic Pebble Decoys ([E])',
    '• Facility Countermeasures: Sweeping Security Cameras & High-Voltage Laser Tripwires',
    '• Visible Patrol Route Chevrons & Raycasted 2D Shadow Occlusion'
  ];
  features.forEach((feat, idx) => {
    ctx.fillText(feat, CANVAS_WIDTH / 2, 275 + idx * 26);
  });

  // Prompt to Start (pulsing)
  const pulseAlpha = (Math.sin(Date.now() * 0.005) + 1) * 0.4 + 0.2;
  ctx.fillStyle = `rgba(68, 255, 136, ${pulseAlpha})`;
  ctx.font = 'bold 17px monospace';
  ctx.fillText('[ PRESS SPACE OR CLICK TO INFILTRATE ]', CANVAS_WIDTH / 2, 425);

  // Controls Guide
  ctx.fillStyle = '#556677';
  ctx.font = '12px sans-serif';
  ctx.fillText('WASD: Move  |  SHIFT: Silent Sneak  |  Q: Smoke  |  E: Pebble Decoy  |  R: Reset', CANVAS_WIDTH / 2, 510);
}

function renderVictoryScreen() {
  const ctx = renderer.ctx;
  ctx.fillStyle = 'rgba(8, 24, 16, 0.90)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#44ff88';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SECTOR SECURED: EXTRACTION COMPLETE', CANVAS_WIDTH / 2, 230);

  ctx.fillStyle = '#aaddcc';
  ctx.font = '15px monospace';
  ctx.fillText('You evaded the security grid unseen and secured the objective.', CANVAS_WIDTH / 2, 280);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('[ PRESS SPACE TO PROCEED TO NEXT HEIST ]', CANVAS_WIDTH / 2, 370);
}

function renderCaughtScreen() {
  const ctx = renderer.ctx;
  ctx.fillStyle = 'rgba(28, 8, 8, 0.92)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#ff3333';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('INFILTRATION COMPROMISED', CANVAS_WIDTH / 2, 230);

  ctx.fillStyle = '#ffaaaa';
  ctx.font = '15px monospace';
  ctx.fillText(world.caughtReason || 'You were detected by security forces.', CANVAS_WIDTH / 2, 280);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('[ PRESS R OR SPACE TO RETRY HEIST ]', CANVAS_WIDTH / 2, 370);
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
