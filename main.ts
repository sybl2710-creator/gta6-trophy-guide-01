// Hand-in script for the "Build the best GTA 6 trophy guide" entry (gta6-trophy-guide-01).
//
// The entry is the static folder app/: one HTML file, one stylesheet, three ES modules and the trophy
// data. No bundler, no package install, no request at run time. This script stages that folder and the
// screenshots next to a dossier.json built by the kit's own buildDossier, which is the same call the
// grader makes.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Without MAKEFUN_OUTPUT_DIR the script writes to /output, the grader's location.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = dirname(fileURLToPath(import.meta.url));
const dest = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Limits mirrored from the scorer's gate. Anything over these would be rejected later anyway, so the
// build fails here instead of shipping something the scorer throws away.
const TEXT_CEILING = 163_840;
const SHOT_CEILING = 262_144;
const SHOT_SLOTS = 4;
const APP_FILES = 993;
const APP_BYTES = 50_331_648;

mkdirSync(dest, { recursive: true });

// Wipe the previous copy so a renamed module cannot survive as a ghost in the output.
for (const folder of ['app', 'screenshots']) {
  rmSync(join(dest, folder), { recursive: true, force: true });
}

cpSync(join(here, 'app'), join(dest, 'app'), { recursive: true });
const shotSource = join(here, 'screenshots');
if (existsSync(shotSource)) {
  cpSync(shotSource, join(dest, 'screenshots'), { recursive: true });
} else {
  mkdirSync(join(dest, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(dest, {
  text_max_bytes: TEXT_CEILING,
  screenshots: { max: SHOT_SLOTS, max_bytes: SHOT_CEILING },
  app_max_files: APP_FILES,
  app_max_bytes: APP_BYTES,
});

const target = join(dest, 'dossier.json');
writeFileSync(target, dossier);
console.log(`dossier written: ${target} (${dossier.length} bytes)`);
