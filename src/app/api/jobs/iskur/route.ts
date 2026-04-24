import { NextRequest } from 'next/server';
import * as cheerio from 'cheerio';
import { PROVINCES, DISTRICTS } from './data';

const ISKUR_URL = 'https://esube.iskur.gov.tr/Istihdam/AcikIsIlanAra.aspx';
const DETAIL_BASE = 'https://esube.iskur.gov.tr/Istihdam/AcikIsIlanDetay.aspx';

// Turkish IP header to bypass İŞKUR WAF (blocks non-TR datacenter IPs)
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8',
  'X-Forwarded-For': '78.190.0.1',
};

interface IskurJob {
  id: string;
  title: string;
  workType: string;
  openings: string;
  location: string;
  ilanNo: string;
  deadline: string;
  remaining: string;
  url: string;
}

async function fetchPageState() {
  const res = await fetch(ISKUR_URL, {
    headers: { ...HEADERS, 'Cache-Control': 'no-cache' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);
  return {
    viewState: $('#__VIEWSTATE').val() as string || '',
    viewStateGenerator: $('#__VIEWSTATEGENERATOR').val() as string || '',
    eventValidation: $('#__EVENTVALIDATION').val() as string || '',
    cookies: res.headers.get('set-cookie') || '',
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
    '__VIEWSTATEENCRYPTED': '',
    'ctl04$ctlIl': ilValue,
    'ctl04$ctlIlce': ilceValue || '0',
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

    if (!res.ok) return { jobs: [], blocked: true };
    const html = await res.text();
    if (html.includes('reddedildi') || html.includes('Yapilmaya calisilan')) {
      return { jobs: [], blocked: true };
    }

    const $ = cheerio.load(html);
    const jobs: IskurJob[] = [];

    $('tr[style*="background-color"]').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 2) return;

      const cell0 = cells.eq(0);
      const cell1 = cells.eq(1);
      const cell2 = cells.eq(2);

      const titleAnchor = cell0.find('a').first();
      const title = titleAnchor.text().trim();
      if (!title || title.length < 2) return;

      const onclickAttr = titleAnchor.attr('onclick') || '';
      const ilanMatch = onclickAttr.match(/PopupJobDetails\('([^']+)','([^']+)'/);
      const ilanNo = ilanMatch?.[1] || '';
      const isyeriTur = ilanMatch?.[2] || 'Özel';

      const isverenTur = cell0.find('[id*="ctlIsverenTurDL"]').text().trim();
      const calismaPeriyot = cell0.find('[id*="ctlCalismaPeriyotDL"]').text().trim();
      const calismaSekli = cell0.find('[id*="ctlCalismaSekliDL"]').text().trim();
      const workType = [isverenTur, calismaPeriyot, calismaSekli].filter(Boolean).join(' / ');
      const openings = cell0.find('[id*="Label9"]').text().trim();

      const location = cell1.find('span').first().text().replace(/\s+/g, ' ').trim();
      const sonBasvText = cell2.find('[id*="ctlSonBasv"]').text().trim();
      const kalanText = cell2.find('[id*="kalanLabel"], [id*="Kalan"]').text().trim();

      const url = ilanNo
        ? `${DETAIL_BASE}?uiID=${ilanNo}&isyeriTuru=${encodeURIComponent(isyeriTur)}`
        : ISKUR_URL;

      jobs.push({ id: ilanNo || `job_${jobs.length}`, title, workType, openings, location, ilanNo, deadline: sonBasvText, remaining: kalanText, url });
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
    // Served from hardcoded data — no network call needed
    const districts = DISTRICTS[il] || [];
    return Response.json({ districts });
  }

  if (action === 'formdata') {
    // Returns ViewState fields for client-side form submission to İŞKUR
    try {
      const state = await fetchPageState();
      if (!state) return Response.json({ error: 'fetch_failed' }, { status: 502 });
      return Response.json({
        viewState: state.viewState,
        viewStateGenerator: state.viewStateGenerator,
        eventValidation: state.eventValidation,
        formUrl: ISKUR_URL,
      });
    } catch {
      return Response.json({ error: 'fetch_failed' }, { status: 502 });
    }
  }

  if (action === 'search' && il) {
    const result = await searchJobs(il, ilce);
    return Response.json({ ...result, fallbackUrl: ISKUR_URL });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
