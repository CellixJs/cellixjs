import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { ValueObject } from './value-object.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/value-object.feature')
);

interface TestValueObjectProps {
  foo: string;
  bar: number;
}

class TestValueObject extends ValueObject<TestValueObjectProps> {
  get foo() {
    return this.props.foo;
  }
  get bar() {
    return this.props.bar;
  }
}

test.for(feature, ({ Scenario }) => {
  let props: TestValueObjectProps;
  let valueObject: TestValueObject;

  Scenario('Constructing a Value Object', ({ Given, When, Then }) => {
    Given('a set of properties', () => {
      props = { foo: 'hello', bar: 42 };
    });
    When('the value object is constructed', () => {
      valueObject = new TestValueObject(props);
    });
    Then('it should initialize the properties correctly', () => {
      // biome-ignore lint:useLiteralKeys
      expect(valueObject['props']).toEqual(props);
    });
  });

  Scenario('Accessing value object properties', ({ Given, When, Then }) => {
    Given('a value object with specific properties', () => {
      props = { foo: 'world', bar: 99 };
      valueObject = new TestValueObject(props);
    });
    When('I access the properties', () => {
      // Access happens in the Then step
    });
    Then('I should get the correct values', () => {
      expect(valueObject.foo).toBe('world');
      expect(valueObject.bar).toBe(99);
    });
  });
});
