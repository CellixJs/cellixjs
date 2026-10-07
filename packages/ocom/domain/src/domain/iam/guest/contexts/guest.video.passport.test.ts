import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { VideoEntityReference } from '../../../contexts/video/video/index.ts';
import type { VideoVisa } from '../../../contexts/video/video.visa.ts';
import type { VideoViewingEntityReference } from '../../../contexts/video/video-viewing/index.ts';
import { GuestVideoPassport } from './guest.video.passport.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/guest.video.passport.feature'));

test.for(feature, ({ Scenario }) => {
	Scenario('Guests are denied every video permission', ({ When, Then }) => {
		let visa: VideoVisa;
		When('I create a GuestVideoPassport and get a visa for a video', () => {
			visa = new GuestVideoPassport().forVideo({ id: 'video-1' } as VideoEntityReference);
		});
		Then('the visa should deny all permissions', () => {
			expect(visa.determineIf(() => true)).toBe(false);
		});
	});

	Scenario('Guests are denied every video viewing permission', ({ When, Then }) => {
		let visa: VideoVisa;
		When('I create a GuestVideoPassport and get a visa for a video viewing', () => {
			visa = new GuestVideoPassport().forVideoViewing({ id: 'viewing-1' } as VideoViewingEntityReference);
		});
		Then('the visa should deny all permissions', () => {
			expect(visa.determineIf(() => true)).toBe(false);
		});
	});
});
