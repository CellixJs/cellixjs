import type { HttpRequest } from '@azure/functions';

/**
 * Raw IP-related header values available on an Azure Functions HTTP request.
 *
 * @remarks
 * These values are not validated or reconciled. In particular, forwarded headers can be
 * supplied or modified by proxies, so applications must establish which proxy hops they
 * trust before treating any value as the verified client address.
 */
export interface RequestIpHeaders {
	/** The raw `X-Forwarded-For` header, which may contain multiple addresses. */
	readonly forwardedFor: string | undefined;
	/** The `X-Azure-ClientIP` header set by Azure Front Door. */
	readonly azureClientIp: string | undefined;
	/** The `X-Azure-SocketIP` header set by Azure Front Door. */
	readonly azureSocketIp: string | undefined;
	/** The raw `X-Real-IP` header, if supplied by the ingress proxy. */
	readonly realIp: string | undefined;
}

/**
 * Reads common IP-related headers from an Azure Functions HTTP request.
 *
 * @remarks
 * Returns header values as received and does not parse address lists, choose a preferred
 * address, or determine whether a proxy is trusted. This keeps the helper useful across
 * GraphQL, REST, and custom HTTP handlers without implying that a forwarded value is
 * verified.
 *
 * @param request - The request's headers.
 * @returns The raw forwarded, Azure Front Door, and real-IP header values; absent headers are `undefined`.
 *
 * @example
 * ```ts
 * const { forwardedFor, azureClientIp } = getRequestIpHeaders(request);
 * ```
 */
export const getRequestIpHeaders = (request: Pick<HttpRequest, 'headers'>): RequestIpHeaders => ({
	forwardedFor: request.headers.get('x-forwarded-for') ?? undefined,
	azureClientIp: request.headers.get('x-azure-clientip') ?? undefined,
	azureSocketIp: request.headers.get('x-azure-socketip') ?? undefined,
	realIp: request.headers.get('x-real-ip') ?? undefined,
});
