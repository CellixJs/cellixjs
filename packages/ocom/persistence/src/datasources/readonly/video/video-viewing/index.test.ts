import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import { expect } from 'vitest';
import type { ModelsContext } from '../../../../index.ts';
import { VideoViewingReadRepositoryImpl } from './index.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/index.feature'));

test.for(feature, ({ Scenario }) => {
	Scenario('Building the video viewing read repository', ({ When, Then }) => {
		let result: ReturnType<typeof VideoViewingReadRepositoryImpl>;
		When('I call VideoViewingReadRepositoryImpl with models and a passport', () => {
			result = VideoViewingReadRepositoryImpl({ VideoViewing: {} } as unknown as ModelsContext, {} as Domain.Passport);
		});
		Then('it should expose a VideoViewingReadRepo with getByVideoAndMember and getByVideoId', () => {
			expect(typeof result.VideoViewingReadRepo.getByVideoAndMember).toBe('function');
			expect(typeof result.VideoViewingReadRepo.getByVideoId).toBe('function');
		});
	});
});
