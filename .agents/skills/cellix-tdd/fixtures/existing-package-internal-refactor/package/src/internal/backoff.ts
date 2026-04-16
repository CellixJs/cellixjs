export function buildBackoffSchedule(attempts: number, baseDelayMs: number): number[] {
	return Array.from({ length: attempts }, (_, index) => baseDelayMs * 2 ** index);
}
