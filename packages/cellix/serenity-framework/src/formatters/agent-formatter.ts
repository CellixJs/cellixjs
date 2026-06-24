import { Formatter, formatterHelpers, type IFormatterOptions } from '@cucumber/cucumber';
import type { Envelope, TestCaseFinished, TestRunFinished, TestRunStarted, Timestamp } from '@cucumber/messages';

type ParsedTestSteps = ReturnType<typeof formatterHelpers.parseTestCaseAttempt>['testSteps'];

const STATUS_ICONS: Record<string, string> = {
	AMBIGUOUS: 'AMBIG',
	FAILED: 'FAIL',
	PASSED: 'PASS',
	PENDING: 'PEND',
	SKIPPED: 'SKIP',
	UNDEFINED: 'UNDEF',
	UNKNOWN: '?',
};

function timestampToMs(timestamp: Timestamp): number {
	return (timestamp.seconds ?? 0) * 1000 + Math.round((timestamp.nanos ?? 0) / 1_000_000);
}

/**
 * Condensed Cucumber formatter intended for agent-readable test output.
 *
 * The formatter logs failed and warning scenarios with a compact summary, then
 * emits aggregate scenario counts and duration at the end of the run.
 */
export default class AgentFormatter extends Formatter {
	/** Formatter documentation shown by Cucumber. */
	static override readonly documentation = 'Condensed formatter for AI coding agents: minimal, token-efficient output.';

	private testRunStarted: TestRunStarted | undefined;
	private issueCount = 0;
	private scenarioCount = 0;
	private readonly statusCounts: Record<string, number> = {};

	/**
	 * @param options Cucumber formatter options.
	 */
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
			snippetBuilder: this.snippetBuilder,
			supportCodeLibrary: this.supportCodeLibrary,
			testCaseAttempt: attempt,
		});

		const icon = STATUS_ICONS[statusKey] ?? '?';
		const { name, sourceLocation } = parsed.testCase;
		const location = sourceLocation ? `${sourceLocation.uri}:${sourceLocation.line}` : '';
		const isIssue = formatterHelpers.isFailure(attempt.worstTestStepResult, testCaseFinished.willBeRetried) || formatterHelpers.isWarning(attempt.worstTestStepResult, testCaseFinished.willBeRetried);

		if (isIssue) {
			this.issueCount++;
			this.log(`[${icon}] ${name} (${location})\n`);
			this.logFailedSteps(parsed.testSteps);
		}
	}

	private logFailedSteps(testSteps: ParsedTestSteps): void {
		for (const step of testSteps) {
			const stepStatus = String(step.result.status);
			if (stepStatus === 'PASSED' || stepStatus === 'SKIPPED') {
				continue;
			}

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

		const parts = Object.entries(this.statusCounts).map(([status, count]) => `${status}: ${count}`);
		this.log(`Scenarios: ${this.scenarioCount} (${parts.join(', ')})\n`);

		if (this.testRunStarted?.timestamp && testRunFinished.timestamp) {
			const ms = timestampToMs(testRunFinished.timestamp) - timestampToMs(this.testRunStarted.timestamp);
			this.log(`Duration: ${ms}ms\n`);
		}

		this.log(this.issueCount === 0 ? 'All scenarios passed.\n' : `Issues: ${this.issueCount}\n`);
	}
}
