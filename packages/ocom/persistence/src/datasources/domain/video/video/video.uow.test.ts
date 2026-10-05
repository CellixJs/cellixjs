import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { VideoModelType } from '@ocom/data-sources-mongoose-models/video';
import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { getVideoUnitOfWork } from './video.uow.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/video.uow.feature'));

test.for(feature, ({ Scenario }) => {
	Scenario('Creating a unit of work for videos', ({ Given, When, Then }) => {
		let model: VideoModelType;
		let passport: Domain.Passport;
		let unitOfWork: Domain.Contexts.Video.Video.VideoUnitOfWork;
		Given('a Video model and a passport', () => {
			model = { findById: vi.fn() } as unknown as VideoModelType;
			passport = {} as Domain.Passport;
		});
		When('I call getVideoUnitOfWork', () => {
			unitOfWork = getVideoUnitOfWork(model, passport);
		});
		Then('it should return a unit of work with transaction methods', () => {
			expect(typeof unitOfWork.withTransaction).toBe('function');
			expect(typeof unitOfWork.withScopedTransaction).toBe('function');
		});
	});
});
