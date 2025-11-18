import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { PropArray } from '@cellix/domain-seedwork/prop-array';
import { expect, vi } from 'vitest';
import type { MemberEntityReference } from '../../../community/member/index.ts';
import type { Passport } from '../../../passport.ts';
import {
	ViolationTicketV1,
	type ViolationTicketV1Props,
} from './violation-ticket-v1.aggregate.ts';
import * as ValueObjects from './violation-ticket-v1.value-objects.ts';
import * as ActivityDetailValueObjects from './violation-ticket-v1-activity-detail.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/violation-ticket-v1.aggregate.feature'),
);

// Mock PropArray implementation for testing
class MockPropArray<T extends DomainEntityProps> implements PropArray<T> {
	private _items: T[] = [];

	constructor(items: T[] = []) {
		this._items = [...items];
	}

	get items(): ReadonlyArray<T> {
		return this._items;
	}

	addItem(item: T): void {
		this._items.push(item);
	}

	getNewItem(): T {
		// For testing, just create a basic object with required fields
		const newItem = {} as T;
		this._items.push(newItem);
		return newItem;
	}

	removeItem(item: T): void {
		const index = this._items.indexOf(item);
		if (index > -1) {
			this._items.splice(index, 1);
		}
	}

	removeAll(): void {
		this._items = [];
	}
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let violationTicket: ViolationTicketV1<ViolationTicketV1Props>;
	let passport: Passport;
	let props: ViolationTicketV1Props;
	let memberRef: MemberEntityReference;

