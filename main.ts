// Hand-in program for the GTA 6 trophy guide (competition gta6-trophy-guide-01).
//
// The entry itself is the plain static site in app/: index.html, style.css, three ES modules under
// app/modules/ and the trophy data in app/data/trophies.json. There is no build step and nothing is fetched at
// run time; open app/index.html from any static server and it works with the network off.
//
// Running this file copies app/ and screenshots/ into the output directory and writes dossier.json there with
// the kit's buildDossier, exactly as the scorer will recompute it. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repo = fileURLToPath(new URL('.', import.meta.url));
const target = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(target, { recursive: true });

// A rebuild starts from a clean slate so an old app/ or screenshots/ cannot leak into the dossier.
const stageApp = join(target, 'app');
const stageShots = join(target, 'screenshots');
cpSync(join(repo, 'app'), stageApp, { recursive: true, force: true });
mkdirSync(stageShots, { recursive: true });
if (existsSync(join(repo, 'screenshots'))) {
  cpSync(join(repo, 'screenshots'), stageShots, { recursive: true, force: true });
}

// Caps copied from the scorer's gate so this program refuses what the gate would refuse: the text budget, four
// screenshots of at most 256 KiB, and the file and byte ceilings on app/.
const dossier = buildDossier(target, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});

writeFileSync(join(target, 'dossier.json'), dossier);
console.log(`wrote ${join(target, 'dossier.json')} (${dossier.length} bytes of dossier text)`);
