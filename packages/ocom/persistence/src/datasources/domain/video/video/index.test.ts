import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { VideoModelType } from '@ocom/data-sources-mongoose-models/video';
import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { VideoPersistence } from './index.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/index.feature'));

test.for(feature, ({ Scenario }) => {
	Scenario('Building the video persistence layer', ({ Given, When, Then }) => {
		let models: Parameters<typeof VideoPersistence>[0];
		let passport: Domain.Passport;
		let result: ReturnType<typeof VideoPersistence>;
		Given('a models context with a Video model and a passport', () => {
			models = { Video: { findById: vi.fn() } as unknown as VideoModelType } as unknown as Parameters<typeof VideoPersistence>[0];
			passport = {} as Domain.Passport;
		});
		When('I call VideoPersistence', () => {
			result = VideoPersistence(models, passport);
		});
		Then('it should expose a VideoUnitOfWork', () => {
			expect(typeof result.VideoUnitOfWork.withScopedTransaction).toBe('function');
		});
	});
});
