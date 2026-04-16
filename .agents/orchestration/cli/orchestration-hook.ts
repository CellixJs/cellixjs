import process from 'node:process';
import { blockSession, checkActionAllowed, checkRoleAllowed, createSession, logEvidence, transitionSession } from '../lib/orchestration-runtime.ts';
import type { ActionId, RoleId, StateId } from '../lib/types.ts';

function parseOptions(argv: string[]): { subcommand: string; options: Record<string, string> } {
	const normalizedArgs = argv[0] === '--' ? argv.slice(1) : argv;
	const [subcommand = '', ...rest] = normalizedArgs;
	const options: Record<string, string> = {};

	for (let index = 0; index < rest.length; index += 1) {
		const arg = rest[index];
		if (!arg.startsWith('--')) {
			continue;
		}

		options[arg.slice(2)] = rest[index + 1] ?? '';
		index += 1;
	}

	return { subcommand, options };
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

function main(): void {
	try {
		const { subcommand, options } = parseOptions(process.argv.slice(2));
		const repoRoot = options.repo || process.cwd();

		switch (subcommand) {
			case 'session-init': {
				const session = createSession(repoRoot, {
					sessionId: requireOption(options, 'session'),
					lane: requireOption(options, 'lane') as ReturnType<typeof createSession>['lane'],
					role: requireOption(options, 'role') as RoleId,
					artifactMode: options['artifact-mode'] as ReturnType<typeof createSession>['artifactMode'] | undefined,
				});
				printJson({ allowed: true, session });
			}

			case 'transition': {
				const { result, session } = transitionSession(repoRoot, {
					sessionId: requireOption(options, 'session'),
					role: requireOption(options, 'role') as RoleId,
					toState: requireOption(options, 'to') as StateId,
					evidence: parseEvidence(options.evidence),
					eventId: requireOption(options, 'event'),
					note: options.note,
				});
				printJson({ result, session }, result.allowed ? 0 : 1);
			}

			case 'agent-check': {
				const result = checkRoleAllowed(repoRoot, requireOption(options, 'session'), requireOption(options, 'role') as RoleId);
				printJson(result, result.allowed ? 0 : 1);
			}

			case 'tool-check': {
				const result = checkActionAllowed(repoRoot, requireOption(options, 'session'), requireOption(options, 'role') as RoleId, requireOption(options, 'action') as ActionId);
				printJson(result, result.allowed ? 0 : 1);
			}

			case 'evidence-log': {
				const session = logEvidence(repoRoot, requireOption(options, 'session'), requireOption(options, 'role') as RoleId, requireOption(options, 'type'), requireOption(options, 'summary'));
				printJson({ allowed: true, session });
			}

			case 'blocked': {
				const { result, session } = blockSession(repoRoot, {
					sessionId: requireOption(options, 'session'),
					role: requireOption(options, 'role') as RoleId,
					eventId: requireOption(options, 'event'),
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
