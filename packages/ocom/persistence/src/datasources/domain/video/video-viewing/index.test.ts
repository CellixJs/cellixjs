import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { VideoViewingModelType } from '@ocom/data-sources-mongoose-models/video-viewing';
import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { VideoViewingPersistence } from './index.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/index.feature'));

test.for(feature, ({ Scenario }) => {
	Scenario('Building the video viewing persistence layer', ({ Given, When, Then }) => {
		let models: Parameters<typeof VideoViewingPersistence>[0];
		let passport: Domain.Passport;
		let result: ReturnType<typeof VideoViewingPersistence>;
		Given('a models context with a VideoViewing model and a passport', () => {
			models = { VideoViewing: { findOne: vi.fn() } as unknown as VideoViewingModelType } as unknown as Parameters<typeof VideoViewingPersistence>[0];
			passport = {} as Domain.Passport;
		});
		When('I call VideoViewingPersistence', () => {
			result = VideoViewingPersistence(models, passport);
		});
		Then('it should expose a VideoViewingUnitOfWork', () => {
			expect(typeof result.VideoViewingUnitOfWork.withScopedTransaction).toBe('function');
			expect(typeof result.VideoViewingUnitOfWork.withTransaction).toBe('function');
		});
	});
});
