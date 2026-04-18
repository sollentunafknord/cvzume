import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || '';
  const limit = searchParams.get('limit') || '500';

  const res = await fetch(
    `https://taxonomy.api.jobtechdev.se/v1/taxonomy/main/concepts?type=${type}&limit=${limit}`,
    { next: { revalidate: 3600 } }
  );
  const raw: { 'taxonomy/id': string; 'taxonomy/preferred-label': string }[] = await res.json();

  const data = (raw || []).map(x => ({
    id: x['taxonomy/id'],
    preferred_label: x['taxonomy/preferred-label'],
  }));

  return Response.json({ data });
}
