import process from 'node:process';
import { getSessionArtifactStatus, getSessionArtifactsDirectoryPath, getSessionCheckpointStatus, getSessionPhaseDirectoryPath, loadSession } from '../lib/orchestration-loader.ts';

function resolveNextStep(state: string, artifactStatus: ReturnType<typeof getSessionArtifactStatus>, checkpointStatus: ReturnType<typeof getSessionCheckpointStatus>): string {
	if (state === 'planning' && !artifactStatus.plan.exists) {
		return 'Write plan.md, then run `pnpm run orchestration:hook -- handoff implementing --session <session-id> --role senior-orchestrator`.';
	}

	if ((state === 'planning' || state === 'plan-complete') && artifactStatus.plan.exists) {
		return 'Run `pnpm run orchestration:hook -- handoff implementing --session <session-id> --role senior-orchestrator` to enter implementation.';
	}

	if ((state === 'implementing' || state === 'revising') && !checkpointStatus.implementationResult.exists) {
		return 'Write implementation/result.md, then run `pnpm run orchestration:hook -- handoff reviewing --session <session-id> --role senior-orchestrator`.';
	}

	if ((state === 'implementing' || state === 'revising') && checkpointStatus.implementationResult.exists) {
		return 'Run `pnpm run orchestration:hook -- handoff reviewing --session <session-id> --role senior-orchestrator` to enter review.';
	}

	if (state === 'reviewing' && !checkpointStatus.reviewDecision.exists) {
		return 'Write review/decision.md before resolving the review outcome.';
	}

	if (state === 'reviewing' && checkpointStatus.reviewDecision.exists && !artifactStatus.finalSummary.exists) {
		return 'Write final-summary.md for approval, or run `pnpm run orchestration:hook -- complete revising --session <session-id> --role senior-orchestrator` if review found issues.';
	}

	if (state === 'reviewing' && checkpointStatus.reviewDecision.exists && artifactStatus.finalSummary.exists) {
		return 'Run `pnpm run orchestration:hook -- complete done --session <session-id> --role senior-orchestrator` when the review is approved.';
	}

	return 'Session is initialized. Bootstrap or continue the active phase.';
}

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
	const checkpointStatus = getSessionCheckpointStatus(args.repoRoot, args.sessionId);
	const report = {
		sessionId: session.sessionId,
		lane: session.lane,
		state: session.state,
		artifactMode: session.artifactMode,
		changedPaths: session.changedPaths,
		sessionDirectory: getSessionArtifactsDirectoryPath(args.repoRoot, args.sessionId),
		phaseDirectories: {
			implementation: getSessionPhaseDirectoryPath(args.repoRoot, args.sessionId, 'implementation'),
			review: getSessionPhaseDirectoryPath(args.repoRoot, args.sessionId, 'review'),
		},
		artifactStatus,
		checkpointStatus,
		nextStep: resolveNextStep(session.state, artifactStatus, checkpointStatus),
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
	console.log(`Session directory: ${report.sessionDirectory}`);
	console.log(`Implementation directory: ${report.phaseDirectories.implementation}`);
	console.log(`Review directory: ${report.phaseDirectories.review}`);
	console.log('Artifacts:');
	console.log(`- intake.md: ${artifactStatus.intake.path} (${artifactStatus.intake.exists ? 'present' : 'missing'})`);
	console.log(`- plan.md: ${artifactStatus.plan.path} (${artifactStatus.plan.exists ? 'present' : 'missing'})`);
	console.log(`- final-summary.md: ${artifactStatus.finalSummary.path} (${artifactStatus.finalSummary.exists ? 'present' : 'missing'})`);
	console.log('Checkpoints:');
	console.log(`- implementation/result.md: ${checkpointStatus.implementationResult.path} (${checkpointStatus.implementationResult.exists ? 'present' : 'missing'})`);
	console.log(`- review/decision.md: ${checkpointStatus.reviewDecision.path} (${checkpointStatus.reviewDecision.exists ? 'present' : 'missing'})`);
	console.log(`Next step: ${report.nextStep}`);
}

main();
