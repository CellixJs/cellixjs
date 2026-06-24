import { describe, expect, it } from 'vitest';
import { ActorName, GherkinDataTable } from './index.ts';

describe('ActorName', () => {
	it('resolves pronouns to the configured default actor name', () => {
		expect(ActorName.resolve('she', { defaultName: 'Casey' })).toBe('Casey');
		expect(ActorName.resolve('Morgan', { defaultName: 'Casey' })).toBe('Morgan');
	});
});

describe('GherkinDataTable', () => {
	it('returns a typed rows hash', () => {
		const dataTable = {
			rowsHash: () => ({ name: 'Evergreen', status: 'Active' }),
		};

		const row = GherkinDataTable.from(dataTable as never).rowsHash<{ name: string; status: string }>();

		expect(row.name).toBe('Evergreen');
		expect(row.status).toBe('Active');
	});
});
