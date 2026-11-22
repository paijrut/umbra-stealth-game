// constants.js — Shared game constants and configuration
export const TILE_SIZE = 32;
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;
export const COLS = CANVAS_WIDTH / TILE_SIZE;  // 30
export const ROWS = CANVAS_HEIGHT / TILE_SIZE; // 20

export const PLAYER_SPEED = 2.2;
export const PLAYER_RADIUS = 10;
export const GUARD_SPEED = 1.35;
export const GUARD_RADIUS = 11;
export const GUARD_VIEW_RANGE = 185;
export const GUARD_VIEW_ANGLE = Math.PI / 3;  // 60 degrees
export const GUARD_ALERT_RANGE = 60;

export const DETECTION_RATE = 0.85;
export const DEESCALATION_RATE = 0.32;
export const ALERT_THRESHOLD = 1.0;
export const SUSPICIOUS_THRESHOLD = 0.38;

export const COLORS = {
  floor: '#141424',
  floorAlt: '#10101e',
  wall: '#26263a',
  wallTop: '#383852',
  wallEdge: '#1a1a2c',
  cover: '#252540',
  coverTop: '#35355a',
  player: '#44ccff',
  playerGlow: 'rgba(68,204,255,0.18)',
  guard: '#ff6644',
  guardAlert: '#ff2222',
  guardSuspicious: '#ffaa22',
  guardCalm: '#ff6644',
  visionCone: 'rgba(255,180,80,0.09)',
  visionConeEdge: 'rgba(255,180,80,0.18)',
  visionConeAlert: 'rgba(255,40,40,0.15)',
  cameraCone: 'rgba(0,220,255,0.11)',
  cameraConeEdge: 'rgba(0,220,255,0.22)',
  laserBeam: '#ff2244',
  laserGlow: 'rgba(255,34,68,0.45)',
  smokeParticle: 'rgba(200,215,235,0.3)',
  exit: '#44ff88',
  exitGlow: 'rgba(68,255,136,0.32)',
  keyItem: '#ffdd44',
  shadow: 'rgba(0,0,0,0.85)',
  lightWarm: 'rgba(255,200,120,0.6)',
  lightCool: 'rgba(120,180,255,0.3)',
  lightDanger: 'rgba(255,60,60,0.4)',
  hud: '#ccddee',
  hudDanger: '#ff4444',
  hudCaution: '#ffaa22',
  hudSuccess: '#44ff88',
  footprint: 'rgba(68,204,255,0.08)',
};

export const TILE = {
  EMPTY: 0,
  WALL: 1,
  COVER_LOW: 2,
  COVER_TALL: 3,
  EXIT: 4,
  SPAWN: 5,
  LIGHT_WARM: 6,
  LIGHT_COOL: 7,
  VENT: 8,
  KEY_ITEM: 9,
  DOOR_LOCKED: 10,
  CHECKPOINT: 11,
  DECORATION: 12,
};

export const GAME_STATE = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
  WIN: 'win',
  CAUGHT: 'caught',
  TRANSITION: 'transition',
};
