// Umbra: The Shadow Heist — make.fun stealth game entry
// Tactical top-down stealth infiltration with dynamic raycasted vision cones,
// dynamic 2D shadow casting & lighting, silent sneaking and low-cover concealment.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Prepare output staging directory
mkdirSync(out, { recursive: true });

// Copy playable game static assets
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

// Copy verified in-game screenshots
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Generate deterministic judge dossier matching make.fun gate requirements
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