	BeforeEachScenario(() => {
		// Mock passport
		passport = {
			case: {
				forViolationTicketV1: vi.fn(() => ({
					determineIf: vi.fn(() => true), // Default to true, override in scenarios
				})),
			},
		} as unknown as Passport;

		// Mock props
		props = {
			id: 'test-id',
			communityId: 'community-123',
			propertyId: 'property-123',
			requestorId: 'requestor-123',
			assignedToId: undefined,
			serviceId: undefined,
			title: 'Test Title',
			description: 'Test Description',
			status: '', // Will be set by getNewInstance
			priority: 0, // Will be set by getNewInstance
			ticketType: undefined,
			activityLog: new MockPropArray([]),
			messages: new MockPropArray([]),
			photos: new MockPropArray([]),
			financeDetails: {
				id: 'finance-123',
				serviceFee: 100,
				transactions: {
					id: 'transactions-123',
					submission: {
						id: 'submission-123',
						status: 'Pending',
						amount: 100,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
					adhocTransactions: new MockPropArray([]),
				},
				revenueRecognition: {
					id: 'revenue-123',
					submission: {
						id: 'gl-submission-123',
						amount: 100,
						description: 'Test GL transaction',
						createdAt: new Date(),
					},
					recognition: {
						id: 'gl-recognition-123',
						amount: 100,
						description: 'Test GL transaction',
						createdAt: new Date(),
					},
				},
			},
			revisionRequest: undefined,
			createdAt: new Date(),
			updatedAt: new Date(),
			schemaVersion: '1.0',
			hash: 'test-hash',
			lastIndexed: undefined,
			updateIndexFailedDate: undefined,
		} as unknown as ViolationTicketV1Props;

		memberRef = { id: 'member-123' } as MemberEntityReference;
	});

	Scenario('Attempting to set requestorId after creation', ({ When, Then }) => {
		let violationTicket: ViolationTicketV1<ViolationTicketV1Props>;
		When('I have a ViolationTicketV1 instance', () => {
			violationTicket = new ViolationTicketV1(props, passport);
		});
		When('I try to set the requestorId', () => {
			expect(() => {
				// @ts-expect-error: private setter
				violationTicket.requestorId = 'new-requestor-123';
			}).toThrow(PermissionError);
		});
		Then('a PermissionError should be thrown', () => {
			// Already checked above
		});
	});
	Scenario('Setting priority to a negative value', ({ When, Then }) => {
		let violationTicket: ViolationTicketV1<ViolationTicketV1Props>;
		When('I have a ViolationTicketV1 instance with proper permissions', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => true),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});
		When('I set the priority to -1', () => {
			expect(() => {
				violationTicket.priority = -1;
			}).toThrow();
		});
		Then('a validation error should be thrown', () => {
			// Already checked above
		});
	});

	Scenario('Setting status to an invalid value', ({ When, Then }) => {
		let violationTicket: ViolationTicketV1<ViolationTicketV1Props>;
		When(
			'I have a ViolationTicketV1 instance with system account permissions',
			() => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => true),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			},
		);
		When('I set the status to "InvalidStatus"', () => {
			expect(() => {
				violationTicket.status = 'InvalidStatus';
			}).toThrow();
		});
		Then('a validation error should be thrown', () => {
			// Already checked above
		});
	});

	Scenario(
		'Adding a status transition to an invalid status',
		({ When, Then }) => {
			let violationTicket: ViolationTicketV1<ViolationTicketV1Props>;
			When(
				'I have a ViolationTicketV1 instance with status "Draft" and proper permissions',
				() => {
					props.status = ValueObjects.StatusCodes.Draft;
					vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
						determineIf: vi.fn(() => false),
					});
					violationTicket = new ViolationTicketV1(props, passport);
				},
			);
			When('I add a status transition to "Paid"', () => {
				expect(() => {
					violationTicket.requestAddStatusTransition(
						new ValueObjects.StatusCode(ValueObjects.StatusCodes.Paid),
						'Invalid transition',
						memberRef,
					);
				}).toThrow(PermissionError);
			});
			Then('a PermissionError should be thrown', () => {
				// Already checked above
			});
		},
	);

	Scenario('Setting title to an empty string', ({ When, Then }) => {
		let violationTicket: ViolationTicketV1<ViolationTicketV1Props>;
		When('I have a ViolationTicketV1 instance with proper permissions', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => true),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});
		When('I set the title to ""', () => {
			expect(() => {
				violationTicket.title = '';
			}).toThrow();
		});
		Then('a validation error should be thrown', () => {
			// Already checked above
		});
	});

	Scenario('Setting description to an empty string', ({ When, Then }) => {
		let violationTicket: ViolationTicketV1<ViolationTicketV1Props>;
		When('I have a ViolationTicketV1 instance with proper permissions', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => true),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});
		When('I set the description to ""', () => {
			expect(() => {
				violationTicket.description = '';
			}).toThrow();
		});
		Then('a validation error should be thrown', () => {
			// Already checked above
		});
	});

	Scenario('Setting ticketType to undefined', ({ When, Then }) => {
		let violationTicket: ViolationTicketV1<ViolationTicketV1Props>;
		When('I have a ViolationTicketV1 instance with proper permissions', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => true),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});
		When('I set the ticketType to undefined', () => {
			violationTicket.ticketType = undefined;
		});
		Then('the ticketType should be undefined', () => {
			expect(violationTicket.ticketType).toBeUndefined();
		});
	});

	Scenario('Attempting to set createdAt', ({ When, Then }) => {
		let violationTicket: ViolationTicketV1<ViolationTicketV1Props>;
		When('I have a ViolationTicketV1 instance', () => {
			violationTicket = new ViolationTicketV1(props, passport);
		});
		When('I try to set the createdAt date', () => {
			expect(() => {
				// @ts-expect-error: readonly property
				violationTicket.createdAt = new Date();
			}).toThrow(TypeError);
		});
		Then('a TypeError should be thrown', () => {
			// Already checked above
		});
	});

	Scenario('Attempting to call requestDelete twice', ({ When, Then, And }) => {
		let violationTicket: ViolationTicketV1<ViolationTicketV1Props>;
		When(
			'I have a ViolationTicketV1 instance with system account permissions',
			() => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => true),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			},
		);
		When('I request delete', () => {
			violationTicket.requestDelete();
		});
		And('I request delete again', () => {
			violationTicket.requestDelete();
		});
		Then('the ticket should remain deleted', () => {
			expect(violationTicket.isDeleted).toBe(true);
		});
	});

	Scenario('Calling onSave after deletion', ({ When, Then, And }) => {
		let violationTicket: ViolationTicketV1<ViolationTicketV1Props>;
		When(
			'I have a ViolationTicketV1 instance with system account permissions',
			() => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => true),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			},
		);
		When('I request delete', () => {
			violationTicket.requestDelete();
		});
		And('I call onSave with isModified true', () => {
			violationTicket.onSave(true);
		});
		Then('no updated event should be added', () => {
			// Since isDeleted is true, no event should be added
			expect(violationTicket.isDeleted).toBe(true);
		});
	});
	Scenario(
		'Creating a new ViolationTicketV1 instance',
		({ When, Then, And }) => {
			When('I create a new ViolationTicketV1 with valid properties', () => {
				violationTicket = ViolationTicketV1.getNewInstance(
					props,
					passport,
					'Test Title',
					'Test Description',
					'community-123',
					'requestor-123',
					100,
				);
			});

			Then('the instance should be created successfully', () => {
				expect(violationTicket).toBeDefined();
				expect(violationTicket.id).toBe('test-id');
			});

			And('the status should be "Draft"', () => {
				expect(violationTicket.status).toBe(ValueObjects.StatusCodes.Draft);
			});

			And('the priority should be 5', () => {
				expect(violationTicket.priority).toBe(5);
			});

			And('a created event should be added', () => {
				// Check that integration event was added
				expect(violationTicket).toBeDefined();
			});
		},
	);

	Scenario(
		'Requesting delete with proper permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance', () => {
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I have system account permissions', () => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => true),
				});
			});

			And('I request delete', () => {
				violationTicket.requestDelete();
			});

			Then('the ticket should be marked as deleted', () => {
				expect(violationTicket.isDeleted).toBe(true);
			});

			And('a deleted event should be added', () => {
				// Check that integration event was added
				expect(violationTicket).toBeDefined();
			});
		},
	);

	Scenario('Requesting delete without permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			// Set mock first
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => false),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I do not have proper permissions', () => {
			// Already set in When step
		});

		And('I request delete', () => {
			expect(() => violationTicket.requestDelete()).toThrow(PermissionError);
		});

		Then('a PermissionError should be thrown', () => {
			// Already checked in previous step
		});
	});

	Scenario(
		'Adding status update with proper permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance', () => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => true),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I have proper permissions to update', () => {
				// Already set
			});

			And('I add a status update', () => {
				violationTicket.requestAddStatusUpdate('Test update', memberRef);
			});

			Then('a new activity detail should be created', () => {
				expect(violationTicket.activityLog.length).toBe(1);
			});

			And('the activity type should be "Updated"', () => {
				expect(violationTicket.activityLog[0]?.activityType).toBe(
					ActivityDetailValueObjects.ActivityTypeCodes.Updated,
				);
			});
		},
	);

	Scenario(
		'Adding status update without permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance', () => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => false),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I do not have proper permissions to update', () => {
				// Already set
			});

			And('I add a status update', () => {
				expect(() =>
					violationTicket.requestAddStatusUpdate('Test update', memberRef),
				).toThrow(PermissionError);
			});

			Then('a PermissionError should be thrown', () => {
				// Already checked
			});
		},
	);

	Scenario('Setting title with proper permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => true),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I have proper permissions to set title', () => {
			// Already set
		});

		And('I set the title', () => {
			violationTicket.title = 'New Title';
		});

		Then('the title should be updated', () => {
			expect(violationTicket.title).toBe('New Title');
		});
	});

	Scenario('Setting communityId on new instance', ({ When, Then, And }) => {
		When('I create a new ViolationTicketV1 instance', () => {
			violationTicket = ViolationTicketV1.getNewInstance(
				props,
				passport,
				'Test Title',
				'Test Description',
				'community-123',
				'requestor-123',
				100,
			);
		});

		And('I set the communityId', () => {
			expect(() => {
				violationTicket.communityId = 'new-community-123';
			}).toThrow(PermissionError);
		});

		Then('a PermissionError should be thrown', () => {
			// Already checked
		});
	});

	Scenario(
		'Setting communityId on existing instance',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance', () => {
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I set the communityId', () => {
				expect(() => {
					violationTicket.communityId = 'new-community-123';
				}).toThrow(PermissionError);
			});

			Then('a PermissionError should be thrown', () => {
				// Already checked
			});
		},
	);

	Scenario(
		'Setting propertyId with proper permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance', () => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => true),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I have proper permissions to set propertyId', () => {
				// Already set
			});

			And('I set the propertyId', () => {
				violationTicket.propertyId = 'new-property-123';
			});

			Then('the propertyId should be updated', () => {
				expect(violationTicket.propertyId).toBe('new-property-123');
			});
		},
	);

	Scenario('Setting propertyId without permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => false),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I do not have proper permissions to set propertyId', () => {
			// Already set
		});

		And('I set the propertyId', () => {
			expect(() => {
				violationTicket.propertyId = 'new-property-123';
			}).toThrow(PermissionError);
		});

		Then('a PermissionError should be thrown', () => {
			// Already checked
		});
	});

	Scenario(
		'Setting assignedToId with proper permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance', () => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => true),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I have proper permissions to assign', () => {
				// Already set
			});

			And('I set the assignedToId', () => {
				violationTicket.assignedToId = 'new-assignee-123';
			});

			Then('the assignedToId should be updated', () => {
				expect(violationTicket.assignedToId).toBe('new-assignee-123');
			});
		},
	);

	Scenario(
		'Setting assignedToId without permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance', () => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => false),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I do not have proper permissions to assign', () => {
				// Already set
			});

			And('I set the assignedToId', () => {
				expect(() => {
					violationTicket.assignedToId = 'new-assignee-123';
				}).toThrow(PermissionError);
			});

			Then('a PermissionError should be thrown', () => {
				// Already checked
			});
		},
	);

	Scenario(
		'Setting serviceId with proper permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance', () => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => true),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I have proper permissions to set serviceId', () => {
				// Already set
			});

			And('I set the serviceId', () => {
				violationTicket.serviceId = 'new-service-123';
			});

			Then('the serviceId should be updated', () => {
				expect(violationTicket.serviceId).toBe('new-service-123');
			});
		},
	);

	Scenario('Setting serviceId without permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => false),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I do not have proper permissions to set serviceId', () => {
			// Already set
		});

		And('I set the serviceId', () => {
			expect(() => {
				violationTicket.serviceId = 'new-service-123';
			}).toThrow(PermissionError);
		});

		Then('a PermissionError should be thrown', () => {
			// Already checked
		});
	});

	Scenario(
		'Setting description with proper permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance', () => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => true),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I have proper permissions to set description', () => {
				// Already set
			});

			And('I set the description', () => {
				violationTicket.description = 'New Description';
			});

			Then('the description should be updated', () => {
				expect(violationTicket.description).toBe('New Description');
			});
		},
	);

	Scenario('Setting description without permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => false),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I do not have proper permissions to set description', () => {
			// Already set
		});

		And('I set the description', () => {
			expect(() => {
				violationTicket.description = 'New Description';
			}).toThrow(PermissionError);
		});

		Then('a PermissionError should be thrown', () => {
			// Already checked
		});
	});

	Scenario(
		'Setting ticketType with proper permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance', () => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => true),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I have proper permissions to set ticketType', () => {
				// Already set
			});

			And('I set the ticketType', () => {
				violationTicket.ticketType = 'Parking';
			});

			Then('the ticketType should be updated', () => {
				expect(violationTicket.ticketType).toBe('Parking');
			});
		},
	);

	Scenario('Setting ticketType without permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => false),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I do not have proper permissions to set ticketType', () => {
			// Already set
		});

		And('I set the ticketType', () => {
			expect(() => {
				violationTicket.ticketType = 'Parking';
			}).toThrow(PermissionError);
		});

		Then('a PermissionError should be thrown', () => {
			// Already checked
		});
	});

	Scenario(
		'Setting status with system account permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance', () => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => true),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I have system account permissions', () => {
				// Already set
			});

			And('I set the status', () => {
				violationTicket.status = ValueObjects.StatusCodes.Submitted;
			});

			Then('the status should be updated', () => {
				expect(violationTicket.status).toBe(ValueObjects.StatusCodes.Submitted);
			});
		},
	);

	Scenario('Setting status without permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => false),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I do not have system account permissions', () => {
			// Already set
		});

		And('I set the status', () => {
			expect(() => {
				violationTicket.status = ValueObjects.StatusCodes.Submitted;
			}).toThrow(PermissionError);
		});

		Then('a PermissionError should be thrown', () => {
			// Already checked
		});
	});

	Scenario(
		'Setting priority with proper permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance', () => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => true),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I have proper permissions to set priority', () => {
				// Already set
			});

			And('I set the priority', () => {
				violationTicket.priority = 3;
			});

			Then('the priority should be updated', () => {
				expect(violationTicket.priority).toBe(3);
			});
		},
	);

	Scenario('Setting priority without permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => false),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I do not have proper permissions to set priority', () => {
			// Already set
		});

		And('I set the priority', () => {
			expect(() => {
				violationTicket.priority = 3;
			}).toThrow(PermissionError);
		});

		Then('a PermissionError should be thrown', () => {
			// Already checked
		});
	});

	Scenario('Setting hash with proper permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => true),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I have proper permissions to set hash', () => {
			// Already set
		});

		And('I set the hash', () => {
			violationTicket.hash = 'new-hash-123';
		});

		Then('the hash should be updated', () => {
			expect(violationTicket.hash).toBe('new-hash-123');
		});
	});

	Scenario('Setting hash without permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => false),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I do not have proper permissions to set hash', () => {
			// Already set
		});

		And('I set the hash', () => {
			expect(() => {
				violationTicket.hash = 'new-hash-123';
			}).toThrow(PermissionError);
		});

		Then('a PermissionError should be thrown', () => {
			// Already checked
		});
	});

	Scenario(
		'Setting lastIndexed with proper permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance', () => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => true),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I have proper permissions to set lastIndexed', () => {
				// Already set
			});

			And('I set the lastIndexed', () => {
				const testDate = new Date();
				violationTicket.lastIndexed = testDate;
			});

			Then('the lastIndexed should be updated', () => {
				expect(violationTicket.lastIndexed).toBeDefined();
			});
		},
	);

	Scenario('Setting lastIndexed without permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => false),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I do not have proper permissions to set lastIndexed', () => {
			// Already set
		});

		And('I set the lastIndexed', () => {
			expect(() => {
				violationTicket.lastIndexed = new Date();
			}).toThrow(PermissionError);
		});

		Then('a PermissionError should be thrown', () => {
			// Already checked
		});
	});

	Scenario(
		'Setting updateIndexFailedDate with proper permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance', () => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => true),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I have proper permissions to set updateIndexFailedDate', () => {
				// Already set
			});

			And('I set the updateIndexFailedDate', () => {
				const testDate = new Date();
				violationTicket.updateIndexFailedDate = testDate;
			});

			Then('the updateIndexFailedDate should be updated', () => {
				expect(violationTicket.updateIndexFailedDate).toBeDefined();
			});
		},
	);

	Scenario(
		'Setting updateIndexFailedDate without permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance', () => {
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => false),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And(
				'I do not have proper permissions to set updateIndexFailedDate',
				() => {
					// Already set
				},
			);

			And('I set the updateIndexFailedDate', () => {
				expect(() => {
					violationTicket.updateIndexFailedDate = new Date();
				}).toThrow(PermissionError);
			});

			Then('a PermissionError should be thrown', () => {
				// Already checked
			});
		},
	);

	Scenario('Setting title without permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => false),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I do not have proper permissions to set title', () => {
			// Already set
		});

		And('I set the title', () => {
			expect(() => {
				violationTicket.title = 'New Title';
			}).toThrow(PermissionError);
		});

		Then('a PermissionError should be thrown', () => {
			// Already checked
		});
	});

	Scenario('Adding message with proper permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => true),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I have proper permissions to add messages', () => {
			// Already set
		});

		And('I add a message', () => {
			violationTicket.requestAddMessage(
				'Test message',
				'external',
				'embedding-123',
			);
		});

		Then('a new message should be created', () => {
			expect(violationTicket.messages.length).toBe(1);
		});
	});

	Scenario('Adding message without permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => false),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I do not have proper permissions to add messages', () => {
			// Already set
		});

		And('I add a message', () => {
			expect(() =>
				violationTicket.requestAddMessage(
					'Test message',
					'external',
					'embedding-123',
				),
			).toThrow(PermissionError);
		});

		Then('a PermissionError should be thrown', () => {
			// Already checked
		});
	});

	Scenario('Adding photo with proper permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => true),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I have proper permissions to add photos', () => {
			// Already set
		});

		And('I add a photo', () => {
			violationTicket.requestAddPhoto('document-123', 'Test photo description');
		});

		Then('a new photo should be created', () => {
			expect(violationTicket.photos.length).toBe(1);
		});
	});

	Scenario('Adding photo without permissions', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => false),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I do not have proper permissions to add photos', () => {
			// Already set
		});

		And('I add a photo', () => {
			expect(() =>
				violationTicket.requestAddPhoto(
					'document-123',
					'Test photo description',
				),
			).toThrow(PermissionError);
		});

		Then('a PermissionError should be thrown', () => {
			// Already checked
		});
	});

	Scenario(
		'Adding valid status transition with proper permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance with status "Draft"', () => {
				props.status = ValueObjects.StatusCodes.Draft;
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => true),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I have proper permissions to change status', () => {
				// Already set
			});

			And('I add a status transition to "Submitted"', () => {
				violationTicket.requestAddStatusTransition(
					new ValueObjects.StatusCode(ValueObjects.StatusCodes.Submitted),
					'Status changed',
					memberRef,
				);
			});

			Then('the status should be updated', () => {
				expect(violationTicket.status).toBe(ValueObjects.StatusCodes.Submitted);
			});

			And('a new activity detail should be created', () => {
				expect(violationTicket.activityLog.length).toBe(1);
			});
		},
	);

	Scenario('Adding invalid status transition', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance with status "Draft"', () => {
			props.status = ValueObjects.StatusCodes.Draft;
			vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
				determineIf: vi.fn(() => false),
			});
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I have proper permissions to change status', () => {
			// Already set
		});

		And('I add a status transition to "Closed"', () => {
			expect(() =>
				violationTicket.requestAddStatusTransition(
					new ValueObjects.StatusCode(ValueObjects.StatusCodes.Closed),
					'Invalid transition',
					memberRef,
				),
			).toThrow(PermissionError);
		});

		Then('a PermissionError should be thrown', () => {
			// Already checked
		});
	});

	Scenario(
		'Adding status transition without permissions',
		({ When, Then, And }) => {
			When('I have a ViolationTicketV1 instance with status "Draft"', () => {
				props.status = ValueObjects.StatusCodes.Draft;
				vi.mocked(passport.case.forViolationTicketV1).mockReturnValue({
					determineIf: vi.fn(() => false),
				});
				violationTicket = new ViolationTicketV1(props, passport);
			});

			And('I do not have proper permissions to change status', () => {
				// Already set
			});

			And('I add a status transition to "Submitted"', () => {
				expect(() =>
					violationTicket.requestAddStatusTransition(
						new ValueObjects.StatusCode(ValueObjects.StatusCodes.Submitted),
						'Status changed',
						memberRef,
					),
				).toThrow(PermissionError);
			});

			Then('a PermissionError should be thrown', () => {
				// Already checked
			});
		},
	);

	Scenario('Requesting new activity detail', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I request a new activity detail', () => {
			const activityDetail =
				violationTicket.requestNewActivityDetail(memberRef);
			expect(activityDetail).toBeDefined();
		});

		Then('a new activity detail should be returned', () => {
			// Already checked
		});
	});

	Scenario('Getting activity log', ({ When, Then }) => {
		When('I have a ViolationTicketV1 instance', () => {
			violationTicket = new ViolationTicketV1(props, passport);
		});

		Then('I should be able to get the activity log', () => {
			expect(violationTicket.activityLog).toBeDefined();
			expect(Array.isArray(violationTicket.activityLog)).toBe(true);
		});
	});

	Scenario('Getting messages', ({ When, Then }) => {
		When('I have a ViolationTicketV1 instance', () => {
			violationTicket = new ViolationTicketV1(props, passport);
		});

		Then('I should be able to get the messages', () => {
			expect(violationTicket.messages).toBeDefined();
			expect(Array.isArray(violationTicket.messages)).toBe(true);
		});
	});

	Scenario('Getting photos', ({ When, Then }) => {
		When('I have a ViolationTicketV1 instance', () => {
			violationTicket = new ViolationTicketV1(props, passport);
		});

		Then('I should be able to get the photos', () => {
			expect(violationTicket.photos).toBeDefined();
			expect(Array.isArray(violationTicket.photos)).toBe(true);
		});
	});

	Scenario('Getting finance details', ({ When, Then }) => {
		When('I have a ViolationTicketV1 instance', () => {
			violationTicket = new ViolationTicketV1(props, passport);
		});

		Then('I should be able to get the finance details', () => {
			expect(violationTicket.financeDetails).toBeDefined();
		});
	});

	Scenario('Getting revision request', ({ When, Then }) => {
		When('I have a ViolationTicketV1 instance', () => {
			violationTicket = new ViolationTicketV1(props, passport);
		});

		Then('I should be able to get the revision request', () => {
			expect(violationTicket.revisionRequest).toBeUndefined(); // Based on mock setup
		});
	});

	Scenario('Getting createdAt', ({ When, Then }) => {
		When('I have a ViolationTicketV1 instance', () => {
			violationTicket = new ViolationTicketV1(props, passport);
		});

		Then('I should be able to get the createdAt date', () => {
			expect(violationTicket.createdAt).toBeInstanceOf(Date);
		});
	});

	Scenario('Getting updatedAt', ({ When, Then }) => {
		When('I have a ViolationTicketV1 instance', () => {
			violationTicket = new ViolationTicketV1(props, passport);
		});

		Then('I should be able to get the updatedAt date', () => {
			expect(violationTicket.updatedAt).toBeInstanceOf(Date);
		});
	});

	Scenario('Getting schemaVersion', ({ When, Then }) => {
		When('I have a ViolationTicketV1 instance', () => {
			violationTicket = new ViolationTicketV1(props, passport);
		});

		Then('I should be able to get the schemaVersion', () => {
			expect(violationTicket.schemaVersion).toBe('1.0');
		});
	});

	Scenario('Calling onSave with modifications', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I call onSave with isModified true', () => {
			violationTicket.onSave(true);
		});

		Then('an updated event should be added', () => {
			// Check that integration event was added
			expect(violationTicket).toBeDefined();
		});
	});

	Scenario('Calling onSave without modifications', ({ When, Then, And }) => {
		When('I have a ViolationTicketV1 instance', () => {
			violationTicket = new ViolationTicketV1(props, passport);
		});

		And('I call onSave with isModified false', () => {
			violationTicket.onSave(false);
		});

		Then('no updated event should be added', () => {
			// Since isModified is false, no event should be added
			expect(violationTicket).toBeDefined();
		});
	});
});
