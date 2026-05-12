import { Formatter, formatterHelpers, type IFormatterOptions } from '@cucumber/cucumber';
import type { Envelope, TestCaseFinished, TestRunFinished, TestRunStarted, Timestamp } from '@cucumber/messages';

type ParsedTestSteps = ReturnType<typeof formatterHelpers.parseTestCaseAttempt>['testSteps'];

const STATUS_ICONS: Record<string, string> = {
	PASSED: 'PASS',
	FAILED: 'FAIL',
	SKIPPED: 'SKIP',
	PENDING: 'PEND',
	UNDEFINED: 'UNDEF',
	AMBIGUOUS: 'AMBIG',
	UNKNOWN: '?',
};

function timestampToMs(ts: Timestamp): number {
	return (ts.seconds ?? 0) * 1000 + Math.round((ts.nanos ?? 0) / 1_000_000);
}

export default class AgentFormatter extends Formatter {
	static override readonly documentation = 'Condensed formatter for AI coding agents — minimal, token-efficient output.';

	private testRunStarted: TestRunStarted | undefined;
	private issueCount = 0;
	private scenarioCount = 0;
	private readonly statusCounts: Record<string, number> = {};

	constructor(options: IFormatterOptions) {
		super(options);
		options.eventBroadcaster.on('envelope', (envelope: Envelope) => this.parseEnvelope(envelope));
	}

	private parseEnvelope(envelope: Envelope): void {
		if (envelope.testRunStarted) {
			this.testRunStarted = envelope.testRunStarted;
		} else if (envelope.testCaseFinished) {
			this.onTestCaseFinished(envelope.testCaseFinished);
		} else if (envelope.testRunFinished) {
			this.onTestRunFinished(envelope.testRunFinished);
		}
	}

	private onTestCaseFinished(testCaseFinished: TestCaseFinished): void {
		const attempt = this.eventDataCollector.getTestCaseAttempt(testCaseFinished.testCaseStartedId);
		const statusKey = String(attempt.worstTestStepResult.status);

		this.scenarioCount++;
		this.statusCounts[statusKey] = (this.statusCounts[statusKey] ?? 0) + 1;

		const parsed = formatterHelpers.parseTestCaseAttempt({
			testCaseAttempt: attempt,
			snippetBuilder: this.snippetBuilder,
			supportCodeLibrary: this.supportCodeLibrary,
		});

		const icon = STATUS_ICONS[statusKey] ?? '?';
		const { name, sourceLocation } = parsed.testCase;
		const loc = sourceLocation ? `${sourceLocation.uri}:${sourceLocation.line}` : '';

		const isIssue = formatterHelpers.isFailure(attempt.worstTestStepResult, testCaseFinished.willBeRetried) || formatterHelpers.isWarning(attempt.worstTestStepResult, testCaseFinished.willBeRetried);

		if (isIssue) {
			this.issueCount++;
			this.log(`[${icon}] ${name} (${loc})\n`);
			this.logFailedSteps(parsed.testSteps);
		}
	}

	private logFailedSteps(testSteps: ParsedTestSteps): void {
		for (const step of testSteps) {
			const stepStatus = String(step.result.status);
			if (stepStatus === 'PASSED' || stepStatus === 'SKIPPED') continue;

			const stepIcon = STATUS_ICONS[stepStatus] ?? '?';
			const stepText = step.text ?? step.keyword?.trim() ?? '(hook)';
			this.log(`  [${stepIcon}] ${stepText}\n`);

			if (step.result.message) {
				const lines = step.result.message.split('\n');
				const truncated = lines.slice(0, 15);
				for (const line of truncated) {
					this.log(`    ${line}\n`);
				}
				if (lines.length > 15) {
					this.log(`    ... (${lines.length - 15} more lines)\n`);
				}
			}

			if (step.snippet) {
				this.log(`  snippet: ${step.snippet}\n`);
			}
		}
	}

	private onTestRunFinished(testRunFinished: TestRunFinished): void {
		this.log('\n--- (Agent) Results ---\n');

		const parts: string[] = [];
		for (const [status, count] of Object.entries(this.statusCounts)) {
			parts.push(`${status}: ${count}`);
		}
		this.log(`Scenarios: ${this.scenarioCount} (${parts.join(', ')})\n`);

		if (this.testRunStarted?.timestamp && testRunFinished.timestamp) {
			const ms = timestampToMs(testRunFinished.timestamp) - timestampToMs(this.testRunStarted.timestamp);
			this.log(`Duration: ${ms}ms\n`);
		}

		if (this.issueCount === 0) {
			this.log('All scenarios passed.\n');
		} else {
			this.log(`Issues: ${this.issueCount}\n`);
		}
	}
}
