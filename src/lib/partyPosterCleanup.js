import { supabase } from './supabase';
import { getKSTCalendarTodayStr } from './dateNorm';

const POSTER_BUCKET = 'posters';
const PUBLIC_PREFIX = '/storage/v1/object/public/posters/';

function extractPosterPath(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;
  const idx = raw.indexOf(PUBLIC_PREFIX);
  if (idx < 0) return null;
  const tail = raw.slice(idx + PUBLIC_PREFIX.length);
  const clean = tail.split('?')[0].split('#')[0].replace(/^\/+/, '');
  return clean || null;
}

async function removeStorageObjects(client, paths) {
  if (!paths.length) return;
  const chunks = [];
  for (let i = 0; i < paths.length; i += 100) {
    chunks.push(paths.slice(i, i + 100));
  }
  for (const batch of chunks) {
    try {
      await client.storage.from(POSTER_BUCKET).remove(batch);
    } catch {
      // silent hard-delete attempt
    }
  }
}

async function removePartyRows(client, ids) {
  if (!ids.length) return;
  const chunks = [];
  for (let i = 0; i < ids.length; i += 200) {
    chunks.push(ids.slice(i, i + 200));
  }
  for (const batch of chunks) {
    try {
      await client.from('parties').delete().in('id', batch);
    } catch {
      // silent hard-delete attempt
    }
  }
}

/** 과거(오늘 이전) 파티 포스터/행 데이터 하드 삭제 */
export async function purgePastPartyPostersAndRows(client = supabase) {
  if (!client) return;
  const today = getKSTCalendarTodayStr();
  try {
    const { data, error } = await client
      .from('parties')
      .select('id,date,poster_url')
      .lt('date', today);
    if (error || !Array.isArray(data) || data.length === 0) return;

    const ids = [];
    const storagePaths = [];
    for (const row of data) {
      if (row?.id != null) ids.push(row.id);
      const p = extractPosterPath(row?.poster_url);
      if (p) storagePaths.push(p);
    }
    await removeStorageObjects(client, Array.from(new Set(storagePaths)));
    await removePartyRows(client, ids);
  } catch {
    // no-op by policy
  }
}

