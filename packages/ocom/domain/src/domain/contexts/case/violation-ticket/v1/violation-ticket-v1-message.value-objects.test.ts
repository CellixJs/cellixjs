import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './violation-ticket-v1-message.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/violation-ticket-v1-message.value-objects.feature'),
);

test.for(feature, ({ Scenario }) => {
  // SentBy
  Scenario('Creating a sent by with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a sent by with "external"', () => {
      value = new ValueObjects.SentBy('external').valueOf();
    });
    Then('the value should be "external"', () => {
      expect(value).toBe('external');
    });
  });

  Scenario('Creating a sent by with invalid value', ({ When, Then }) => {
    let createSentByWithInvalidValue: () => void;
    When('I try to create a sent by with "invalid"', () => {
      createSentByWithInvalidValue = () => {
        new ValueObjects.SentBy('invalid');
      };
    });
    Then('an error should be thrown indicating the sent by is invalid', () => {
      expect(createSentByWithInvalidValue).toThrow('Value not found in set');
    });
  });

  Scenario('Creating a sent by with null', ({ When, Then }) => {
    let createSentByWithNull: () => void;
    When('I try to create a sent by with null', () => {
      createSentByWithNull = () => {
        // @ts-expect-error Testing invalid input
        new ValueObjects.SentBy(null);
      };
    });
    Then('an error should be thrown indicating the sent by is invalid', () => {
      expect(createSentByWithNull).toThrow('Wrong raw value type');
    });
  });

  Scenario('Creating a sent by with undefined', ({ When, Then }) => {
    let createSentByWithUndefined: () => void;
    When('I try to create a sent by with undefined', () => {
      createSentByWithUndefined = () => {
        // @ts-expect-error Testing invalid input
        new ValueObjects.SentBy(undefined);
      };
    });
    Then('an error should be thrown indicating the sent by is invalid', () => {
      expect(createSentByWithUndefined).toThrow('Wrong raw value type');
    });
  });

  // Message
  Scenario('Creating a message with valid value', ({ When, Then }) => {
    let value: string;
    When('I create a message with "Valid message"', () => {
      value = new ValueObjects.Message('Valid message').valueOf();
    });
    Then('the value should be "Valid message"', () => {
      expect(value).toBe('Valid message');
    });
  });

  Scenario('Creating a message with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create a message with "  Valid message  "', () => {
      value = new ValueObjects.Message('  Valid message  ').valueOf();
    });
    Then('the value should be "Valid message"', () => {
      expect(value).toBe('Valid message');
    });
  });

  Scenario('Creating a message with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create a message with a string of 2000 characters', () => {
      const longMessage = 'a'.repeat(2000);
      value = new ValueObjects.Message(longMessage).valueOf();
    });
    Then('the value should be the 2000 character string', () => {
      expect(value).toBe('a'.repeat(2000));
    });
  });

  Scenario('Creating a message with more than maximum allowed length', ({ When, Then }) => {
    let createMessageAboveMaxLength: () => void;
    When('I try to create a message with a string of 2001 characters', () => {
      createMessageAboveMaxLength = () => {
        new ValueObjects.Message('a'.repeat(2001));
      };
    });
    Then('an error should be thrown indicating the message is too long', () => {
      expect(createMessageAboveMaxLength).toThrow('Too long');
    });
  });

  Scenario('Creating a message with null', ({ When, Then }) => {
    let createMessageWithNull: () => void;
    When('I try to create a message with null', () => {
      createMessageWithNull = () => {
        // @ts-expect-error Testing invalid input
        new ValueObjects.Message(null);
      };
    });
    Then('an error should be thrown indicating the message is invalid', () => {
      expect(createMessageWithNull).toThrow('Wrong raw value type');
    });
  });

  Scenario('Creating a message with undefined', ({ When, Then }) => {
    let createMessageWithUndefined: () => void;
    When('I try to create a message with undefined', () => {
      createMessageWithUndefined = () => {
        // @ts-expect-error Testing invalid input
        new ValueObjects.Message(undefined);
      };
    });
    Then('an error should be thrown indicating the message is invalid', () => {
      expect(createMessageWithUndefined).toThrow('Wrong raw value type');
    });
  });

  // Embedding
  Scenario('Creating an embedding with valid value', ({ When, Then }) => {
    let value: string;
    When('I create an embedding with "Valid embedding"', () => {
      value = new ValueObjects.Embedding('Valid embedding').valueOf();
    });
    Then('the value should be "Valid embedding"', () => {
      expect(value).toBe('Valid embedding');
    });
  });

  Scenario('Creating an embedding with leading and trailing whitespace', ({ When, Then }) => {
    let value: string;
    When('I create an embedding with "  Valid embedding  "', () => {
      value = new ValueObjects.Embedding('  Valid embedding  ').valueOf();
    });
    Then('the value should be "Valid embedding"', () => {
      expect(value).toBe('Valid embedding');
    });
  });

  Scenario('Creating an embedding with maximum allowed length', ({ When, Then }) => {
    let value: string;
    When('I create an embedding with a string of 2000 characters', () => {
      const longEmbedding = 'a'.repeat(2000);
      value = new ValueObjects.Embedding(longEmbedding).valueOf();
    });
    Then('the value should be the 2000 character string', () => {
      expect(value).toBe('a'.repeat(2000));
    });
  });

  Scenario('Creating an embedding with more than maximum allowed length', ({ When, Then }) => {
    let createEmbeddingAboveMaxLength: () => void;
    When('I try to create an embedding with a string of 2001 characters', () => {
      createEmbeddingAboveMaxLength = () => {
        new ValueObjects.Embedding('a'.repeat(2001));
      };
    });
    Then('an error should be thrown indicating the embedding is too long', () => {
      expect(createEmbeddingAboveMaxLength).toThrow('Too long');
    });
  });

  Scenario('Creating an embedding with null', ({ When, Then }) => {
    let createEmbeddingWithNull: () => void;
    When('I try to create an embedding with null', () => {
      createEmbeddingWithNull = () => {
        // @ts-expect-error Testing invalid input
        new ValueObjects.Embedding(null);
      };
    });
    Then('an error should be thrown indicating the embedding is invalid', () => {
      expect(createEmbeddingWithNull).toThrow('Wrong raw value type');
    });
  });

  Scenario('Creating an embedding with undefined', ({ When, Then }) => {
    let createEmbeddingWithUndefined: () => void;
    When('I try to create an embedding with undefined', () => {
      createEmbeddingWithUndefined = () => {
        // @ts-expect-error Testing invalid input
        new ValueObjects.Embedding(undefined);
      };
    });
    Then('an error should be thrown indicating the embedding is invalid', () => {
      expect(createEmbeddingWithUndefined).toThrow('Wrong raw value type');
    });
  });
});