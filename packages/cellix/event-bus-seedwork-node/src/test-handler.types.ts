import type { Mock } from 'vitest';

export type AsyncHandlerMock<TPayload> = Mock<(payload: TPayload) => Promise<void>>;
export type SyncHandlerMock<TPayload> = Mock<(payload: TPayload) => void>;
