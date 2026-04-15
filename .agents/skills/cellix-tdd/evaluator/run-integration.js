import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const evaluateScript = path.resolve('.agents/skills/cellix-tdd/evaluator/evaluate-cellix-tdd.ts');
const fixturesRoot = '.agents/skills/cellix-tdd/fixtures';
const args = ['--experimental-strip-types', evaluateScript, '--fixtures-root', fixturesRoot, '--verify-expected', '--json'];

console.log('Running cellix-tdd evaluator (integration)...');
const result = spawnSync(process.execPath, args, { encoding: 'utf8' });

if (result.error) {
	console.error('Failed to execute evaluator:', result.error);
	process.exit(2);
}

if (result.stderr && result.stderr.trim().length > 0) {
	console.error('Evaluator stderr:\n', result.stderr);
}

let parsed;
try {
	parsed = JSON.parse(result.stdout);
} catch (err) {
	// Log full stdout to help diagnose malformed output before attempting recovery
	console.error('Evaluator stdout (pre-recovery):\n', result.stdout);
	// Attempt to locate JSON substring
	const firstBracket = result.stdout.indexOf('[');
	const firstBrace = result.stdout.indexOf('{');
	let start = -1;
	if (firstBracket >= 0) {
		start = firstBracket;
	} else if (firstBrace >= 0) {
		start = firstBrace;
	}
	if (start >= 0) {
		try {
			console.error(err);
			parsed = JSON.parse(result.stdout.slice(start));
		} catch (error_) {
			console.error('Failed to parse JSON output from evaluator:', error_);
			console.error('Full stdout:\n', result.stdout);
			process.exit(3);
		}
	} else {
		console.error('No JSON output produced by evaluator. Full stdout:\n', result.stdout);
		process.exit(3);
	}
}

let allMatched = true;
for (const entry of parsed) {
	const label = entry.result?.label ?? '<unknown>';
	if (entry.comparison && !entry.comparison.matches) {
		allMatched = false;
		console.error(`Fixture ${label} FAILED: ${entry.comparison.problems.join('; ')}`);
	} else {
		console.log(`Fixture ${label}: OK`);
	}
}

if (!allMatched || result.status !== 0) {
	console.error('One or more fixture evaluations failed or the evaluator exited with non-zero status.');
	process.exit(1);
}

console.log('All fixtures matched expected reports.');
process.exit(0);
