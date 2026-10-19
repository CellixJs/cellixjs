import { isIP } from 'node:net';
import type { HttpRequest } from '@azure/functions';

/** Header Azure Front Door sets to the IP address of the client that opened the connection. */
export const AZURE_FRONT_DOOR_CLIENT_IP_HEADER = 'x-azure-clientip';

/**
 * Reads the client IP address that Azure Front Door forwards on an Azure Functions HTTP request.
 *
 * @remarks
 * Only `X-Azure-ClientIP` is read. The value is trustworthy only when the Function App
 * accepts traffic exclusively from Front Door (access restrictions on the `AzureFrontDoor.Backend`
 * service tag and `X-Azure-FDID`); otherwise any caller can supply the header.
 *
 * @param request - The incoming request.
 * @returns The single IPv4 or IPv6 address in the header, or `undefined` when absent or invalid.
 *
 * @example
 * ```ts
 * const clientIp = getAzureFrontDoorClientIp(request);
 * ```
 */
export const getAzureFrontDoorClientIp = (request: Pick<HttpRequest, 'headers'>): string | undefined => {
	const value = request.headers.get(AZURE_FRONT_DOOR_CLIENT_IP_HEADER)?.trim();
	return value && isIP(value) !== 0 ? value : undefined;
};
