import type { HttpRequest } from '@azure/functions';
import { getRequestIpHeaders } from '@cellix/api-core';
import { describe, expect, it } from 'vitest';

describe('getRequestIpHeaders', () => {
	it('returns IP-related headers without interpreting forwarded values', () => {
		const request = {
			headers: new Headers({
				'x-azure-clientip': '198.51.100.42',
				'x-azure-socketip': '203.0.113.7',
				'x-forwarded-for': '198.51.100.42, 10.0.0.7',
				'x-real-ip': '198.51.100.42',
			}),
		} as HttpRequest;

		expect(getRequestIpHeaders(request)).toEqual({
			forwardedFor: '198.51.100.42, 10.0.0.7',
			azureClientIp: '198.51.100.42',
			azureSocketIp: '203.0.113.7',
			realIp: '198.51.100.42',
		});
	});

	it('returns undefined for headers that are not present', () => {
		const request = { headers: new Headers() } as HttpRequest;

		expect(getRequestIpHeaders(request)).toEqual({
			forwardedFor: undefined,
			azureClientIp: undefined,
			azureSocketIp: undefined,
			realIp: undefined,
		});
	});
});
