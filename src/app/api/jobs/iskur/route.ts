import { NextRequest } from 'next/server';
import * as cheerio from 'cheerio';

const ISKUR_URL = 'https://esube.iskur.gov.tr/Istihdam/AcikIsIlanAra.aspx';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
};

interface PageState {
  viewState: string;
  viewStateGenerator: string;
  eventValidation: string;
  viewStateEncrypted: string;
  cookies: string;
}

interface IskurJob {
  id: string;
  title: string;
  employer: string;
  location: string;
  sector: string;
  openings: string;
  deadline: string;
  url?: string;
}

async function fetchPageState(): Promise<PageState | null> {
  try {
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
  } catch {
    return null;
  }
}

async function getProvinces(): Promise<{ value: string; label: string }[]> {
  try {
    const res = await fetch(ISKUR_URL, {
      headers: { ...HEADERS, 'Cache-Control': 'no-cache' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const provinces: { value: string; label: string }[] = [];
    $('select[name="ctl04$ctlIl"] option').each((_, el) => {
      const val = $(el).attr('value') || '';
      const label = $(el).text().trim();
      if (val && val !== '0' && val !== '') {
        provinces.push({ value: val, label });
      }
    });
    return provinces;
  } catch {
    return [];
  }
}

async function getDistricts(ilValue: string): Promise<{ value: string; label: string }[]> {
  const state = await fetchPageState();
  if (!state) return [];

  const body = new URLSearchParams({
    '__EVENTTARGET': 'ctl04$ctlIl',
    '__EVENTARGUMENT': '',
    '__VIEWSTATE': state.viewState,
    '__VIEWSTATEGENERATOR': state.viewStateGenerator,
    '__EVENTVALIDATION': state.eventValidation,
    '__VIEWSTATEENCRYPTED': state.viewStateEncrypted,
    'ctl04$ctlIl': ilValue,
    'ctl04$ctlIlce': '0',
    'ctl04$IsyeriTuruRadios': '1',
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
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const districts: { value: string; label: string }[] = [];
    $('select[name="ctl04$ctlIlce"] option').each((_, el) => {
      const val = $(el).attr('value') || '';
      const label = $(el).text().trim();
      if (val && val !== '0') {
        districts.push({ value: val, label });
      }
    });
    return districts;
  } catch {
    return [];
  }
}

async function searchJobs(ilValue: string, ilceValue: string): Promise<{ jobs: IskurJob[]; blocked: boolean; fallbackUrl: string }> {
  const state = await fetchPageState();
  const fallbackUrl = ISKUR_URL;

  if (!state) return { jobs: [], blocked: true, fallbackUrl };

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

    // WAF block detection
    if (html.includes('reddedildi') || html.includes('Yapilmaya calisilan') || !res.ok) {
      return { jobs: [], blocked: true, fallbackUrl };
    }

    const $ = cheerio.load(html);
    const jobs: IskurJob[] = [];

    // Try to parse the results table
    const table = $('table').filter((_, el) => {
      return $(el).find('tr').length > 1;
    }).first();

    if (table.length) {
      table.find('tr').each((i, row) => {
        if (i === 0) return; // skip header
        const cells = $(row).find('td');
        if (cells.length < 4) return;
        const title = $(cells[0]).text().trim();
        if (!title) return;
        jobs.push({
          id: `iskur_${i}_${Date.now()}`,
          title,
          employer: $(cells[1]).text().trim(),
          location: $(cells[2]).text().trim(),
          sector: $(cells[3]).text().trim(),
          openings: $(cells[4])?.text().trim() || '',
          deadline: $(cells[5])?.text().trim() || '',
        });
      });
    }

    // If no structured table found, try alternate selectors
    if (jobs.length === 0) {
      // Generic row detection
      $('tr').each((i, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 4) {
          const title = $(cells[0]).text().trim();
          if (title && title.length > 2 && !title.match(/^\d+$/)) {
            jobs.push({
              id: `iskur_${i}_${Date.now()}`,
              title,
              employer: $(cells[1]).text().trim(),
              location: $(cells[2]).text().trim(),
              sector: $(cells[3]).text().trim(),
              openings: $(cells[4])?.text().trim() || '',
              deadline: $(cells[5])?.text().trim() || '',
            });
          }
        }
      });
    }

    return { jobs: jobs.slice(0, 50), blocked: false, fallbackUrl };
  } catch {
    return { jobs: [], blocked: true, fallbackUrl };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const il = searchParams.get('il') || '';
  const ilce = searchParams.get('ilce') || '';

  if (action === 'provinces') {
    const provinces = await getProvinces();
    return Response.json({ provinces });
  }

  if (action === 'districts' && il) {
    const districts = await getDistricts(il);
    return Response.json({ districts });
  }

  if (action === 'search' && il) {
    const result = await searchJobs(il, ilce);
    return Response.json(result);
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
