#!/usr/bin/env node

/**
 * build-bicep.js
 *
 * Find all .bicep files under iac directories and build them to JSON using
 * `az bicep build -f <file> --outdir <outdir>`, preserving directory structure
 * under `iac/build/`.
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

const iacDirectories = ['iac', 'apps/api/iac', 'apps/ui-community/iac'];
const buildOutputDir = 'iac/build';

function findFiles(dir, ext, out = []) {
  const items = readdirSync(dir);
  for (const item of items) {
    const full = join(dir, item);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.turbo', 'coverage'].includes(item)) {
        findFiles(full, ext, out);
      }
    } else if (item.endsWith(ext)) {
      out.push(full);
    }
  }
  return out;
}

function buildAllBicep() {
  const buildRoot = join(rootDir, buildOutputDir);
  if (existsSync(buildRoot)) rmSync(buildRoot, { recursive: true, force: true });
  mkdirSync(buildRoot, { recursive: true });

  const allBicep = [];
  for (const dir of iacDirectories) {
    const full = join(rootDir, dir);
    if (existsSync(full)) {
      const files = findFiles(full, '.bicep');
      console.log(`Found ${files.length} Bicep file(s) in ${dir}`);
      allBicep.push(...files);
    }
  }
  if (allBicep.length === 0) {
    console.error('No Bicep files found to build.');
    process.exit(1);
  }

  let success = 0, fail = 0;
  for (const bf of allBicep) {
    const rel = relative(rootDir, bf);
    const relDir = dirname(rel);
    const outdir = join(rootDir, buildOutputDir, relDir);
    mkdirSync(outdir, { recursive: true });
    console.log(`Building: ${rel}`);
    try {
      execSync(`az bicep build -f "${bf}" --outdir "${outdir}"`, { cwd: rootDir, stdio: 'inherit', shell: false });
      success++;
    } catch (err) {
      console.error(`Failed to build ${rel}:`, err.message || err);
      fail++;
    }
  }
  console.log(`\nBuilt ${success} JSON(s), failed ${fail}`);
  if (fail > 0) process.exit(1);
}

(function main() {
  buildAllBicep();
})();
