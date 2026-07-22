import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { User } from './index.ts';
import { StaffRoleDeletedReassignmentService } from './staff-role-deleted-reassignment.service.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/index.feature'));

test.for(feature, ({ Scenario }) => {
	let userExport: typeof User;

	Scenario('Exporting StaffRoleDeletedReassignmentService', ({ Given, When, Then }) => {
		Given('the user services index module', () => {
			// Module is already imported
		});

		When('I import the User export', () => {
			userExport = User;
		});

		Then('it should expose a StaffRoleDeletedReassignmentService instance', () => {
			expect(userExport).toBeDefined();
			expect(userExport.StaffRoleDeletedReassignmentService).toBeInstanceOf(StaffRoleDeletedReassignmentService);
		});
	});
});
