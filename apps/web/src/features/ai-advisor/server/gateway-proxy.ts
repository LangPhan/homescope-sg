import { originRequestHeaders } from '@/shared/api/origin';
import { logEvent, requestIdFrom } from '@/shared/observability/logger';

function gatewayUrl(): URL | null {
  const configured = process.env.AI_GATEWAY_URL?.trim();
  if (!configured) return null;
  const url = new URL(configured);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/api/ai/chat') {
    throw new Error('AI_GATEWAY_URL must be an HTTP(S) URL ending in /api/ai/chat');
  }
  return url;
}

export function shouldProxyAiGateway(): boolean {
  return Boolean(process.env.AI_GATEWAY_URL?.trim());
}

export async function proxyAiGateway(request: Request): Promise<Response> {
  const requestId = requestIdFrom(request);
  let target: URL;
  try {
    const configured = gatewayUrl();
    if (!configured) throw new Error('AI_GATEWAY_URL is not configured');
    target = configured;
  } catch {
    return Response.json({
      code: 'AI_GATEWAY_MISCONFIGURED',
      message: 'The AI advisor gateway is not configured.',
      details: {},
      request_id: requestId,
    }, { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Request-ID': requestId } });
  }

  const headers = new Headers(originRequestHeaders(requestId));
  for (const name of ['accept', 'authorization', 'content-type', 'cookie', 'last-event-id'] as const) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      headers,
      body: request.body,
      duplex: 'half',
      cache: 'no-store',
      redirect: 'manual',
      signal: request.signal,
    } as RequestInit & { duplex: 'half' });
    const responseHeaders = new Headers();
    for (const name of ['cache-control', 'content-type', 'retry-after', 'x-ai-cache', 'x-request-id'] as const) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    responseHeaders.set('X-Accel-Buffering', 'no');
    responseHeaders.set('X-Request-ID', responseHeaders.get('x-request-id') || requestId);
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    logEvent('error', 'ai_gateway_proxy_failed', {
      request_id: requestId,
      route: '/api/ai/chat',
      error_name: error instanceof Error ? error.name : 'UnknownError',
    });
    return Response.json({
      code: 'AI_PROVIDER_UNAVAILABLE',
      message: 'The AI advisor is temporarily unavailable. Your chat history is safe; please retry.',
      details: {},
      request_id: requestId,
    }, { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Request-ID': requestId } });
  }
}
