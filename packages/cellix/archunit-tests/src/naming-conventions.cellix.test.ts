import { projectFiles } from 'archunit';
import { describe, expect, it } from 'vitest';

describe('Cellix Package Naming Conventions', () => {
	describe('Service Packages', () => {
		it('service packages should follow naming pattern: service-{type}-{specificType} with optional -base/-mock', async () => {
			const violations: string[] = [];

			await projectFiles()
				.inFolder('../cellix/service-*')
				.withName('package.json')
				.should()
				.adhereTo((file) => {
					// Extract package name from path: ../cellix/service-xxx/package.json
					const match = file.path.match(/cellix\/(service-[^/]+)\/package\.json/);
					if (!match) return true;

					const folderName = match[1];
					// Pattern: service-{type} or service-{type}-{specificType} or service-{type}-{specificType}-base/mock
					// Examples: service-blob, service-mail-sendgrid, service-payment-base, service-messaging-mock
					const validPattern = /^service-[a-z]+(-[a-z]+)?(-(?:base|mock))?$/.test(folderName);

					if (!validPattern) {
						violations.push(`[${file.path}] Service package "${folderName}" does not follow pattern: service-{type}[-{specificType}][-base|-mock]`);
						return false;
					}
					return true;
				}, 'Service packages must follow naming pattern: service-{type}[-{specificType}][-base|-mock]')
				.check();

			expect(violations).toStrictEqual([]);
		});

		it('service package names must use lowercase with hyphens', async () => {
			const violations: string[] = [];

			await projectFiles()
				.inFolder('../cellix/service-*')
				.withName('package.json')
				.should()
				.adhereTo((file) => {
					const match = file.path.match(/cellix\/(service-[^/]+)\/package\.json/);
					if (!match) return true;

					const folderName = match[1];
					const hasInvalidCharacters = /[A-Z_]/.test(folderName);

					if (hasInvalidCharacters) {
						violations.push(`[${file.path}] Service package "${folderName}" contains uppercase or underscores`);
						return false;
					}
					return true;
				}, 'Service package names must use lowercase with hyphens only')
				.check();

			expect(violations).toStrictEqual([]);
		});
	});

	describe('Server Packages', () => {
		it('server packages should follow naming pattern: server-{name}-seedwork with optional -mock', async () => {
			const violations: string[] = [];

			await projectFiles()
				.inFolder('../cellix/server-*')
				.withName('package.json')
				.should()
				.adhereTo((file) => {
					// Extract package name from path: ../cellix/server-xxx/package.json
					const match = file.path.match(/cellix\/(server-[^/]+)\/package\.json/);
					if (!match) return true;

					const folderName = match[1];
					// Pattern: server-{name}-seedwork or server-{name}-{type}-seedwork or server-{name}-seedwork-mock
					// Examples: server-messaging-seedwork, server-mongodb-memory-seedwork, server-payment-seedwork
					const validPattern = /^server-[a-z]+(-[a-z]+)*-seedwork(-mock)?$/.test(folderName);

					if (!validPattern) {
						violations.push(`[${file.path}] Server package "${folderName}" does not follow pattern: server-{name}[-{name}...]-seedwork[-mock]`);
						return false;
					}
					return true;
				}, 'Server packages must follow naming pattern: server-{name}[-{name}...]-seedwork[-mock]')
				.check();

			expect(violations).toStrictEqual([]);
		});

		it('server package names must use lowercase with hyphens', async () => {
			const violations: string[] = [];

			await projectFiles()
				.inFolder('../cellix/server-*')
				.withName('package.json')
				.should()
				.adhereTo((file) => {
					const match = file.path.match(/cellix\/(server-[^/]+)\/package\.json/);
					if (!match) return true;

					const folderName = match[1];
					const hasInvalidCharacters = /[A-Z_]/.test(folderName);

					if (hasInvalidCharacters) {
						violations.push(`[${file.path}] Server package "${folderName}" contains uppercase or underscores`);
						return false;
					}
					return true;
				}, 'Server package names must use lowercase with hyphens only')
				.check();

			expect(violations).toStrictEqual([]);
		});
	});

	describe('Mixed Cellix Naming', () => {
		it('all cellix service and server packages must follow their respective conventions', async () => {
			const violations: string[] = [];

			await projectFiles()
				.inFolder('../cellix')
				.withName('package.json')
				.should()
				.adhereTo((file) => {
					const match = file.path.match(/cellix\/([^/]+)\/package\.json/);
					if (!match) return true;

					const folderName = match[1];

					// Skip non-service/non-server packages
					if (!folderName.startsWith('service-') && !folderName.startsWith('server-')) {
						return true;
					}

					// Service pattern check
					if (folderName.startsWith('service-')) {
						const validServicePattern = /^service-[a-z]+(-[a-z]+)?(-(?:base|mock))?$/.test(folderName);
						if (!validServicePattern) {
							violations.push(`[${file.path}] Service package "${folderName}" violates naming convention`);
							return false;
						}
					}

					// Server pattern check
					if (folderName.startsWith('server-')) {
						const validServerPattern = /^server-[a-z]+(-[a-z]+)*-seedwork(-mock)?$/.test(folderName);
						if (!validServerPattern) {
							violations.push(`[${file.path}] Server package "${folderName}" violates naming convention`);
							return false;
						}
					}

					return true;
				}, 'All cellix service/server packages must follow naming conventions')
				.check();

			expect(violations).toStrictEqual([]);
		});
	});
});
