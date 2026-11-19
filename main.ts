// Neon Cover Studio — entry program for the gta6-cover-art-01 bounty.
// It hands the built app in: copies app/ and screenshots/ from this
// repository into the output directory and writes dossier.json there,
// using the kit's buildDossier from vendor/makefun-app.ts. Standard
// library only, no network, deterministic output.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function handIn() {
  mkdirSync(outDir, { recursive: true });
  for (const folder of ['app', 'screenshots']) {
    cpSync(join(repoRoot, folder), join(outDir, folder), { recursive: true });
  }
  const dossier = buildDossier(outDir, dossierCaps);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`Neon Cover Studio handed in to ${outDir}`);
}

handIn();
