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
  floor: '#263046',
  floorAlt: '#212a3d',
  wall: '#3c4c6c',
  wallTop: '#526690',
  wallEdge: '#28344c',
  cover: '#44567a',
  coverTop: '#5a709e',
  player: '#38d8ff',
  playerGlow: 'rgba(56,216,255,0.30)',
  guard: '#ff6644',
  guardAlert: '#ff2222',
  guardSuspicious: '#ffaa22',
  guardCalm: '#ff6644',
  visionCone: 'rgba(255,195,85,0.28)',
  visionConeEdge: 'rgba(255,195,85,0.55)',
  visionConeAlert: 'rgba(255,45,45,0.35)',
  cameraCone: 'rgba(0,225,255,0.26)',
  cameraConeEdge: 'rgba(0,225,255,0.55)',
  laserBeam: '#ff2244',
  laserGlow: 'rgba(255,34,68,0.60)',
  smokeParticle: 'rgba(225,240,255,0.40)',
  exit: '#38ef7d',
  exitGlow: 'rgba(56,239,125,0.45)',
  keyItem: '#ffd700',
  shadow: 'rgba(12,16,28,0.38)',
  lightWarm: 'rgba(255,215,130,0.45)',
  lightCool: 'rgba(130,205,255,0.32)',
  lightDanger: 'rgba(255,60,60,0.50)',
  hud: '#ccddee',
  hudDanger: '#ff4444',
  hudCaution: '#ffaa22',
  hudSuccess: '#38ef7d',
  footprint: 'rgba(56,216,255,0.18)',
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
