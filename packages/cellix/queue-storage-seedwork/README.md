# @cellix/queue-storage-seedwork

Foundational types and base classes for Azure Queue Storage integration with built-in schema validation and blob logging.

## Features

- **Type-safe queue operations** with generics
- **Automatic JSON schema validation** using AJV
- **Built-in blob logging** for all sent/received messages
- **OpenTelemetry tracing** integration
- **Base classes** for extending with domain-specific queue implementations

## Architecture

### Message Envelope

Every message sent or received follows a standardized envelope format:

```typescript
interface QueueMessageEnvelope<TPayload> {
	messageId: string;
	timestamp: string;
	correlationId?: string;
	queueName: string;
	direction: 'inbound' | 'outbound';
	payload: TPayload;
	metadata?: Record<string, string>;
}
```

### Blob Logging

All messages are automatically logged to Azure Blob Storage:

- **Outbound messages**: `queue-messages/outbound/{timestamp}.json`
- **Inbound messages**: `queue-messages/inbound/{timestamp}.json`

Each blob includes metadata and tags for:
- Queue name
- Message direction
- Message ID
- Custom metadata/tags (configurable per queue)

## Usage

### Creating a Queue Sender

```typescript
import { BaseQueueSender, MessageLogger, SchemaValidator, type QueueConfig } from '@cellix/queue-storage-seedwork';
import type { JSONSchemaType } from 'ajv';

// Define your payload type
interface MyPayload {
	id: string;
	name: string;
	value: number;
}

// Define the JSON schema
const payloadSchema: JSONSchemaType<MyPayload> = {
	type: 'object',
	properties: {
		id: { type: 'string' },
		name: { type: 'string' },
		value: { type: 'number' },
	},
	required: ['id', 'name', 'value'],
	additionalProperties: false,
};

// Create the queue configuration
const queueConfig: QueueConfig<MyPayload> = {
	queueName: 'my-queue',
	direction: 'outbound',
	payloadSchema,
	blobLogging: {
		metadata: { source: 'my-service' },
		tags: { environment: 'production' },
	},
};

// Create dependencies
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const messageLogger = new MessageLogger({ connectionString });
const schemaValidator = new SchemaValidator();

// Create the sender
class MyQueueSender extends BaseQueueSender<MyPayload> {
	constructor() {
		super(
			{ connectionString, messageLogger, schemaValidator },
			queueConfig,
		);
	}
}

// Use it
const sender = new MyQueueSender();
await sender.ensureQueue();

const result = await sender.sendMessage(
	{ id: '123', name: 'Test', value: 42 },
	'correlation-id-123',
	{ customField: 'customValue' },
);
```

### Creating a Queue Receiver

```typescript
import { BaseQueueReceiver, MessageLogger, SchemaValidator, type QueueConfig } from '@cellix/queue-storage-seedwork';

// Create the receiver with the same payload type and schema
class MyQueueReceiver extends BaseQueueReceiver<MyPayload> {
	constructor() {
		super(
			{ connectionString, messageLogger, schemaValidator },
			{
				queueName: 'my-queue',
				direction: 'inbound',
				payloadSchema,
			},
		);
	}
}

// Use it
const receiver = new MyQueueReceiver();
await receiver.ensureQueue();

const messages = await receiver.receiveMessages({ maxMessages: 10 });

for (const { message, messageId, popReceipt } of messages) {
	try {
		// Process the message
		console.log('Processing:', message.payload);
		
		// Delete the message when done
		await receiver.deleteMessage(messageId, popReceipt);
	} catch (error) {
		console.error('Processing failed:', error);
		// Optionally update visibility timeout to retry later
	}
}
```

## Local Development with Azurite

For local development, use the Azurite emulator for Azure Storage:

```bash
# Install Azurite
npm install -g azurite

# Start Azurite
azurite --silent --location ./azurite --debug ./azurite/debug.log

# Use the default connection string
export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;"
```

## API Reference

### Types

- **`QueueMessageEnvelope<TPayload>`**: Standard message envelope
- **`QueueConfig<TPayload>`**: Queue configuration including schema
- **`SendMessageResult`**: Result of sending a message
- **`ReceiveMessageResult<TPayload>`**: Result of receiving a message
- **`MessageValidationError`**: Thrown when schema validation fails
- **`BlobLoggingError`**: Thrown when blob logging fails

### Classes

- **`BaseQueueSender<TPayload>`**: Base class for queue senders
- **`BaseQueueReceiver<TPayload>`**: Base class for queue receivers
- **`MessageLogger`**: Handles blob storage logging
- **`SchemaValidator`**: Validates payloads against JSON schemas

## Dependencies

- `@azure/storage-queue`: Azure Queue Storage client
- `@azure/storage-blob`: Azure Blob Storage client (for logging)
- `@opentelemetry/api`: OpenTelemetry tracing
- `ajv`: JSON schema validator

## License

Private - Part of the Cellix framework
