import { buildOriginApiUrl, originRequestHeaders } from './origin';
import { logEvent, requestIdFrom } from '@/shared/observability/logger';

const forwardedRequestHeaders = ['accept', 'authorization', 'content-type', 'cookie', 'if-none-match'] as const;
const forwardedResponseHeaders = ['cache-control', 'content-disposition', 'content-type', 'etag', 'retry-after', 'vary'] as const;

function errorResponse(requestId: string, status: number, code: string, message: string): Response {
  return Response.json({ code, message, details: {}, request_id: requestId }, {
    status,
    headers: { 'X-Request-ID': requestId, 'Cache-Control': 'no-store' },
  });
}

function responseHeaders(upstream: Response, requestId: string): Headers {
  const headers = new Headers({ 'X-Request-ID': upstream.headers.get('x-request-id') || requestId });
  for (const name of forwardedResponseHeaders) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  const getSetCookie = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const cookies = typeof getSetCookie === 'function' ? getSetCookie.call(upstream.headers) : [];
  if (cookies.length > 0) cookies.forEach((cookie) => headers.append('set-cookie', cookie));
  else if (upstream.headers.get('set-cookie')) headers.set('set-cookie', upstream.headers.get('set-cookie')!);
  return headers;
}

export async function proxyApiRequest(request: Request, path: readonly string[]): Promise<Response> {
  const requestId = requestIdFrom(request);
  let target: URL;
  try {
    target = buildOriginApiUrl(path, new URL(request.url).search);
  } catch {
    return errorResponse(requestId, 400, 'INVALID_API_PATH', 'The API path is invalid.');
  }

  const headers = new Headers(originRequestHeaders(requestId));
  for (const name of forwardedRequestHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      // Required by Node when a streamed request body is forwarded.
      duplex: request.method === 'GET' || request.method === 'HEAD' ? undefined : 'half',
      cache: 'no-store',
      redirect: 'manual',
      signal: request.signal,
    } as RequestInit & { duplex?: 'half' });
    return new Response(request.method === 'HEAD' ? null : upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders(upstream, requestId),
    });
  } catch (error) {
    logEvent('error', 'origin_proxy_failed', {
      request_id: requestId,
      route: `/api/v1/${path.map(() => '{segment}').join('/')}`,
      error_name: error instanceof Error ? error.name : 'UnknownError',
    });
    return errorResponse(requestId, 503, 'ORIGIN_UNAVAILABLE', 'The HomeScope service is temporarily unavailable.');
  }
}
