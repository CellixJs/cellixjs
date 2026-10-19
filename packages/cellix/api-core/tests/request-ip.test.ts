import type { HttpRequest } from '@azure/functions';
import { getAzureFrontDoorClientIp } from '@cellix/api-core';
import { describe, expect, it } from 'vitest';

const requestWith = (headers: Record<string, string>) => ({ headers: new Headers(headers) }) as HttpRequest;

describe('getAzureFrontDoorClientIp', () => {
	it('returns the IPv4 or IPv6 address set by Azure Front Door', () => {
		expect(getAzureFrontDoorClientIp(requestWith({ 'x-azure-clientip': ' 198.51.100.42 ' }))).toBe('198.51.100.42');
		expect(getAzureFrontDoorClientIp(requestWith({ 'x-azure-clientip': '2001:db8::1' }))).toBe('2001:db8::1');
	});

	it('ignores other forwarding headers', () => {
		expect(getAzureFrontDoorClientIp(requestWith({ 'x-forwarded-for': '203.0.113.10', 'x-real-ip': '203.0.113.10' }))).toBeUndefined();
	});

	it('returns undefined for missing, list, or non-IP values', () => {
		expect(getAzureFrontDoorClientIp(requestWith({}))).toBeUndefined();
		expect(getAzureFrontDoorClientIp(requestWith({ 'x-azure-clientip': '198.51.100.42, 10.0.0.1' }))).toBeUndefined();
		expect(getAzureFrontDoorClientIp(requestWith({ 'x-azure-clientip': 'not-an-ip' }))).toBeUndefined();
	});
});
