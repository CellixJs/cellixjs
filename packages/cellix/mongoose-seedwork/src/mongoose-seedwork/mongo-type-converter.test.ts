import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoTypeConverter } from './mongo-type-converter.ts';
import type { Base } from './base.ts';
import type { MongooseDomainAdapterType } from './mongo-domain-adapter.ts';
import { DomainSeedwork } from '@cellix/domain-seedwork';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/mongo-type-converter.feature')
);

interface TestDoc extends Base {
  foo: string;
}

class TestAdapter implements MongooseDomainAdapterType<TestDoc> {
  readonly doc: TestDoc;
  constructor(doc: TestDoc) {
    this.doc = doc;
  }
  get id() { return this.doc.id.toString(); }
  get createdAt() { return this.doc.createdAt; }
  get updatedAt() { return this.doc.updatedAt; }
  get schemaVersion() { return this.doc.schemaVersion; }
}

class TestDomain extends DomainSeedwork.AggregateRoot<TestAdapter, string> {}

class TestConverter extends MongoTypeConverter<TestDoc, TestAdapter, string, TestDomain> {}

test.for(feature, ({ Scenario }) => {
  let doc: TestDoc;
  let adapter: TestAdapter;
  let domain: TestDomain;
  let converter: TestConverter;
  let passport: string;

  Scenario('Converting a Mongoose model to a domain object', ({ Given, When, Then }) => {
    Given('a Mongoose model instance and a passport', () => {
      doc = vi.mocked({
        id: { toString: () => 'id' },
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 'v1',
        version: 1,
        foo: 'bar',
      } as TestDoc);
      passport = 'my-passport';
      converter = new TestConverter(TestAdapter, TestDomain);
    });
    When('toDomain is called', () => {
      domain = converter.toDomain(doc, passport);
    });
    Then('it should return a domain object constructed with the adapter and passport', () => {
      expect(domain).toBeInstanceOf(TestDomain);
      expect(domain.props).toBeInstanceOf(TestAdapter);
      expect(domain.props.doc).toBe(doc);
      // biome-ignore lint:useLiteralKeys
      expect(domain['passport']).toBe(passport);
    });
  });

  Scenario('Converting a domain object to persistence', ({ Given, When, Then }) => {
    Given('a domain object with a props.doc property', () => {
      doc = vi.mocked({
        id: { toString: () => 'id' },
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 'v2',
        version: 2,
        foo: 'baz',
      } as TestDoc);
      adapter = new TestAdapter(doc);
      domain = new TestDomain(adapter, 'passport');
      converter = new TestConverter(TestAdapter, TestDomain);
    });
    When('toPersistence is called', () => {
      // Access happens in Then
    });
    Then('it should return the doc property from the domain object\'s props', () => {
      expect(converter.toPersistence(domain)).toBe(doc);
    });
  });

  Scenario('Converting a Mongoose model to an adapter', ({ Given, When, Then }) => {
    Given('a Mongoose model instance', () => {
      doc = vi.mocked({
        id: { toString: () => 'id' },
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 'v3',
        version: 3,
        foo: 'adapter',
      } as TestDoc);
      converter = new TestConverter(TestAdapter, TestDomain);
    });
    When('toAdapter is called', () => {
      adapter = converter.toAdapter(doc);
    });
    Then('it should return a new adapter constructed with the Mongoose model', () => {
      expect(adapter).toBeInstanceOf(TestAdapter);
      expect(adapter.doc).toBe(doc);
    });
  });

  Scenario('Converting a domain object to an adapter', ({ Given, When, Then }) => {
    Given('a domain object with a props property', () => {
      doc = vi.mocked({
        id: { toString: () => 'id' },
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 'v4',
        version: 4,
        foo: 'adapter2',
      } as TestDoc);
      adapter = new TestAdapter(doc);
      domain = new TestDomain(adapter, 'passport');
      converter = new TestConverter(TestAdapter, TestDomain);
    });
    When('toAdapter is called', () => {
      // Access happens in Then
    });
    Then('it should return the props property from the domain object', () => {
      expect(converter.toAdapter(domain)).toBe(adapter);
    });
  });
});
