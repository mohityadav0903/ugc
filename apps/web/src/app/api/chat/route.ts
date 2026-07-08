import { proxyToServer } from '@/lib/server-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  const response = await proxyToServer(request, '/api/chat');
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-cache, no-transform');
  headers.set('Connection', 'keep-alive');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
