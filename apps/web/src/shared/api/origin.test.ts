import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildOriginApiUrl, originRequestHeaders, selfHostedOrigin } from './origin';
import { proxyApiRequest } from './origin-proxy';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe('self-hosted origin', () => {
  it('only accepts an origin and builds a fixed API path', () => {
    process.env.SELF_HOSTED_ORIGIN = 'https://homescope.example.ts.net';
    expect(selfHostedOrigin()).toBe('https://homescope.example.ts.net');
    expect(buildOriginApiUrl(['listings', 'demo-home'], '?limit=8').toString())
      .toBe('https://homescope.example.ts.net/api/v1/listings/demo-home?limit=8');
    expect(() => buildOriginApiUrl(['..', 'metrics'])).toThrow('Invalid API path');
    process.env.SELF_HOSTED_ORIGIN = 'https://user:pass@example.com';
    expect(() => selfHostedOrigin()).toThrow();
  });

  it('keeps the origin secret server-side', () => {
    process.env.ORIGIN_SHARED_SECRET = 'server-only-secret';
    expect(originRequestHeaders('request-123456')).toEqual({
      'X-HomeScope-Origin-Token': 'server-only-secret',
      'X-Request-ID': 'request-123456',
    });
  });
});

describe('API origin proxy', () => {
  it('forwards auth, cookies, body and the origin secret', async () => {
    process.env.SELF_HOSTED_ORIGIN = 'https://homescope.example.ts.net';
    process.env.ORIGIN_SHARED_SECRET = 'server-only-secret';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"data":true}', {
      status: 201,
      headers: { 'content-type': 'application/json', 'set-cookie': 'refresh=rotated; HttpOnly' },
    }));
    const request = new Request('https://frontend.vercel.app/api/v1/auth/login?source=ui', {
      method: 'POST',
      headers: {
        authorization: 'Bearer access-token',
        cookie: 'refresh=old',
        'content-type': 'application/json',
        'x-request-id': 'request-123456',
      },
      body: '{"email":"demo@example.com"}',
    });

    const response = await proxyApiRequest(request, ['auth', 'login']);
    expect(response.status).toBe(201);
    expect(response.headers.get('set-cookie')).toContain('refresh=rotated');
    const [target, init] = fetchMock.mock.calls[0];
    expect(String(target)).toBe('https://homescope.example.ts.net/api/v1/auth/login?source=ui');
    const headers = new Headers(init?.headers);
    expect(headers.get('authorization')).toBe('Bearer access-token');
    expect(headers.get('cookie')).toBe('refresh=old');
    expect(headers.get('x-homescope-origin-token')).toBe('server-only-secret');
    expect(await new Response(init?.body as BodyInit).text()).toBe('{"email":"demo@example.com"}');
  });

  it('returns a stable 503 without exposing the origin', async () => {
    process.env.SELF_HOSTED_ORIGIN = 'https://homescope.example.ts.net';
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.1'));
    const response = await proxyApiRequest(
      new Request('https://frontend.vercel.app/api/v1/health', { headers: { 'x-request-id': 'request-123456' } }),
      ['health'],
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      code: 'ORIGIN_UNAVAILABLE',
      message: 'The HomeScope service is temporarily unavailable.',
      details: {},
      request_id: 'request-123456',
    });
  });
});
