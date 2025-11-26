import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Base } from './base.ts';

import { MongooseDomainAdapter } from './mongo-domain-adapter.ts';

interface TestDoc extends Base {
  schemaVersion: string;
}


function isTestDoc(obj: unknown): obj is TestDoc {
  return (
    typeof obj === 'object' && obj !== null &&
    'id' in obj && 'createdAt' in obj && 'updatedAt' in obj && 'schemaVersion' in obj && 'version' in obj
  );
}



const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/mongo-domain-adapter.feature')
);

test.for(feature, ({ Scenario }) => {
  class TestAdapter extends MongooseDomainAdapter<TestDoc> {}

  let doc: unknown;
  let adapter: TestAdapter;
  Scenario('Constructing a MongooseDomainAdapter', ({ Given, When, Then }) => {
    Given('a Mongoose document with id, createdAt, updatedAt, and schemaVersion', () => {
      const mockObjectId = {
        _bsontype: 'ObjectId' as const,
        id: new Uint8Array(12),
        toHexString: () => 'hex123',
        toJSON: () => 'json123',
        toString: () => 'abc123',
        equals: () => false,
        getTimestamp: () => new Date(),
        inspect: () => 'inspect',
      };
      doc = {
        id: mockObjectId,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
        schemaVersion: 'v1',
        version: 1,
      };
    });
    When('a domain adapter is constructed with the document', () => {
      if (isTestDoc(doc)) {
        adapter = new TestAdapter(doc);
      }
    });
    Then('the doc property should reference the document', () => {
      expect(adapter.doc).toBe(doc);
    });
  });

  Scenario('Accessing id returns string version of document id', ({ Given, When, Then }) => {
    let toStringMock: () => string;
    Given('a domain adapter constructed with a document with an ObjectId', () => {
      toStringMock = vi.fn(() => 'objectid123');
      const mockObjectId = {
        _bsontype: 'ObjectId' as const,
        id: new Uint8Array(12),
        toHexString: () => 'hex123',
        toJSON: () => 'json123',
        toString: toStringMock,
        equals: () => false,
        getTimestamp: () => new Date(),
        inspect: () => 'inspect',
      };
      doc = {
        id: mockObjectId,
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 'v2',
        version: 2,
      };
      if (isTestDoc(doc)) {
        adapter = new TestAdapter(doc);
      }
    });
    When('I access the id property', () => {
      // Access happens in Then
    });
    Then('it should return the string version of the document id', () => {
      expect(adapter.id).toBe('objectid123');
      expect(toStringMock).toHaveBeenCalled();
    });
  });

  Scenario('Accessing createdAt, updatedAt, and schemaVersion', ({ Given, When, Then }) => {
    const created = new Date('2022-01-01T00:00:00Z');
    const updated = new Date('2022-01-02T00:00:00Z');
    Given('a domain adapter constructed with a document with createdAt, updatedAt, and schemaVersion', () => {
      const mockObjectId = {
        _bsontype: 'ObjectId' as const,
        id: new Uint8Array(12),
        toHexString: () => 'hex123',
        toJSON: () => 'json123',
        toString: () => 'id',
        equals: () => false,
        getTimestamp: () => new Date(),
        inspect: () => 'inspect',
      };
      doc = {
        id: mockObjectId,
        createdAt: created,
        updatedAt: updated,
        schemaVersion: 'v3',
        version: 3,
      };
      if (isTestDoc(doc)) {
        adapter = new TestAdapter(doc);
      }
    });
    When('I access the createdAt, updatedAt, and schemaVersion properties', () => {
      // Access happens in Then
    });
    Then('they should return the corresponding values from the document', () => {
      expect(adapter.createdAt).toBe(created);
      expect(adapter.updatedAt).toBe(updated);
      expect(adapter.schemaVersion).toBe('v3');
    });
  });
});
