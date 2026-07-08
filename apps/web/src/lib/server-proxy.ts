export function getServerOrigin(): string {
  return process.env.UGC_SERVER_ORIGIN ?? 'http://localhost:4000';
}

export async function proxyToServer(request: Request, targetPath: string): Promise<Response> {
  const url = new URL(request.url);
  const target = `${getServerOrigin()}${targetPath}${url.search}`;

  const headers = new Headers();
  const contentType = request.headers.get('Content-Type');
  if (contentType) headers.set('Content-Type', contentType);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    // @ts-expect-error Bun/Node fetch needs duplex when streaming a request body.
    duplex: hasBody ? 'half' : undefined,
  });

  const responseHeaders = new Headers();
  for (const key of ['content-type', 'content-length', 'cache-control', 'x-vercel-ai-data-stream']) {
    const value = upstream.headers.get(key);
    if (value) responseHeaders.set(key, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
