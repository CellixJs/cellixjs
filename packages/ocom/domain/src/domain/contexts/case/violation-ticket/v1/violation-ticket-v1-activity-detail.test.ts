import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import { expect, vi } from 'vitest';
import type { MemberEntityReference } from '../../../community/member/index.ts';
import type { ViolationTicketV1Visa } from './violation-ticket-v1.visa.ts';
import {
	ViolationTicketV1ActivityDetail,
	type ViolationTicketV1ActivityDetailProps,
} from './violation-ticket-v1-activity-detail.ts';
import * as ValueObjects from './violation-ticket-v1-activity-detail.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(
		__dirname,
		'features/violation-ticket-v1-activity-detail.feature',
	),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let activityDetail: ViolationTicketV1ActivityDetail;
	let visa: ViolationTicketV1Visa;
	let props: ViolationTicketV1ActivityDetailProps;
	let memberRef: MemberEntityReference;

	BeforeEachScenario(() => {
		memberRef = { id: 'member-123' } as MemberEntityReference;

		visa = {
			determineIf: vi.fn(() => true),
		} as unknown as ViolationTicketV1Visa;

		props = {
			id: 'activity-123',
			activityType: ValueObjects.ActivityTypeCodes.Created,
			activityDescription: 'Test activity',
			activityBy: memberRef,
			loadActivityBy: vi.fn(() => Promise.resolve(memberRef)),
		};
	});

	Scenario(
		'Creating a new ViolationTicketV1ActivityDetail instance',
		({ When, Then, And }) => {
			When(
				'I create a new ViolationTicketV1ActivityDetail with valid properties',
				() => {
					activityDetail = new ViolationTicketV1ActivityDetail(props, visa);
				},
			);

			Then('the instance should be created successfully', () => {
				expect(activityDetail).toBeDefined();
				expect(activityDetail.id).toBe('activity-123');
			});

			And('the activity type should be set correctly', () => {
				expect(activityDetail.activityType).toBe(
					ValueObjects.ActivityTypeCodes.Created,
				);
			});

			And('the activity description should be set correctly', () => {
				expect(activityDetail.activityDescription).toBe('Test activity');
			});

			And('the activity by reference should be set correctly', () => {
				expect(activityDetail.activityBy).toBe(memberRef);
			});
		},
	);

	Scenario(
		'Setting activity type with proper permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1ActivityDetail instance', () => {
				activityDetail = new ViolationTicketV1ActivityDetail(props, visa);
			});

			And('I have proper permissions to modify', () => {
				vi.mocked(visa.determineIf).mockReturnValue(true);
			});

			And('I set the activity type', () => {
				activityDetail.activityType = new ValueObjects.ActivityTypeCode(
					ValueObjects.ActivityTypeCodes.Updated,
				);
			});

			Then('the activity type should be updated', () => {
				expect(activityDetail.activityType).toBe(
					ValueObjects.ActivityTypeCodes.Updated,
				);
			});
		},
	);

	Scenario(
		'Setting activity type without permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1ActivityDetail instance', () => {
				activityDetail = new ViolationTicketV1ActivityDetail(props, visa);
			});

			And('I do not have proper permissions to modify', () => {
				vi.mocked(visa.determineIf).mockReturnValue(false);
			});

			And('I set the activity type', () => {
				expect(() => {
					activityDetail.activityType = new ValueObjects.ActivityTypeCode(
						ValueObjects.ActivityTypeCodes.Updated,
					);
				}).toThrow(DomainSeedwork.PermissionError);
			});

			Then('a PermissionError should be thrown', () => {
				// Already checked
			});
		},
	);

	Scenario(
		'Setting activity description with proper permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1ActivityDetail instance', () => {
				activityDetail = new ViolationTicketV1ActivityDetail(props, visa);
			});

			And('I have proper permissions to modify', () => {
				vi.mocked(visa.determineIf).mockReturnValue(true);
			});

			And('I set the activity description', () => {
				activityDetail.activityDescription = new ValueObjects.Description(
					'Updated description',
				);
			});

			Then('the activity description should be updated', () => {
				expect(activityDetail.activityDescription).toBe('Updated description');
			});
		},
	);

	Scenario(
		'Setting activity description without permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1ActivityDetail instance', () => {
				activityDetail = new ViolationTicketV1ActivityDetail(props, visa);
			});

			And('I do not have proper permissions to modify', () => {
				vi.mocked(visa.determineIf).mockReturnValue(false);
			});

			And('I set the activity description', () => {
				expect(() => {
					activityDetail.activityDescription = new ValueObjects.Description(
						'Updated description',
					);
				}).toThrow(DomainSeedwork.PermissionError);
			});

			Then('a PermissionError should be thrown', () => {
				// Already checked
			});
		},
	);

	Scenario('Loading activity by reference', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1ActivityDetail instance', () => {
			activityDetail = new ViolationTicketV1ActivityDetail(props, visa);
		});

		And('I call loadActivityBy', async () => {
			const result = await activityDetail.loadActivityBy();
			expect(result).toBe(memberRef);
		});

		Then('it should return the member entity reference', () => {
			// Already checked
		});
	});
});
