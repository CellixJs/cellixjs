import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
	ViolationTicketV1FinanceDetailsAdhocTransactionsApproval,
	type ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalProps,
} from './violation-ticket-v1-finance-details-adhoc-transactions-approval.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(
		__dirname,
		'features/violation-ticket-v1-finance-details-adhoc-transactions-approval.feature',
	),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let approval: ViolationTicketV1FinanceDetailsAdhocTransactionsApproval;
	let props: ViolationTicketV1FinanceDetailsAdhocTransactionsApprovalProps;

	BeforeEachScenario(() => {
		props = {
			isApplicantApprovalRequired: true,
			isApplicantApproved: false,
			applicantRespondedAt: new Date('2023-01-01'),
		};
	});

	Scenario(
		'Creating a new ViolationTicketV1FinanceDetailsAdhocTransactionsApproval instance',
		({ When, Then, And }) => {
			When(
				'I create a new ViolationTicketV1FinanceDetailsAdhocTransactionsApproval with valid properties',
				() => {
					approval =
						new ViolationTicketV1FinanceDetailsAdhocTransactionsApproval(props);
				},
			);

			Then('the is applicant approval required should be accessible', () => {
				expect(approval.isApplicantApprovalRequired).toBe(true);
			});

			And('the is applicant approved should be accessible', () => {
				expect(approval.isApplicantApproved).toBe(false);
			});

			And('the applicant responded at should be accessible', () => {
				expect(approval.applicantRespondedAt).toEqual(new Date('2023-01-01'));
			});
		},
	);

	Scenario(
		'Setting is applicant approval required',
		({ Given, When, Then }) => {
			Given(
				'I have a ViolationTicketV1FinanceDetailsAdhocTransactionsApproval instance',
				() => {
					approval =
						new ViolationTicketV1FinanceDetailsAdhocTransactionsApproval(props);
				},
			);

			When('I set the is applicant approval required to false', () => {
				approval.isApplicantApprovalRequired = false;
			});

			Then('the is applicant approval required should be false', () => {
				expect(approval.isApplicantApprovalRequired).toBe(false);
			});
		},
	);

	Scenario('Setting is applicant approved', ({ Given, When, Then }) => {
		Given(
			'I have a ViolationTicketV1FinanceDetailsAdhocTransactionsApproval instance',
			() => {
				approval = new ViolationTicketV1FinanceDetailsAdhocTransactionsApproval(
					props,
				);
			},
		);

		When('I set the is applicant approved to true', () => {
			approval.isApplicantApproved = true;
		});

		Then('the is applicant approved should be true', () => {
			expect(approval.isApplicantApproved).toBe(true);
		});
	});

	Scenario('Setting applicant responded at', ({ Given, When, Then }) => {
		Given(
			'I have a ViolationTicketV1FinanceDetailsAdhocTransactionsApproval instance',
			() => {
				approval = new ViolationTicketV1FinanceDetailsAdhocTransactionsApproval(
					props,
				);
			},
		);

		When('I set the applicant responded at to a new date', () => {
			const newDate = new Date('2023-02-01');
			approval.applicantRespondedAt = newDate;
		});

		Then('the applicant responded at should be the new date', () => {
			expect(approval.applicantRespondedAt).toEqual(new Date('2023-02-01'));
		});
	});
});
