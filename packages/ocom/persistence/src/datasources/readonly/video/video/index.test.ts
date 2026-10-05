import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import { expect } from 'vitest';
import type { ModelsContext } from '../../../../index.ts';
import { VideoReadRepositoryImpl } from './index.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/index.feature'));

test.for(feature, ({ Scenario }) => {
	Scenario('Building the video read repository', ({ When, Then }) => {
		let result: ReturnType<typeof VideoReadRepositoryImpl>;
		When('I call VideoReadRepositoryImpl with models and a passport', () => {
			result = VideoReadRepositoryImpl({ Video: {} } as unknown as ModelsContext, {} as Domain.Passport);
		});
		Then('it should expose a VideoReadRepo with getById and getByCommunityId', () => {
			expect(typeof result.VideoReadRepo.getById).toBe('function');
			expect(typeof result.VideoReadRepo.getByCommunityId).toBe('function');
		});
	});
});
