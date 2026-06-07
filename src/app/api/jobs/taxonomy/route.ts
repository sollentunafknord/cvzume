import { NextRequest } from 'next/server';

const GQL = 'https://taxonomy.api.jobtechdev.se/v1/taxonomy/graphql';

async function gql(query: string) {
  try {
    const res = await fetch(`${GQL}?query=${encodeURIComponent(query)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.concepts || [];
  } catch {
    return [];
  }
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
    // OBS: taxonomins "region"-typ innehåller numera även ~1500 utländska
    // regioner. De 21 svenska länen ligger utspridda i listan, så vi måste
    // hämta med hög limit och filtrera på "län" – annars blir orts-listan tom.
    const items = await gql(`{ concepts(type: "region", limit: 2000) { id preferred_label } }`);
    data = items
      .filter((x: { preferred_label: string }) => x.preferred_label.toLowerCase().endsWith('län'))
      .map((x: { id: string; preferred_label: string }) => ({ id: x.id, preferred_label: x.preferred_label }));
  } else if (type === 'occupation-field') {
    const items = await gql(`{ concepts(type: "occupation-field", limit: 50) { id preferred_label } }`);
    data = items.map((x: { id: string; preferred_label: string }) => ({ id: x.id, preferred_label: x.preferred_label }));
  }

  return Response.json({ data });
}
