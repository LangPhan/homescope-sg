const LOCAL_ORIGIN = "http://localhost:8080";

function parseOrigin(value: string): URL {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('SELF_HOSTED_ORIGIN must be an HTTP(S) origin without credentials');
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SELF_HOSTED_ORIGIN must not include a path, query, or fragment');
  }
  return url;
}

export function selfHostedOrigin(): string {
  const configured = process.env.SELF_HOSTED_ORIGIN?.trim();
  return parseOrigin(configured || LOCAL_ORIGIN).origin;
}

export function originRequestHeaders(requestId?: string): HeadersInit {
  const secret = process.env.ORIGIN_SHARED_SECRET?.trim();
  return {
    ...(secret ? { 'X-HomeScope-Origin-Token': secret } : {}),
    ...(requestId ? { 'X-Request-ID': requestId } : {}),
  };
}

export function serverApiBaseUrl(): string {
  return process.env.API_INTERNAL_URL?.replace(/\/$/, '') || `${selfHostedOrigin()}/api/v1`;
}

export function buildOriginApiUrl(path: readonly string[], search = ''): URL {
  if (path.length === 0 || path.some((segment) => !segment || segment === '.' || segment === '..' || !/^[a-zA-Z0-9._~-]+$/.test(segment))) {
    throw new Error('Invalid API path');
  }
  const encodedPath = path.map(encodeURIComponent).join('/');
  return new URL(`/api/v1/${encodedPath}${search}`, selfHostedOrigin());
}
