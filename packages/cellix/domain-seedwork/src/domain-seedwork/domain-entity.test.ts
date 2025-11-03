import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { DomainEntity, type DomainEntityProps, PermissionError } from './domain-entity.ts';


const test = { for: describeFeature };
interface TestEntityProps extends DomainEntityProps {
  foo?: string;
}

class TestEntity extends DomainEntity<TestEntityProps> {
  get foo() {
    return this.props.foo;
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/domain-entity.feature')
);

test.for(feature, ({ Scenario }) => {
  let props: TestEntityProps;
  let entity: TestEntity;
  let error: Error | undefined;

  Scenario('Constructing a Domain Entity', ({ Given, When, Then }) => {
    Given('a set of initial properties', () => {
      props = { id: 'entity-1', foo: 'bar' };
    });
    When('the domain entity is constructed', () => {
      entity = new TestEntity(props);
    });
    Then('it should initialize the properties correctly', () => {
      expect(entity.props).toEqual(props);
      expect(entity.id).toBe(props.id);
      expect(entity.foo).toBe(props.foo);
    });
  });

  Scenario('Accessing the id property', ({ Given, When, Then }) => {
    Given('a domain entity with a specific id', () => {
      props = { id: 'entity-42', foo: 'bar' };
      entity = new TestEntity(props);
    });
    When('the id property is accessed', () => {
      // nothing to do, just access
    });
    Then('it should return the correct id', () => {
      expect(entity.id).toBe('entity-42');
    });
  });

  Scenario('Throwing a Permission Error', ({ When, Then }) => {
    When('a permission error is thrown with a message', () => {
      try {
        throw new PermissionError('Not allowed');
      } catch (e) {
        error = e as Error;
      }
    });
    Then('it should be an instance of Error with the correct name and message', () => {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PermissionError);
      expect(error?.name).toBe('PermissionError');
      expect(error?.message).toBe('Not allowed');
    });
  });
});