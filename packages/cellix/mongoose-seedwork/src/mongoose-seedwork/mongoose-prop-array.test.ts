import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { Types } from 'mongoose';
import { expect, vi } from 'vitest';
import type { Base } from './base.ts';
import type { MongooseDomainAdapter } from './mongo-domain-adapter.ts';
import { MongoosePropArray } from './mongoose-prop-array.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/mongoose-prop-array.feature')
);

interface TestDoc extends Base {
  _id: Types.ObjectId;
  foo: string;
}

class TestAdapter implements MongooseDomainAdapter<TestDoc> {
  public readonly doc: TestDoc;
  public readonly props: TestDoc;
  constructor(doc: TestDoc) {
    this.doc = doc;
    this.props = doc;
  }
  get id() { return this.doc._id.toString(); }
  get createdAt() { return this.doc.createdAt; }
  get updatedAt() { return this.doc.updatedAt; }
  get schemaVersion() { return this.doc.schemaVersion; }
}

test.for(feature, ({ Scenario }) => {
  let docArray: TestDoc[];
  let propArray: MongoosePropArray<TestDoc, TestAdapter>;
  let doc1: TestDoc;
  let doc2: TestDoc;
  let adapter1: TestAdapter;
  let adapter2: TestAdapter;

  Scenario('Adding an item to the array', ({ Given, When, Then }) => {
    Given('a mongoose prop array with a document array and an adapter', () => {
      docArray = [];
      doc1 = vi.mocked({
        _id: new Types.ObjectId(),
        foo: 'bar',
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 'v1',
        version: 1,
        id: new Types.ObjectId(),
      } as TestDoc);
      // @ts-expect-error: for test, treat as DocumentArray
      propArray = new MongoosePropArray(docArray, TestAdapter);
      adapter1 = new TestAdapter(doc1);
    });
    When('addItem is called with a domain adapter instance', () => {
      adapter2 = propArray.addItem(adapter1);
    });
    Then('it should push the document to the array and return a new adapter for the added document', () => {
      expect(docArray.length).toBe(1);
      expect(docArray[0]).toBe(doc1);
      expect(adapter2).toBeInstanceOf(TestAdapter);
      expect(adapter2.doc).toBe(doc1);
    });
  });

  Scenario('Removing an item from the array', ({ Given, When, Then }) => {
    Given('a mongoose prop array with a document array containing an item', () => {
      doc1 = vi.mocked({
        _id: new Types.ObjectId(),
        foo: 'bar',
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 'v1',
        version: 1,
        id: new Types.ObjectId(),
      } as TestDoc);
      docArray = [doc1];
      // @ts-expect-error: for test, treat as DocumentArray
      propArray = new MongoosePropArray(docArray, TestAdapter);
      adapter1 = new TestAdapter(doc1);
      // Patch pull to remove by _id
      // @ts-expect-error
      // biome-ignore lint:useLiteralKeys
      propArray['docArray'].pull = (query: { _id: Types.ObjectId }) => {
        const idx = docArray.findIndex(d => d._id.equals(query._id));
        if (idx !== -1) { docArray.splice(idx, 1); }
      };
    });
    When('removeItem is called with the domain adapter instance', () => {
      propArray.removeItem(adapter1);
    });
    Then('it should remove the document from the array', () => {
      expect(docArray.length).toBe(0);
    });
  });

  Scenario('Removing all items from the array', ({ Given, When, Then }) => {
    Given('a mongoose prop array with a document array containing multiple items', () => {
      doc1 = vi.mocked({
        _id: new Types.ObjectId(),
        foo: 'bar1',
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 'v1',
        version: 1,
        id: new Types.ObjectId(),
      } as TestDoc);
      doc2 = vi.mocked({
        _id: new Types.ObjectId(),
        foo: 'bar2',
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 'v1',
        version: 1,
        id: new Types.ObjectId(),
      } as TestDoc);
      docArray = [doc1, doc2];
      // @ts-expect-error: for test, treat as DocumentArray
      propArray = new MongoosePropArray(docArray, TestAdapter);
      // Patch pull to remove by _id
      // @ts-expect-error
      // biome-ignore lint:useLiteralKeys
      propArray['docArray'].pull = (query: { _id: Types.ObjectId }) => {
        let index = docArray.findIndex(d => d._id.equals(query._id));
        while ((index) !== -1) {
          docArray.splice(index, 1);
          index = docArray.findIndex(d => d._id.equals(query._id));
        }
      };
    });
    When('removeAll is called', () => {
      propArray.removeAll();
    });
    Then('it should remove all documents from the array', () => {
      expect(docArray.length).toBe(0);
    });
  });

  Scenario('Creating and adding a new item', ({ Given, When, Then }) => {
    Given('a mongoose prop array with a document array and an adapter', () => {
      docArray = [];
      // @ts-expect-error: for test, treat as DocumentArray
      propArray = new MongoosePropArray(docArray, TestAdapter);
      // Patch create to make a new doc
      // @ts-expect-error
      // biome-ignore lint:useLiteralKeys
      propArray['docArray'].create = (doc: Partial<TestDoc>) => {
        return vi.mocked({
          _id: doc._id as Types.ObjectId,
          foo: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          schemaVersion: 'v1',
          version: 1,
          id: new Types.ObjectId(),
        } as TestDoc);
      };
    });
    When('getNewItem is called', () => {
      adapter1 = propArray.getNewItem();
    });
    Then('it should create a new document, add it to the array, and return a new adapter for the new document', () => {
      expect(docArray.length).toBe(1);
      expect(adapter1).toBeInstanceOf(TestAdapter);
      expect(docArray[0]).toBe(adapter1.doc);
    });
  });

  Scenario('Accessing items returns all items as adapters', ({ Given, When, Then }) => {
    Given('a mongoose prop array with a document array containing multiple documents', () => {
      doc1 = vi.mocked({
        _id: new Types.ObjectId(),
        foo: 'bar1',
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 'v1',
        version: 1,
        id: new Types.ObjectId(),
      } as TestDoc);
      doc2 = vi.mocked({
        _id: new Types.ObjectId(),
        foo: 'bar2',
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 'v1',
        version: 1,
        id: new Types.ObjectId(),
      } as TestDoc);
      docArray = [doc1, doc2];
      // @ts-expect-error: for test, treat as DocumentArray
      propArray = new MongoosePropArray(docArray, TestAdapter);
    });
    When('the items property is accessed', () => {
      // Access happens in Then
    });
    Then('it should return an array of adapters for each document', () => {
      const { items } = propArray;
      expect(items.length).toBe(2);
      expect(items[0]).toBeInstanceOf(TestAdapter);
      expect(items[1]).toBeInstanceOf(TestAdapter);
      expect(items[0]?.doc).toBe(doc1);
      expect(items[1]?.doc).toBe(doc2);
    });
  });
});
