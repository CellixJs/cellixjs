#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const argv = process.argv.slice(2).filter(a => a !== '--');

function printUsage() {
  console.log(`Usage: node install-config.js [--force] [--source <path>]\n\nOptions:\n  --force, -f    Overwrite existing config without creating a backup\n  --source, -s   Path to source mcp-config.json (defaults to ./.copilot/mcp-config.json in the repo)\n  --help, -h     Show this help message`);
}

let force = false;
let source = null;

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--force' || a === '-f') {
    force = true;
  } else if (a === '--source' || a === '-s') {
    const val = argv[i + 1];
    if (!val || val.startsWith('-')) {
      console.error('Error: --source requires a path argument');
      printUsage();
      process.exit(1);
    }
    source = val;
    i++;
  } else if (a === '--help' || a === '-h') {
    printUsage();
    process.exit(0);
  } else {
    console.error('Unknown argument:', a);
    printUsage();
    process.exit(1);
  }
}

if (!source) {
  source = path.resolve(process.cwd(), '.copilot', 'mcp-config.json');
} else {
  source = path.resolve(process.cwd(), source);
}

async function exists(p) {
  try { await fs.access(p); return true } catch { return false }
}

async function main(){
  try {
    if (!await exists(source)){
      console.error(`Source config not found at ${source}`);
      process.exit(2);
    }

    const destDir = path.join(os.homedir(), '.copilot');
    const destFile = path.join(destDir, 'mcp-config.json');

    await fs.mkdir(destDir, { recursive: true });

    if (await exists(destFile)){
      if (force){
        console.log('Overwriting existing config due to --force');
      } else {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `${destFile}.${timestamp}.bak`;
        await fs.copyFile(destFile, backupPath);
        console.log(`Existing config backed up to ${backupPath}`);
      }
    }

    await fs.copyFile(source, destFile);
    console.log(`Installed MCP config from ${source} to ${destFile}`);
    process.exit(0);
  } catch (err){
    console.error('Failed to install MCP config:', err);
    process.exit(1);
  }
}

main();
