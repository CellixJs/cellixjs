export const ONE_DAY_MS = 86_400_000;

export function parseDateInput(input: string): Date {
	if (input.startsWith('+')) {
		const days = Number.parseInt(input.substring(1), 10);
		const date = new Date();
		date.setDate(date.getDate() + days);
		date.setHours(0, 0, 0, 0);
		return date;
	}

	const date = new Date(input);
	if (Number.isNaN(date.getTime())) {
		throw new TypeError(`Invalid date input: "${input}"`);
	}
	date.setHours(0, 0, 0, 0);
	return date;
}

export function formatDateForComparison(date: Date): string {
	return date.toISOString().split('T')[0] ?? '';
}
