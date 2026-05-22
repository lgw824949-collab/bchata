export const config = {
  runtime: 'edge',
};

const SITE_ORIGIN = 'https://bchata.vercel.app';
const SUPABASE_URL = 'https://biwziyyklaycbjrnitem.supabase.co';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function redirectHomeHtml() {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${SITE_ORIGIN}" />
</head>
<body>잠시 후 이동합니다...</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function formatOgDescription(dateStr, locationName) {
  const date = String(dateStr || '').slice(0, 10);
  const place = String(locationName || '').trim();
  if (date && place) return `${date} · ${place}`;
  return date || place || '오늘밤빠';
}

async function fetchParty(partyId, anonKey) {
  const params = new URLSearchParams({
    id: `eq.${partyId}`,
    select: 'id,title,poster_url,date,locations!location_id(name)',
  });
  const url = `${SUPABASE_URL}/rest/v1/parties?${params}`;
  const res = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export default async function handler(request) {
  const partyId = new URL(request.url).searchParams.get('party')?.trim();
  if (!partyId) return redirectHomeHtml();

  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) return redirectHomeHtml();

  let party;
  try {
    party = await fetchParty(partyId, anonKey);
  } catch {
    return redirectHomeHtml();
  }

  if (!party) return redirectHomeHtml();

  const title = escapeHtml(party.title || '오늘밤빠');
  const posterUrl = escapeHtml(party.poster_url || `${SITE_ORIGIN}/Photo/소셜.png`);
  const locationName = party.locations?.name || '';
  const description = escapeHtml(formatOgDescription(party.date, locationName));
  const partyUrl = `${SITE_ORIGIN}/?party=${encodeURIComponent(partyId)}`;
  const safePartyUrl = escapeHtml(partyUrl);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${posterUrl}" />
  <meta property="og:url" content="${safePartyUrl}" />
  <meta http-equiv="refresh" content="0;url=${safePartyUrl}" />
</head>
<body>잠시 후 이동합니다...</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
