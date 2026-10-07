import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { VideoEntityReference } from '../../../contexts/video/video/index.ts';
import type { VideoVisa } from '../../../contexts/video/video.visa.ts';
import type { VideoViewingEntityReference } from '../../../contexts/video/video-viewing/index.ts';
import { SystemVideoPassport } from './system.video.passport.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/system.video.passport.feature'));
const video = { id: 'video-1' } as VideoEntityReference;

test.for(feature, ({ Scenario }) => {
	Scenario('The system passport grants the permissions it was created with', ({ When, Then, And }) => {
		let visa: VideoVisa;
		When('I create a SystemVideoPassport with isSystemAccount true and get a visa for a video', () => {
			visa = new SystemVideoPassport({ isSystemAccount: true }).forVideo(video);
		});
		Then('determineIf should report isSystemAccount as true', () => {
			expect(visa.determineIf((permissions) => permissions.isSystemAccount)).toBe(true);
		});
		And('determineIf should report canManageVideos as not granted', () => {
			expect(visa.determineIf((permissions) => permissions.canManageVideos === true)).toBe(false);
		});
	});

	Scenario('A system passport without permissions grants nothing', ({ When, Then }) => {
		let visa: VideoVisa;
		When('I create a SystemVideoPassport with no permissions and get a visa for a video', () => {
			visa = new SystemVideoPassport().forVideo(video);
		});
		Then('determineIf should report isSystemAccount as not granted', () => {
			expect(visa.determineIf((permissions) => permissions.isSystemAccount === true)).toBe(false);
		});
	});

	Scenario('The system passport grants its permissions for video viewings', ({ When, Then }) => {
		let visa: VideoVisa;
		When('I create a SystemVideoPassport with isSystemAccount true and get a visa for a video viewing', () => {
			visa = new SystemVideoPassport({ isSystemAccount: true }).forVideoViewing({ id: 'viewing-1' } as VideoViewingEntityReference);
		});
		Then('determineIf should report isSystemAccount as true', () => {
			expect(visa.determineIf((permissions) => permissions.isSystemAccount)).toBe(true);
		});
	});
});
