import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();
  searchParams.forEach((v, k) => params.append(k, v));

  const res = await fetch(
    `https://jobsearch.api.jobtechdev.se/search?${params}`,
    { cache: 'no-store' }
  );
  const data = await res.json();
  return Response.json(data);
}
