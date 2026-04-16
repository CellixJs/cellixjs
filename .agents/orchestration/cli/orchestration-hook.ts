import process from 'node:process';
import { loadSession } from '../lib/orchestration-loader.ts';
import { blockSession, checkActionAllowed, checkRoleAllowed, createSession, logEvidence, transitionSession } from '../lib/orchestration-runtime.ts';
import type { ActionId, RoleId, StateId } from '../lib/types.ts';

function parseOptions(argv: string[]): { subcommand: string; options: Record<string, string>; positionals: string[] } {
	const normalizedArgs = argv[0] === '--' ? argv.slice(1) : argv;
	const [subcommand = '', ...rest] = normalizedArgs;
	const options: Record<string, string> = {};
	const positionals: string[] = [];

	for (let index = 0; index < rest.length; index += 1) {
		const arg = rest[index];
		if (!arg.startsWith('--')) {
			positionals.push(arg);
			continue;
		}

		options[arg.slice(2)] = rest[index + 1] ?? '';
		index += 1;
	}

	return { subcommand, options, positionals };
}

function parseEvidence(value?: string): string[] {
	if (!value) {
		return [];
	}

	return value
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function printJson(value: unknown, exitCode = 0): never {
	console.log(JSON.stringify(value, null, 2));
	process.exit(exitCode);
}

function printInvocationError(error: unknown): never {
	const message = error instanceof Error ? error.message : 'Invalid orchestration hook invocation.';
	printJson(
		{
			allowed: false,
			code: 'invalid-invocation',
			message,
			guidance: [
				'Provide a supported subcommand and all required --key value options for that subcommand.',
				'Use the orchestration hook manifest and `pnpm run orchestration:hook -- <subcommand> ...` as the source of truth for valid invocations.',
			],
		},
		1,
	);
}

function requireOption(options: Record<string, string>, key: string): string {
	const value = options[key];
	if (!value) {
		throw new Error(`Missing required option --${key}`);
	}
	return value;
}

function resolveRoleOption(options: Record<string, string>): RoleId {
	return requireOption(options, 'role') as RoleId;
}

function resolveTransitionState(options: Record<string, string>, positionals: string[]): StateId {
	return (options.to || positionals[0] || '') as StateId;
}

function resolveTransitionEventId(repoRoot: string, sessionId: string, toState: StateId): string {
	const session = loadSession(repoRoot, sessionId);
	if (!session) {
		return `${sessionId}-${toState}`;
	}

	return `${sessionId}-${session.state}-${toState}`;
}

function resolveTransitionEvidence(repoRoot: string, sessionId: string, toState: StateId, options: Record<string, string>): string[] {
	if (options.evidence) {
		return parseEvidence(options.evidence);
	}

	const session = loadSession(repoRoot, sessionId);
	if (!session) {
		return [];
	}

	const evidenceDefaults: Partial<Record<StateId, string[]>> = {
		planning: ['task-lane-selected', 'session-created'],
		'plan-complete': ['bounded-plan', 'phase-owner-recorded'],
		implementing: ['implementation-owner-recorded'],
		reviewing: ['change-summary', 'validation-evidence'],
		revising: ['revision-plan-updated'],
		blocked: ['blocker-recorded'],
	};

	return evidenceDefaults[toState] ?? [];
}

function main(): void {
	try {
		const { subcommand, options, positionals } = parseOptions(process.argv.slice(2));
		const repoRoot = options.repo || process.cwd();
		if (options.owner && !options.role) {
			options.role = options.owner;
		}

		switch (subcommand) {
			case 'session-init': {
				const session = createSession(repoRoot, {
					sessionId: requireOption(options, 'session'),
					lane: requireOption(options, 'lane') as ReturnType<typeof createSession>['lane'],
					role: resolveRoleOption(options),
					artifactMode: options['artifact-mode'] as ReturnType<typeof createSession>['artifactMode'] | undefined,
				});
				printJson({ allowed: true, session });
			}

			case 'transition': {
				const sessionId = requireOption(options, 'session');
				const toState = resolveTransitionState(options, positionals);
				if (!toState) {
					throw new Error('Missing required option --to');
				}

				const { result, session } = transitionSession(repoRoot, {
					sessionId,
					role: resolveRoleOption(options),
					toState,
					evidence: resolveTransitionEvidence(repoRoot, sessionId, toState, options),
					eventId: options.event || resolveTransitionEventId(repoRoot, sessionId, toState),
					note: options.note,
				});
				printJson({ result, session }, result.allowed ? 0 : 1);
			}

			case 'agent-check': {
				const result = checkRoleAllowed(repoRoot, requireOption(options, 'session'), resolveRoleOption(options));
				printJson(result, result.allowed ? 0 : 1);
			}

			case 'tool-check': {
				const result = checkActionAllowed(repoRoot, requireOption(options, 'session'), resolveRoleOption(options), requireOption(options, 'action') as ActionId);
				printJson(result, result.allowed ? 0 : 1);
			}

			case 'evidence-log': {
				const session = logEvidence(repoRoot, requireOption(options, 'session'), resolveRoleOption(options), requireOption(options, 'type'), requireOption(options, 'summary'));
				printJson({ allowed: true, session });
			}

			case 'blocked': {
				const sessionId = requireOption(options, 'session');
				const { result, session } = blockSession(repoRoot, {
					sessionId,
					role: resolveRoleOption(options),
					eventId: options.event || `${sessionId}-blocked`,
					note: requireOption(options, 'note'),
				});
				printJson({ result, session }, result.allowed ? 0 : 1);
			}

			default:
				throw new Error(`Unknown subcommand "${subcommand}"`);
		}
	} catch (error) {
		printInvocationError(error);
	}
}

main();
