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
  floor: '#1c1c32',
  floorAlt: '#18182c',
  wall: '#343450',
  wallTop: '#4a4a70',
  wallEdge: '#202034',
  cover: '#383858',
  coverTop: '#50507a',
  player: '#38d8ff',
  playerGlow: 'rgba(56,216,255,0.25)',
  guard: '#ff6644',
  guardAlert: '#ff2222',
  guardSuspicious: '#ffaa22',
  guardCalm: '#ff6644',
  visionCone: 'rgba(255,185,75,0.22)',
  visionConeEdge: 'rgba(255,185,75,0.40)',
  visionConeAlert: 'rgba(255,45,45,0.28)',
  cameraCone: 'rgba(0,225,255,0.20)',
  cameraConeEdge: 'rgba(0,225,255,0.45)',
  laserBeam: '#ff2244',
  laserGlow: 'rgba(255,34,68,0.55)',
  smokeParticle: 'rgba(220,235,250,0.35)',
  exit: '#38ef7d',
  exitGlow: 'rgba(56,239,125,0.40)',
  keyItem: '#ffd700',
  shadow: 'rgba(10,12,22,0.62)',
  lightWarm: 'rgba(255,205,120,0.40)',
  lightCool: 'rgba(120,190,255,0.28)',
  lightDanger: 'rgba(255,60,60,0.45)',
  hud: '#ccddee',
  hudDanger: '#ff4444',
  hudCaution: '#ffaa22',
  hudSuccess: '#38ef7d',
  footprint: 'rgba(56,216,255,0.12)',
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
