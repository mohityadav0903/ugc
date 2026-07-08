import { proxyToServer } from '@/lib/server-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, { params }: RouteContext): Promise<Response> {
  const { path } = await params;
  return proxyToServer(request, `/videos/${path.join('/')}`);
}
