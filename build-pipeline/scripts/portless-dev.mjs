#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { isGracefulInterruptExit } from './dev-process-exit.mjs';

const parseEnvInt = (envVarName, defaultValue) => {
	const raw = process.env[envVarName];
	if (raw === undefined) {
		return defaultValue;
	}

	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) ? parsed : defaultValue;
};

const MAX_RETRIES = parseEnvInt('PORTLESS_ROUTE_LOCK_RETRIES', 20);
const BASE_DELAY_MS = parseEnvInt('PORTLESS_ROUTE_LOCK_DELAY_MS', 250);
const MAX_DELAY_MS = parseEnvInt('PORTLESS_ROUTE_LOCK_MAX_DELAY_MS', 2000);
const ROUTE_LOCK_ERROR = 'Failed to acquire route lock';
const modulePath = fileURLToPath(import.meta.url);
const moduleDir = path.dirname(modulePath);
const localPortlessBin = path.resolve(moduleDir, '../../node_modules/.bin/portless');
let activeChild = null;
let terminating = false;
let signalsInstalled = false;

const forwardSignal = (signal) => {
	terminating = true;
	if (activeChild && !activeChild.killed) {
		activeChild.kill(signal);
	}
};

export const installPortlessSignalHandlers = () => {
	if (signalsInstalled) {
		return;
	}

	process.on('SIGINT', () => forwardSignal('SIGINT'));
	process.on('SIGTERM', () => forwardSignal('SIGTERM'));
	try {
		process.on('SIGQUIT', () => forwardSignal('SIGQUIT'));
	} catch {
		// SIGQUIT is not available on some platforms (for example Windows).
	}
	signalsInstalled = true;
};

const containsRouteLockError = (text) => text.includes(ROUTE_LOCK_ERROR);

const runPortlessOnce = (routeName, commandArgs) =>
	new Promise((resolve) => {
		let sawRouteLockError = false;
		let streamTail = '';

		const child = spawn(localPortlessBin, ['--force', routeName, ...commandArgs], {
			stdio: ['inherit', 'pipe', 'pipe'],
			env: process.env,
		});
		activeChild = child;

		const onData = (targetStream) => (chunk) => {
			const text = chunk.toString();
			targetStream.write(text);

			const probe = `${streamTail}${text}`;
			sawRouteLockError ||= containsRouteLockError(probe);
			streamTail = probe.slice(-128);
		};

		child.stdout.on('data', onData(process.stdout));
		child.stderr.on('data', onData(process.stderr));

		child.on('error', (error) => {
			if (error?.code === 'ENOENT') {
				const fallbackChild = spawn('portless', ['--force', routeName, ...commandArgs], {
					stdio: ['inherit', 'pipe', 'pipe'],
					env: process.env,
				});
				activeChild = fallbackChild;
				fallbackChild.stdout.on('data', onData(process.stdout));
				fallbackChild.stderr.on('data', onData(process.stderr));
				fallbackChild.on('error', (fallbackError) => {
					if (activeChild === fallbackChild) {
						activeChild = null;
					}
					console.error('Failed to start "portless" from local node_modules/.bin and PATH.');
					console.error(fallbackError);
					resolve({ code: 1, signal: null, routeLockError: sawRouteLockError });
				});
				fallbackChild.on('close', (code, signal) => {
					if (activeChild === fallbackChild) {
						activeChild = null;
					}
					resolve({ code: code ?? 1, signal, routeLockError: sawRouteLockError });
				});
				return;
			}

			if (activeChild === child) {
				activeChild = null;
			}
			console.error(error);
			resolve({ code: 1, signal: null, routeLockError: sawRouteLockError });
		});

		child.on('close', (code, signal) => {
			if (activeChild === child) {
				activeChild = null;
			}
			resolve({ code: code ?? 1, signal, routeLockError: sawRouteLockError });
		});
	});

export const runPortlessWithRetries = async (routeName, commandArgs) => {
	terminating = false;
	try {
		for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
			const { code, signal, routeLockError } = await runPortlessOnce(routeName, commandArgs);

			if (code === 0) {
				return 0;
			}

			if (terminating) {
				return 0;
			}

			if (isGracefulInterruptExit(signal, code)) {
				return 0;
			}

			if (!routeLockError || attempt === MAX_RETRIES) {
				return code || 1;
			}

			const delayMs = Math.min(BASE_DELAY_MS * attempt, MAX_DELAY_MS);
			console.error(`portless route lock busy for "${routeName}", retrying (${attempt}/${MAX_RETRIES}) in ${delayMs}ms...`);
			await sleep(delayMs);
		}

		return 1;
	} finally {
		terminating = false;
	}
};

const runCli = async () => {
	installPortlessSignalHandlers();

	const [routeName, ...commandArgs] = process.argv.slice(2);
	if (!routeName || commandArgs.length === 0) {
		console.error('Usage: node portless-dev.mjs <route-name> <command> [args...]');
		return 1;
	}

	return runPortlessWithRetries(routeName, commandArgs);
};

const argvPath = process.argv[1] ? path.resolve(process.cwd(), process.argv[1]) : '';
if (argvPath === modulePath) {
	runCli().then((code) => {
		process.exit(code);
	});
}
