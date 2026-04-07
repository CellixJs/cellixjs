import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './member-invitation.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/member-invitation.value-objects.feature'));

test.for(feature, ({ Scenario }) => {
	// InvitationEmail
	Scenario('Creating a valid invitation email', ({ When, Then }) => {
		let value: string;
		When('I create an InvitationEmail with "alice@example.com"', () => {
			value = new ValueObjects.InvitationEmail('alice@example.com').valueOf();
		});
		Then('the value should be "alice@example.com"', () => {
			expect(value).toBe('alice@example.com');
		});
	});

	Scenario('Creating an invitation email normalizes to lowercase', ({ When, Then }) => {
		let email: ValueObjects.InvitationEmail;
		When('I create an InvitationEmail with "Alice@Example.COM"', () => {
			email = new ValueObjects.InvitationEmail('Alice@Example.COM');
		});
		Then('the normalizedValue should be "alice@example.com"', () => {
			expect(email.normalizedValue).toBe('alice@example.com');
		});
	});

	Scenario('Creating an invitation email with maximum allowed length', ({ When, Then }) => {
		let create: () => void;
		When('I create an InvitationEmail with a valid 254-character email address', () => {
			// 246 chars local + @ + 3 chars domain + . + 3 chars tld = 254
			const local = 'a'.repeat(246);
			create = () => new ValueObjects.InvitationEmail(`${local}@b.com`);
		});
		Then('the email should be created successfully', () => {
			expect(create).not.toThrow();
		});
	});

	Scenario('Creating an invitation email that exceeds maximum length', ({ When, Then }) => {
		let create: () => void;
		When('I try to create an InvitationEmail with a string longer than 254 characters', () => {
			create = () => new ValueObjects.InvitationEmail(`${'a'.repeat(250)}@b.com`);
		});
		Then('an error should be thrown', () => {
			expect(create).toThrow();
		});
	});

	Scenario('Creating an invitation email with invalid format', ({ When, Then }) => {
		let create: () => void;
		When('I try to create an InvitationEmail with "not-an-email"', () => {
			create = () => new ValueObjects.InvitationEmail('not-an-email');
		});
		Then('an error should be thrown indicating invalid email format', () => {
			expect(create).toThrow('Invalid email format');
		});
	});

	Scenario('Creating an invitation email with empty string', ({ When, Then }) => {
		let create: () => void;
		When('I try to create an InvitationEmail with an empty string', () => {
			create = () => new ValueObjects.InvitationEmail('');
		});
		Then('an error should be thrown', () => {
			expect(create).toThrow();
		});
	});

	// InvitationMessage
	Scenario('Creating a valid invitation message', ({ When, Then }) => {
		let value: string;
		When('I create an InvitationMessage with "Welcome to our community!"', () => {
			value = new ValueObjects.InvitationMessage('Welcome to our community!').valueOf();
		});
		Then('the value should be "Welcome to our community!"', () => {
			expect(value).toBe('Welcome to our community!');
		});
	});

	Scenario('Creating an invitation message with empty string', ({ When, Then }) => {
		let value: string;
		When('I create an InvitationMessage with an empty string', () => {
			value = new ValueObjects.InvitationMessage('').valueOf();
		});
		Then('the message value should be empty', () => {
			expect(value).toBe('');
		});
	});

	Scenario('Creating an invitation message with maximum allowed length', ({ When, Then }) => {
		let create: () => void;
		When('I create an InvitationMessage with a string of 1000 characters', () => {
			create = () => new ValueObjects.InvitationMessage('a'.repeat(1000));
		});
		Then('the message should be created successfully', () => {
			expect(create).not.toThrow();
		});
	});

	Scenario('Creating an invitation message exceeding maximum length', ({ When, Then }) => {
		let create: () => void;
		When('I try to create an InvitationMessage with a string of 1001 characters', () => {
			create = () => new ValueObjects.InvitationMessage('a'.repeat(1001));
		});
		Then('an error should be thrown', () => {
			expect(create).toThrow();
		});
	});

	Scenario('Creating an invitation message trims whitespace', ({ When, Then }) => {
		let value: string;
		When('I create an InvitationMessage with "  hello  "', () => {
			value = new ValueObjects.InvitationMessage('  hello  ').valueOf();
		});
		Then('the value should be "hello"', () => {
			expect(value).toBe('hello');
		});
	});

	// InvitationStatus
	Scenario('Creating a PENDING status', ({ When, Then, And }) => {
		let status: ValueObjects.InvitationStatus;
		When('I create an InvitationStatus with "PENDING"', () => {
			status = new ValueObjects.InvitationStatus('PENDING');
		});
		Then('the value should be "PENDING"', () => {
			expect(status.valueOf()).toBe('PENDING');
		});
		And('isPending should be true', () => {
			expect(status.isPending).toBe(true);
		});
		And('isActive should be true', () => {
			expect(status.isActive).toBe(true);
		});
	});

	Scenario('Creating a SENT status', ({ When, Then, And }) => {
		let status: ValueObjects.InvitationStatus;
		When('I create an InvitationStatus with "SENT"', () => {
			status = new ValueObjects.InvitationStatus('SENT');
		});
		Then('the value should be "SENT"', () => {
			expect(status.valueOf()).toBe('SENT');
		});
		And('isSent should be true', () => {
			expect(status.isSent).toBe(true);
		});
		And('isActive should be true', () => {
			expect(status.isActive).toBe(true);
		});
	});

	Scenario('Creating an ACCEPTED status', ({ When, Then, And }) => {
		let status: ValueObjects.InvitationStatus;
		When('I create an InvitationStatus with "ACCEPTED"', () => {
			status = new ValueObjects.InvitationStatus('ACCEPTED');
		});
		Then('the value should be "ACCEPTED"', () => {
			expect(status.valueOf()).toBe('ACCEPTED');
		});
		And('isAccepted should be true', () => {
			expect(status.isAccepted).toBe(true);
		});
		And('isActive should be false', () => {
			expect(status.isActive).toBe(false);
		});
	});

	Scenario('Creating a REJECTED status', ({ When, Then, And }) => {
		let status: ValueObjects.InvitationStatus;
		When('I create an InvitationStatus with "REJECTED"', () => {
			status = new ValueObjects.InvitationStatus('REJECTED');
		});
		Then('the value should be "REJECTED"', () => {
			expect(status.valueOf()).toBe('REJECTED');
		});
		And('isRejected should be true', () => {
			expect(status.isRejected).toBe(true);
		});
		And('isActive should be false', () => {
			expect(status.isActive).toBe(false);
		});
	});

	Scenario('Creating an EXPIRED status', ({ When, Then, And }) => {
		let status: ValueObjects.InvitationStatus;
		When('I create an InvitationStatus with "EXPIRED"', () => {
			status = new ValueObjects.InvitationStatus('EXPIRED');
		});
		Then('the value should be "EXPIRED"', () => {
			expect(status.valueOf()).toBe('EXPIRED');
		});
		And('isExpired should be true', () => {
			expect(status.isExpired).toBe(true);
		});
		And('isActive should be false', () => {
			expect(status.isActive).toBe(false);
		});
	});

	Scenario('Creating a status with lowercase input normalizes to uppercase', ({ When, Then }) => {
		let value: string;
		When('I create an InvitationStatus with "pending"', () => {
			value = new ValueObjects.InvitationStatus('pending').valueOf();
		});
		Then('the value should be "PENDING"', () => {
			expect(value).toBe('PENDING');
		});
	});

	Scenario('Creating a status with invalid value', ({ When, Then }) => {
		let create: () => void;
		When('I try to create an InvitationStatus with "INVALID_STATUS"', () => {
			create = () => new ValueObjects.InvitationStatus('INVALID_STATUS');
		});
		Then('an error should be thrown indicating invalid status', () => {
			expect(create).toThrow('Invalid invitation status');
		});
	});

	// InvitationExpiresAt
	Scenario('Creating an expiration date in the future', ({ When, Then }) => {
		let create: () => void;
		When('I create an InvitationExpiresAt with a date 7 days from now', () => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 7);
			create = () => new ValueObjects.InvitationExpiresAt(futureDate);
		});
		Then('the expiration date should be created successfully', () => {
			expect(create).not.toThrow();
		});
	});

	Scenario('Creating an expiration date in the past', ({ When, Then }) => {
		let create: () => void;
		When('I try to create an InvitationExpiresAt with a date in the past', () => {
			const pastDate = new Date();
			pastDate.setDate(pastDate.getDate() - 1);
			create = () => new ValueObjects.InvitationExpiresAt(pastDate);
		});
		Then('an error should be thrown indicating the date must be in the future', () => {
			expect(create).toThrow('must be in the future');
		});
	});

	Scenario('Checking isExpired on a future date', ({ When, Then }) => {
		let expiresAt: ValueObjects.InvitationExpiresAt;
		When('I create an InvitationExpiresAt with a date 7 days from now', () => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 7);
			expiresAt = new ValueObjects.InvitationExpiresAt(futureDate);
		});
		Then('isExpired should be false', () => {
			expect(expiresAt.isExpired).toBe(false);
		});
	});

	Scenario('Getting daysUntilExpiration for a future date', ({ When, Then }) => {
		let expiresAt: ValueObjects.InvitationExpiresAt;
		When('I create an InvitationExpiresAt with a date exactly 7 days from now', () => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 7);
			expiresAt = new ValueObjects.InvitationExpiresAt(futureDate);
		});
		Then('daysUntilExpiration should be 7', () => {
			expect(expiresAt.daysUntilExpiration).toBe(7);
		});
	});
});
