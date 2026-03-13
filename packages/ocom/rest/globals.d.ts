import type {
	BodyInit as UndiciBodyInit,
	HeadersInit as UndiciHeadersInit,
} from 'undici-types';

declare global {
	type BodyInit = UndiciBodyInit;
	type HeadersInit = UndiciHeadersInit;
}

export {};
