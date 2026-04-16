import process from 'node:process';
import { bootstrapOrchestrationSession } from '../lib/orchestration-bootstrap.ts';
import type { ArtifactMode, LaneId, RoleId } from '../lib/types.ts';

function parseArgs(argv: string[]): {
	repoRoot: string;
	json: boolean;
	sessionId?: string;
	lane?: LaneId;
	role?: RoleId;
	artifactMode?: ArtifactMode;
	eventId?: string;
	startPlanning: boolean;
	paths: string[];
} {
	let repoRoot = process.cwd();
	let json = false;
	let sessionId: string | undefined;
	let lane: LaneId | undefined;
	let role: RoleId | undefined;
	let artifactMode: ArtifactMode | undefined;
	let eventId: string | undefined;
	let startPlanning = true;
	const paths: string[] = [];

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];

		if (arg === '--repo') {
			repoRoot = argv[index + 1] ?? repoRoot;
			index += 1;
			continue;
		}

		if (arg === '--json') {
			json = true;
			continue;
		}

		if (arg === '--session') {
			sessionId = argv[index + 1];
			index += 1;
			continue;
		}

		if (arg === '--lane') {
			lane = argv[index + 1] as LaneId | undefined;
			index += 1;
			continue;
		}

		if (arg === '--role') {
			role = argv[index + 1] as RoleId | undefined;
			index += 1;
			continue;
		}

		if (arg === '--artifact-mode') {
			artifactMode = argv[index + 1] as ArtifactMode | undefined;
			index += 1;
			continue;
		}

		if (arg === '--event') {
			eventId = argv[index + 1];
			index += 1;
			continue;
		}

		if (arg === '--no-planning') {
			startPlanning = false;
			continue;
		}

		paths.push(arg);
	}

	return { repoRoot, json, sessionId, lane, role, artifactMode, eventId, startPlanning, paths };
}

function main(): void {
	const args = parseArgs(process.argv.slice(2));
	const report = bootstrapOrchestrationSession(args.repoRoot, {
		changedPaths: args.paths,
		sessionId: args.sessionId,
		lane: args.lane,
		role: args.role,
		artifactMode: args.artifactMode,
		eventId: args.eventId,
		startPlanning: args.startPlanning,
	});

	if (args.json) {
		console.log(JSON.stringify(report, null, 2));
		return;
	}

	console.log(`Profile: ${report.profile}`);
	console.log(`Artifact mode: ${report.artifactMode}`);
	console.log(`Matched classes: ${report.matchedClasses.join(', ') || 'none'}`);
	console.log(`Candidate lanes: ${report.candidateLanes.join(', ') || 'none'}`);
	console.log(`Suggested lane: ${report.suggestedLane ?? 'none'} (${report.confidence})`);
	console.log(`Selected lane: ${report.selectedLane ?? 'none'}`);
	console.log(`Requires lane decision: ${report.requiresLaneDecision ? 'yes' : 'no'}`);
	console.log(`Should split phases: ${report.shouldSplitPhases ? 'yes' : 'no'}`);
	console.log(`Active framework extensions: ${report.activeFrameworkExtensions.join(', ') || 'none'}`);
	console.log(`Recommended framework extensions: ${report.recommendedFrameworkExtensions.join(', ') || 'none'}`);

	for (const reason of report.reasons) {
		console.log(`- ${reason}`);
	}

	if (report.sessionInit) {
		console.log(report.sessionInit.message);
	}

	if (report.planningTransition) {
		console.log(report.planningTransition.message);
	}

	if (report.nextActions.length > 0) {
		console.log('Next actions:');
		for (const nextAction of report.nextActions) {
			console.log(`- ${nextAction}`);
		}
	}
}

main();
