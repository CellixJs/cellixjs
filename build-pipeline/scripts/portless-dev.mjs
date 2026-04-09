#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const MAX_RETRIES = Number.parseInt(process.env.PORTLESS_ROUTE_LOCK_RETRIES ?? '20', 10);
const BASE_DELAY_MS = Number.parseInt(process.env.PORTLESS_ROUTE_LOCK_DELAY_MS ?? '250', 10);
const MAX_DELAY_MS = Number.parseInt(process.env.PORTLESS_ROUTE_LOCK_MAX_DELAY_MS ?? '2000', 10);
const ROUTE_LOCK_ERROR = 'Failed to acquire route lock';
const INTERRUPT_EXIT_CODES = new Set([130, 143]);

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
	process.on('SIGQUIT', () => forwardSignal('SIGQUIT'));
	signalsInstalled = true;
};

const containsRouteLockError = (text) => text.includes(ROUTE_LOCK_ERROR);

const runPortlessOnce = (routeName, commandArgs) =>
	new Promise((resolve) => {
		let sawRouteLockError = false;
		let streamTail = '';

		const child = spawn('portless', ['--force', routeName, ...commandArgs], {
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
			console.error(error);
			resolve({ code: 1, signal: null, routeLockError: sawRouteLockError });
		});

		child.on('close', (code, signal) => {
			resolve({ code: code ?? 1, signal, routeLockError: sawRouteLockError });
		});
	});

export const runPortlessWithRetries = async (routeName, commandArgs) => {
	for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt += 1) {
		const { code, signal, routeLockError } = await runPortlessOnce(routeName, commandArgs);

		if (code === 0) {
			return 0;
		}

		if (terminating) {
			return 0;
		}

		if (signal === 'SIGINT' || signal === 'SIGTERM' || signal === 'SIGQUIT' || INTERRUPT_EXIT_CODES.has(code)) {
			return 0;
		}

		if (!routeLockError || attempt > MAX_RETRIES) {
			return code || 1;
		}

		const delayMs = Math.min(BASE_DELAY_MS * attempt, MAX_DELAY_MS);
		console.error(`portless route lock busy for "${routeName}", retrying (${attempt}/${MAX_RETRIES}) in ${delayMs}ms...`);
		await sleep(delayMs);
	}

	return 1;
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

const modulePath = fileURLToPath(import.meta.url);
const argvPath = process.argv[1] ? path.resolve(process.cwd(), process.argv[1]) : '';
if (argvPath === modulePath) {
	runCli().then((code) => {
		process.exit(code);
	});
}
