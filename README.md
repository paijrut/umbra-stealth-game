# UMBRA: Midnight Observatory

An Art-Deco tactical top-down stealth heist engine built with pure HTML5 Canvas and the Web Audio API. Zero dependencies, 100% offline.

## Core Features

- **5 Distinct Heists**:
  1. *The Vaulted Gallery*: Infiltrate the ground-floor exhibit, bypass the entry guards, and retrieve the brass cipher keycard.
  2. *The Clock Tower*: Ascend through the vertical gearworks avoiding sweeping spotlights and tight chokepoints.
  3. *The Iron Archives*: Infiltrate the subterranean archive vaults through high-voltage laser tripwire grids.
  4. *Midnight Observatory*: Evade elite sentries and sweeping surveillance cameras under the stellar dome.
  5. *Rooftop Helipad*: The extraction apex — slip past multiple sentries to reach the escape helicopter.
- **Tactical Gadgets**:
  - `[Q] Smoke Vials`: Detonate a volumetric smoke screen (28 billowing particles) that completely severs guard line-of-sight and camera beams for 5.3 seconds.
  - `[E] Decoy Pebbles`: Toss a pebble across the floor to produce an acoustic noise ripple that lures suspicious sentries away from their posts.
- **Facility Countermeasures**:
  - *Surveillance Cameras*: Wall-mounted cameras with sweeping electric-cyan vision cones and audible intruder alert states.
  - *Laser Tripwires*: Pulsing high-voltage red laser grids that trigger instant alarm if crossed while active.
- **Tactical Route Foresight**: Dotted patrol routes with waypoints allow operatives to learn and exploit guard patrol cycles.
- **Stealth Simulation**:
  - Line-of-sight raycasting against solid obstacles and smoke clouds.
  - Footstep noise simulation: sprint creates noise ripples; hold `Shift` for silent sneaking.
  - Dynamic shadow and lamp exposure calculation.
  - Multi-tiered guard AI: `Patrol` -> `Suspicious` (investigating noise/shadows) -> `Alert` (active pursuit) -> `Search` -> `Return`.

## Controls

| Key | Action |
|---|---|
| `W` `A` `S` `D` / Arrows | Move Operative |
| `Shift` (Hold) | Silent Sneak Stance (Muffles footsteps, halves speed) |
| `Q` | Deploy Smoke Screen Vial (x2) |
| `E` | Toss Decoy Pebble (x3) |
| `R` | Quick Restart Heist |
| `Space` | Start Game / Advance to Next Heist |

## Verification & Screenshots

Run `node serve.ts` to launch local server on `http://localhost:8080`.
The engine includes automated screenshot staging queries (`?shot=1`, `?shot=2`, `?shot=3`, `?shot=4`).
