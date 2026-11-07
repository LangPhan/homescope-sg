import { afterEach, describe, expect, it, vi } from 'vitest';
import { proxyAiGateway, shouldProxyAiGateway } from './gateway-proxy';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe('AI gateway proxy', () => {
  it('preserves the SSE stream and authorization headers', async () => {
    process.env.AI_GATEWAY_URL = 'https://homescope.example.ts.net/api/ai/chat';
    process.env.ORIGIN_SHARED_SECRET = 'server-only-secret';
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"type":"RUN_STARTED"}\n\n'));
        controller.close();
      },
    });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(stream, {
      headers: { 'content-type': 'text/event-stream', 'x-ai-cache': 'MISS' },
    }));
    const request = new Request('https://frontend.vercel.app/api/ai/chat', {
      method: 'POST',
      headers: {
        authorization: 'Bearer access-token',
        'content-type': 'application/json',
        'x-request-id': 'request-123456',
      },
      body: '{"messages":[]}',
    });

    expect(shouldProxyAiGateway()).toBe(true);
    const response = await proxyAiGateway(request);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(response.headers.get('x-accel-buffering')).toBe('no');
    expect(await response.text()).toContain('RUN_STARTED');
    const [target, init] = fetchMock.mock.calls[0];
    expect(String(target)).toBe('https://homescope.example.ts.net/api/ai/chat');
    const headers = new Headers(init?.headers);
    expect(headers.get('authorization')).toBe('Bearer access-token');
    expect(headers.get('x-homescope-origin-token')).toBe('server-only-secret');
  });

  it('fails closed for an arbitrary gateway path', async () => {
    process.env.AI_GATEWAY_URL = 'https://evil.example/collect';
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const response = await proxyAiGateway(new Request('https://frontend.vercel.app/api/ai/chat', {
      method: 'POST', body: '{}', headers: { 'x-request-id': 'request-123456' },
    }));
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
