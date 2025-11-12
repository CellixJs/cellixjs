import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import { ViolationTicketV1Photo, type ViolationTicketV1PhotoProps } from './violation-ticket-v1-photo.ts';
import type { ViolationTicketV1Visa } from './violation-ticket-v1.visa.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/violation-ticket-v1-photo.feature'),
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let photo: ViolationTicketV1Photo;
  let props: ViolationTicketV1PhotoProps;
  let visa: ViolationTicketV1Visa;
  let results: string[];

  BeforeEachScenario(() => {
    visa = {
      determineIf: vi.fn(() => true)
    } as unknown as ViolationTicketV1Visa;

    props = {
      id: 'photo-123',
      documentId: 'doc-123',
      description: 'Test photo'
    };
  });

  Scenario('Creating a new ViolationTicketV1Photo instance', ({ When, Then, And }) => {
    When('I create a new ViolationTicketV1Photo with valid properties', () => {
      photo = new ViolationTicketV1Photo(props, visa);
    });

    Then('the instance should be created successfully', () => {
      expect(photo).toBeDefined();
      expect(photo.id).toBe('photo-123');
    });

    And('the document ID should be set correctly', () => {
      expect(photo.documentId).toBe('doc-123');
    });

    And('the description should be set correctly', () => {
      expect(photo.description).toBe('Test photo');
    });
  });

  Scenario('Setting document ID with proper permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1Photo instance', () => {
      photo = new ViolationTicketV1Photo(props, visa);
    });

    And('I have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set the document ID', () => {
      photo.documentId = 'doc-456';
    });

    Then('the document ID should be updated', () => {
      expect(photo.documentId).toBe('doc-456');
    });
  });

  Scenario('Setting document ID without permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1Photo instance', () => {
      photo = new ViolationTicketV1Photo(props, visa);
    });

    And('I do not have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(false);
    });

    And('I set the document ID', () => {
      expect(() => {
        photo.documentId = 'doc-456';
      }).toThrow(DomainSeedwork.PermissionError);
    });

    Then('a PermissionError should be thrown', () => {
      // Already checked
    });
  });

  Scenario('Setting description with proper permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1Photo instance', () => {
      photo = new ViolationTicketV1Photo(props, visa);
    });

    And('I have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(true);
    });

    And('I set the description', () => {
      photo.description = 'Updated description';
    });

    Then('the description should be updated', () => {
      expect(photo.description).toBe('Updated description');
    });
  });

  Scenario('Setting description without permissions', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1Photo instance', () => {
      photo = new ViolationTicketV1Photo(props, visa);
    });

    And('I do not have proper permissions to modify', () => {
      vi.mocked(visa.determineIf).mockReturnValue(false);
    });

    And('I set the description', () => {
      expect(() => {
        photo.description = 'Updated description';
      }).toThrow(DomainSeedwork.PermissionError);
    });

    Then('a PermissionError should be thrown', () => {
      // Already checked
    });
  });

  Scenario('Getting new document ID', ({ When, Then, And }) => {
    When('I have a ViolationTicketV1Photo instance', () => {
      photo = new ViolationTicketV1Photo(props, visa);
    });

    And('I call getNewDocumentId', () => {
      const result = photo.getNewDocumentId();
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.startsWith('photo-')).toBe(true);
    });

    Then('it should return a new document ID', () => {
      // Already checked
    });
  });

  Scenario('Getting new document ID generates unique values', ({ When, Then, And }) => {
    When('I call getNewDocumentId multiple times', () => {
      photo = new ViolationTicketV1Photo(props, visa);
      results = [];
      for (let i = 0; i < 10; i++) {
        results.push(photo.getNewDocumentId());
      }
    });

    Then('each result should be unique', () => {
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(results.length);
    });

    And('each should match the expected format', () => {
      const regex = /^photo-\d+-[a-f0-9]{9}$/;
      results.forEach((result: string) => {
        expect(result).toMatch(regex);
      });
    });
  });
});