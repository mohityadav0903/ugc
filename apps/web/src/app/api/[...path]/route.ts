import { proxyToServer } from '@/lib/server-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(request: Request, { params }: RouteContext): Promise<Response> {
  const { path } = await params;
  return proxyToServer(request, `/api/${path.join('/')}`);
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
