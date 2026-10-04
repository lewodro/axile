import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';

const mode = process.argv[2] === 'dev' ? 'dev' : 'start';
const root = process.cwd();
const prismaCli = resolve(root, 'node_modules/prisma/build/index.js');
const nextCli = resolve(root, 'node_modules/next/dist/bin/next');
const tsxCli = resolve(root, 'node_modules/tsx/dist/cli.mjs');

const migration = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy'], { cwd: root, stdio: 'inherit', env: process.env });
if (migration.status !== 0) process.exit(migration.status ?? 1);

const children: ChildProcess[] = [
  spawn(process.execPath, [nextCli, mode, 'apps/web'], { cwd: root, stdio: 'inherit', env: process.env }),
  spawn(process.execPath, [tsxCli, 'scripts/arena-worker.ts'], { cwd: root, stdio: 'inherit', env: process.env }),
];
let stopping = false;

function stop(signal: NodeJS.Signals, exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  process.exitCode = exitCode;
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
for (const child of children) {
  child.on('error', () => stop('SIGTERM', 1));
  child.on('exit', code => {
    if (!stopping) stop('SIGTERM', code ?? 1);
  });
}
