import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { MemberEntityReference } from '../../../community/member/index.ts';
import {
	ServiceTicketV1ActivityDetail,
	type ServiceTicketV1ActivityDetailProps,
} from './service-ticket-v1-activity-detail.entity.ts';
import * as ValueObjects from './service-ticket-v1-activity-detail.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(
		__dirname,
		'features/service-ticket-v1-activity-detail.entity.feature',
	),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let activityDetail: ServiceTicketV1ActivityDetail;
	let props: ServiceTicketV1ActivityDetailProps;
	let memberRef: MemberEntityReference;

	BeforeEachScenario(() => {
		// Mock member reference
		memberRef = { id: 'member-123' } as MemberEntityReference;

		// Mock props
		props = {
			id: 'activity-123',
			activityType: 'CREATED',
			activityDescription: 'Test activity',
			activityBy: memberRef,
			loadActivityBy: vi.fn(() => Promise.resolve(memberRef)),
		} as ServiceTicketV1ActivityDetailProps;
	});

	Scenario(
		'Creating a new ServiceTicketV1ActivityDetail instance',
		({ When, Then, And }) => {
			When(
				'I create a new ServiceTicketV1ActivityDetail with valid properties',
				() => {
					activityDetail = ServiceTicketV1ActivityDetail.getNewInstance(
						props,
						memberRef,
					);
				},
			);

			Then('the instance should be created successfully', () => {
				expect(activityDetail).toBeDefined();
				expect(activityDetail.id).toBe('activity-123');
			});

			And('the activityType should be "CREATED"', () => {
				expect(activityDetail.activityType).toBe('CREATED');
			});

			And('the activityDescription should be "Test activity"', () => {
				expect(activityDetail.activityDescription).toBe('Test activity');
			});
		},
	);

	Scenario('Setting activityType', ({ When, Then, And }) => {
		When('I have a ServiceTicketV1ActivityDetail instance', () => {
			activityDetail = ServiceTicketV1ActivityDetail.getNewInstance(
				props,
				memberRef,
			);
		});

		And('I set the activityType to "UPDATED"', () => {
			activityDetail.activityType = new ValueObjects.ActivityTypeCode(
				'UPDATED',
			);
		});

		Then('the activityType should be updated to "UPDATED"', () => {
			expect(activityDetail.activityType).toBe('UPDATED');
		});
	});

	Scenario('Setting activityDescription', ({ When, Then, And }) => {
		When('I have a ServiceTicketV1ActivityDetail instance', () => {
			activityDetail = ServiceTicketV1ActivityDetail.getNewInstance(
				props,
				memberRef,
			);
		});

		And('I set the activityDescription to "Updated description"', () => {
			activityDetail.activityDescription = new ValueObjects.Description(
				'Updated description',
			);
		});

		Then(
			'the activityDescription should be updated to "Updated description"',
			() => {
				expect(activityDetail.activityDescription).toBe('Updated description');
			},
		);
	});

	Scenario('Loading activityBy', ({ When, Then, And }) => {
		When('I have a ServiceTicketV1ActivityDetail instance', () => {
			activityDetail = ServiceTicketV1ActivityDetail.getNewInstance(
				props,
				memberRef,
			);
		});

		And('I load the activityBy', async () => {
			const result = await activityDetail.loadActivityBy();
			expect(result).toEqual(memberRef);
		});

		Then('the activityBy should be returned', () => {
			// Already checked in previous step
		});
	});
});
