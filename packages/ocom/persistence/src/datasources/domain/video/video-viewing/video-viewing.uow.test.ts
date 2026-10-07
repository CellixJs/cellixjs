import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { VideoViewingModelType } from '@ocom/data-sources-mongoose-models/video-viewing';
import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { getVideoViewingUnitOfWork } from './video-viewing.uow.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/video-viewing.uow.feature'));

test.for(feature, ({ Scenario }) => {
	Scenario('Creating a unit of work for video viewings', ({ Given, When, Then }) => {
		let model: VideoViewingModelType;
		let passport: Domain.Passport;
		let unitOfWork: Domain.Contexts.Video.VideoViewing.VideoViewingUnitOfWork;
		Given('a VideoViewing model and a passport', () => {
			model = { findOne: vi.fn() } as unknown as VideoViewingModelType;
			passport = {} as Domain.Passport;
		});
		When('I call getVideoViewingUnitOfWork', () => {
			unitOfWork = getVideoViewingUnitOfWork(model, passport);
		});
		Then('it should return a unit of work with transaction methods', () => {
			expect(typeof unitOfWork.withTransaction).toBe('function');
			expect(typeof unitOfWork.withScopedTransaction).toBe('function');
		});
	});
});
