import process from 'node:process';
import { suggestLaneForChangedPaths } from '../lib/orchestration-routing.ts';

function parseArgs(argv: string[]): { repoRoot: string; json: boolean; specPath?: string; paths: string[] } {
	let repoRoot = process.cwd();
	let json = false;
	let specPath: string | undefined;
	const paths: string[] = [];

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];

		if (arg === '--repo') {
			repoRoot = argv[index + 1] ?? repoRoot;
			index += 1;
			continue;
		}

		if (arg === '--spec') {
			specPath = argv[index + 1];
			index += 1;
			continue;
		}

		if (arg === '--json') {
			json = true;
			continue;
		}

		paths.push(arg);
	}

	return { repoRoot, json, specPath, paths };
}

function main(): void {
	const args = parseArgs(process.argv.slice(2));
	const report = suggestLaneForChangedPaths(args.repoRoot, args.paths, { specPath: args.specPath });

	if (args.json) {
		console.log(JSON.stringify(report, null, 2));
		return;
	}

	if (report.suggestedLane) {
		console.log(`Suggested lane: ${report.suggestedLane} (${report.confidence})`);
	} else {
		console.log(`No single lane suggestion (${report.confidence}).`);
	}

	console.log(`Matched classes: ${report.matchedClasses.join(', ') || 'none'}`);
	console.log(`Candidate lanes: ${report.candidateLanes.join(', ') || 'none'}`);

	for (const reason of report.reasons) {
		console.log(`- ${reason}`);
	}
}

main();
