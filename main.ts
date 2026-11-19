// Neon Cover Studio — hand-in program for the gta6-cover-art-01 entry.
//
// The app itself is the static bundle under app/: plain files a desktop
// browser opens offline, with no build step and no network calls. This
// program's whole job is delivery. It mirrors app/ and screenshots/ from
// beside this file into the output directory (MAKEFUN_OUTPUT_DIR when
// set, /output otherwise), then asks the vendored make.fun library to
// summarise that output into dossier.json, the document the judge reads.
//
// Try the app first with `node serve.ts`, then hand it in with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

/** Copies a directory tree across, returning how many files it carried. */
function copyTree(from: string, to: string): number {
  mkdirSync(to, { recursive: true });
  let carried = 0;
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const src = join(from, entry.name);
    const dst = join(to, entry.name);
    if (entry.isDirectory()) {
      carried += copyTree(src, dst);
    } else if (entry.isFile()) {
      cpSync(src, dst);
      carried += 1;
    }
  }
  return carried;
}

/** Total bytes of every regular file under a directory, recursively. */
function treeBytes(dir: string): number {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) total += treeBytes(path);
    else if (entry.isFile()) total += statSync(path).size;
  }
  return total;
}

const here = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
const appFiles = copyTree(join(here, 'app'), join(outputDir, 'app'));
let shotFiles = 0;
const shotsFrom = join(here, 'screenshots');
if (existsSync(shotsFrom)) {
  shotFiles = copyTree(shotsFrom, join(outputDir, 'screenshots'));
}

// The caps below are the scorer's own, passed through so this program
// refuses anything the scorer would refuse rather than handing it in.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

// Read the dossier straight back: a hand-in that does not parse, or whose
// summary names no screenshots, is worse than no hand-in at all, so fail
// loudly here instead of letting a broken entry travel further.
const written = JSON.parse(readFileSync(join(outputDir, 'dossier.json'), 'utf8')) as {
  images?: unknown[];
};
const imageCount = Array.isArray(written.images) ? written.images.length : 0;
if (imageCount === 0) throw new Error('dossier.json names no screenshots — refusing a blind hand-in');

const appBytes = treeBytes(join(outputDir, 'app'));
console.log(
  `Neon Cover Studio handed in: ${appFiles} app files (${appBytes} bytes), ` +
    `${shotFiles} screenshots (${imageCount} in the dossier), dossier ${dossier.length} bytes -> ${outputDir}`,
);
