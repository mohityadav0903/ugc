const serverOrigin = process.env.UGC_SERVER_ORIGIN ?? 'http://localhost:4000';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.text();

  const upstream = await fetch(`${serverOrigin}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': request.headers.get('Content-Type') ?? 'application/json',
    },
    body,
  });

  if (!upstream.body) {
    return new Response(await upstream.text(), {
      status: upstream.status,
      statusText: upstream.statusText,
    });
  }

  const headers = new Headers();
  for (const key of ['content-type', 'x-vercel-ai-data-stream']) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }
  headers.set('Cache-Control', 'no-cache, no-transform');
  headers.set('Connection', 'keep-alive');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
