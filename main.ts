// Cover Art Studio III — the entry program (Node 22, standard library only).
// It hands the app in: copy this repository's app/ and screenshots/ into the
// output directory and write /output/dossier.json with the kit's buildDossier
// from vendor/makefun-app.ts. Outside the grader, MAKEFUN_OUTPUT_DIR stands
// in for /output, e.g. `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The gate's own caps, from its reference/gate.json: the text cap shapes the
// dossier's bytes; the rest only refuse an entry the scorer would refuse
// (more than 4 screenshots, one over 256 KiB, app/ past 993 entries or
// 48 MiB, or a path over 1000 bytes — app/ shares /output's 1000-entry cap
// with screenshots/ and dossier.json, so the margin matters).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
