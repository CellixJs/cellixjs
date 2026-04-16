import process from 'node:process';
import { getSessionArtifactStatus, loadSession } from '../lib/orchestration-loader.ts';

function parseArgs(argv: string[]): { repoRoot: string; sessionId?: string; json: boolean } {
	const normalizedArgs = argv[0] === '--' ? argv.slice(1) : argv;
	let repoRoot = process.cwd();
	let sessionId: string | undefined;
	let json = false;

	for (let index = 0; index < normalizedArgs.length; index += 1) {
		const arg = normalizedArgs[index];
		if (arg === '--repo') {
			repoRoot = normalizedArgs[index + 1] ?? repoRoot;
			index += 1;
			continue;
		}

		if (arg === '--session') {
			sessionId = normalizedArgs[index + 1];
			index += 1;
			continue;
		}

		if (arg === '--json') {
			json = true;
		}
	}

	return { repoRoot, sessionId, json };
}

function main(): void {
	const args = parseArgs(process.argv.slice(2));
	if (!args.sessionId) {
		console.log(
			JSON.stringify(
				{
					allowed: false,
					code: 'invalid-invocation',
					message: 'Missing required option --session',
					guidance: ['Provide a session id to inspect artifact status.'],
				},
				null,
				2,
			),
		);
		process.exit(1);
	}

	const session = loadSession(args.repoRoot, args.sessionId);
	if (!session) {
		console.log(
			JSON.stringify(
				{
					allowed: false,
					code: 'missing-session',
					message: `Session "${args.sessionId}" does not exist.`,
					guidance: ['Initialize the session first with orchestration:bootstrap or orchestration:hook session-init.'],
				},
				null,
				2,
			),
		);
		process.exit(1);
	}

	const artifactStatus = getSessionArtifactStatus(args.repoRoot, args.sessionId);
	const report = {
		sessionId: session.sessionId,
		lane: session.lane,
		state: session.state,
		artifactMode: session.artifactMode,
		changedPaths: session.changedPaths,
		artifactStatus,
	};

	if (args.json) {
		console.log(JSON.stringify(report, null, 2));
		return;
	}

	console.log(`Session: ${report.sessionId}`);
	console.log(`Lane: ${report.lane}`);
	console.log(`State: ${report.state}`);
	console.log(`Artifact mode: ${report.artifactMode}`);
	console.log(`Changed paths: ${report.changedPaths.join(', ') || 'none recorded'}`);
	console.log('Artifacts:');
	console.log(`- intake.md: ${artifactStatus.intake.path} (${artifactStatus.intake.exists ? 'present' : 'missing'})`);
	console.log(`- plan.md: ${artifactStatus.plan.path} (${artifactStatus.plan.exists ? 'present' : 'missing'})`);
	console.log(`- final-summary.md: ${artifactStatus.finalSummary.path} (${artifactStatus.finalSummary.exists ? 'present' : 'missing'})`);
}

main();
