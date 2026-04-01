import type { Mock } from 'vitest';

export type AsyncHandlerMock<TPayload> = Mock<(payload: TPayload) => Promise<void>>;
