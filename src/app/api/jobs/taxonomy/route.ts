import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();
  searchParams.forEach((v, k) => params.append(k, v));

  const res = await fetch(
    `https://taxonomy.api.jobtechdev.se/v1/taxonomy/main?${params}`,
    { next: { revalidate: 3600 } }
  );
  const data = await res.json();
  return Response.json(data);
}
