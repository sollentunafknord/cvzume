import { NextRequest } from 'next/server';

const GQL = 'https://taxonomy.api.jobtechdev.se/v1/taxonomy/graphql';

async function gql(query: string) {
  const res = await fetch(`${GQL}?query=${encodeURIComponent(query)}`, {
    next: { revalidate: 3600 },
  });
  const json = await res.json();
  return json.data?.concepts || [];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || '';

  let data: { id: string; preferred_label: string; broader_id?: string }[] = [];

  if (type === 'municipality') {
    const items = await gql(`{ concepts(type: "municipality", limit: 400) { id preferred_label broader { id } } }`);
    data = items.map((x: { id: string; preferred_label: string; broader: { id: string }[] }) => ({
      id: x.id,
      preferred_label: x.preferred_label,
      broader_id: x.broader?.[0]?.id || '',
    }));
  } else if (type === 'region') {
    const items = await gql(`{ concepts(type: "region", limit: 30) { id preferred_label } }`);
    data = items.map((x: { id: string; preferred_label: string }) => ({ id: x.id, preferred_label: x.preferred_label }));
  } else if (type === 'occupation-field') {
    const items = await gql(`{ concepts(type: "occupation-field", limit: 50) { id preferred_label } }`);
    data = items.map((x: { id: string; preferred_label: string }) => ({ id: x.id, preferred_label: x.preferred_label }));
  }

  return Response.json({ data });
}
