export declare const queueRegistry: {
    readonly producer: import("@cellix/service-queue-storage").QueueProducerContext<{
        emailNotifications: {
            queueName: string;
            schema: import("zod").ZodObject<{
                to: import("zod").ZodString;
                subject: import("zod").ZodString;
                body: import("zod").ZodString;
            }, "strip", import("zod").ZodTypeAny, {
                to: string;
                subject: string;
                body: string;
            }, {
                to: string;
                subject: string;
                body: string;
            }>;
            loggingTags: {
                domain: string;
                type: string;
            };
        };
        auditEvents: {
            queueName: string;
            schema: import("zod").ZodObject<{
                action: import("zod").ZodString;
                userId: import("zod").ZodString;
                timestamp: import("zod").ZodString;
                metadata: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodString>>;
            }, "strip", import("zod").ZodTypeAny, {
                action: string;
                userId: string;
                timestamp: string;
                metadata?: Record<string, string> | undefined;
            }, {
                action: string;
                userId: string;
                timestamp: string;
                metadata?: Record<string, string> | undefined;
            }>;
            loggingTags: {
                domain: string;
                type: string;
            };
        };
    }>;
    readonly consumer: import("@cellix/service-queue-storage").QueueConsumerContext<{
        importRequests: {
            queueName: string;
            schema: import("zod").ZodObject<{
                importId: import("zod").ZodString;
                requestedBy: import("zod").ZodString;
                fileUrl: import("zod").ZodString;
            }, "strip", import("zod").ZodTypeAny, {
                importId: string;
                requestedBy: string;
                fileUrl: string;
            }, {
                importId: string;
                requestedBy: string;
                fileUrl: string;
            }>;
            loggingTags: {
                domain: string;
                type: string;
            };
        };
    }>;
    readonly _bind: (service: import("@cellix/service-queue-storage").ServiceQueueStorage) => {
        producer: import("@cellix/service-queue-storage").QueueProducerContext<{
            emailNotifications: {
                queueName: string;
                schema: import("zod").ZodObject<{
                    to: import("zod").ZodString;
                    subject: import("zod").ZodString;
                    body: import("zod").ZodString;
                }, "strip", import("zod").ZodTypeAny, {
                    to: string;
                    subject: string;
                    body: string;
                }, {
                    to: string;
                    subject: string;
                    body: string;
                }>;
                loggingTags: {
                    domain: string;
                    type: string;
                };
            };
            auditEvents: {
                queueName: string;
                schema: import("zod").ZodObject<{
                    action: import("zod").ZodString;
                    userId: import("zod").ZodString;
                    timestamp: import("zod").ZodString;
                    metadata: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodString>>;
                }, "strip", import("zod").ZodTypeAny, {
                    action: string;
                    userId: string;
                    timestamp: string;
                    metadata?: Record<string, string> | undefined;
                }, {
                    action: string;
                    userId: string;
                    timestamp: string;
                    metadata?: Record<string, string> | undefined;
                }>;
                loggingTags: {
                    domain: string;
                    type: string;
                };
            };
        }>;
        consumer: import("@cellix/service-queue-storage").QueueConsumerContext<{
            importRequests: {
                queueName: string;
                schema: import("zod").ZodObject<{
                    importId: import("zod").ZodString;
                    requestedBy: import("zod").ZodString;
                    fileUrl: import("zod").ZodString;
                }, "strip", import("zod").ZodTypeAny, {
                    importId: string;
                    requestedBy: string;
                    fileUrl: string;
                }, {
                    importId: string;
                    requestedBy: string;
                    fileUrl: string;
                }>;
                loggingTags: {
                    domain: string;
                    type: string;
                };
            };
        }>;
    };
};
export type AppQueueProducerContext = typeof queueRegistry.producer;
export type AppQueueConsumerContext = typeof queueRegistry.consumer;
