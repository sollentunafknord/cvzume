import { NextRequest } from 'next/server';
import * as cheerio from 'cheerio';
import { PROVINCES, DISTRICTS } from './data';

const ISKUR_URL = 'https://esube.iskur.gov.tr/Istihdam/AcikIsIlanAra.aspx';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Connection': 'keep-alive',
};

interface IskurJob {
  id: string;
  title: string;
  employer: string;
  location: string;
  sector: string;
  openings: string;
  deadline: string;
}

async function fetchPageState() {
  const res = await fetch(ISKUR_URL, {
    headers: { ...HEADERS, 'Cache-Control': 'no-cache' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);
  const cookies = res.headers.get('set-cookie') || '';
  return {
    viewState: $('#__VIEWSTATE').val() as string || '',
    viewStateGenerator: $('#__VIEWSTATEGENERATOR').val() as string || '',
    eventValidation: $('#__EVENTVALIDATION').val() as string || '',
    viewStateEncrypted: $('#__VIEWSTATEENCRYPTED').val() as string || '',
    cookies,
  };
}

async function searchJobs(ilValue: string, ilceValue: string): Promise<{ jobs: IskurJob[]; blocked: boolean }> {
  let state;
  try {
    state = await fetchPageState();
  } catch {
    return { jobs: [], blocked: true };
  }
  if (!state) return { jobs: [], blocked: true };

  const body = new URLSearchParams({
    '__EVENTTARGET': 'ctl04$ctlAcikIsPageCommand$CommandItem_Search',
    '__EVENTARGUMENT': '',
    '__VIEWSTATE': state.viewState,
    '__VIEWSTATEGENERATOR': state.viewStateGenerator,
    '__EVENTVALIDATION': state.eventValidation,
    '__VIEWSTATEENCRYPTED': state.viewStateEncrypted,
    'ctl04$ctlIl': ilValue,
    'ctl04$ctlIlce': ilceValue || '0',
    'ctl04$IsyeriTuruRadios': '1',
    'ctl04$ctlAcikIsPageCommand': '',
  });

  try {
    const res = await fetch(ISKUR_URL, {
      method: 'POST',
      headers: {
        ...HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://esube.iskur.gov.tr',
        'Referer': ISKUR_URL,
        'Cookie': state.cookies,
      },
      body: body.toString(),
      cache: 'no-store',
    });

    const html = await res.text();
    if (html.includes('reddedildi') || html.includes('Yapilmaya calisilan') || !res.ok) {
      return { jobs: [], blocked: true };
    }

    const $ = cheerio.load(html);
    const jobs: IskurJob[] = [];

    // Find results table — look for rows with enough cells
    $('table tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length < 4) return;
      const title = $(cells[0]).text().trim();
      if (!title || title.length < 3 || /^(pozisyon|iş|ilan|başl)/i.test(title)) return;
      jobs.push({
        id: `iskur_${i}`,
        title,
        employer: $(cells[1]).text().trim(),
        location: $(cells[2]).text().trim(),
        sector: $(cells[3]).text().trim(),
        openings: $(cells[4])?.text().trim() || '',
        deadline: $(cells[5])?.text().trim() || '',
      });
    });

    return { jobs: jobs.slice(0, 50), blocked: false };
  } catch {
    return { jobs: [], blocked: true };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const il = searchParams.get('il') || '';
  const ilce = searchParams.get('ilce') || '';

  if (action === 'provinces') {
    return Response.json({ provinces: PROVINCES });
  }

  if (action === 'districts') {
    const districts = DISTRICTS[il] || [];
    return Response.json({ districts });
  }

  if (action === 'search' && il) {
    const result = await searchJobs(il, ilce);
    const fallbackUrl = ISKUR_URL;
    return Response.json({ ...result, fallbackUrl });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
