import { supabase } from './supabase';

const OPTIONAL_POSTER_COLUMNS = ['price_poster_url', 'extra_poster_url'];

function stripOptionalPosterColumns(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const next = { ...payload };
  OPTIONAL_POSTER_COLUMNS.forEach((key) => {
    delete next[key];
  });
  return next;
}

function shouldRetryWithoutPosterColumns(error) {
  const msg = String(error?.message || error || '');
  return OPTIONAL_POSTER_COLUMNS.some((col) => msg.includes(col));
}

async function clientUpdateRow(table, id, payload) {
  const { data, error } = await supabase
    .from(table)
    .update(payload || {})
    .eq('id', id)
    .select()
    .maybeSingle();
  if (!error) return { data, error: null };
  if (!shouldRetryWithoutPosterColumns(error)) return { data: null, error };
  const { data: retryData, error: retryError } = await supabase
    .from(table)
    .update(stripOptionalPosterColumns(payload))
    .eq('id', id)
    .select()
    .maybeSingle();
  return { data: retryData, error: retryError };
}

/**
 * 관리자 DB 변경: Vercel /api/admin-db (service role) 우선, 실패 시 anon 클라이언트.
 */
export async function adminDbMutate({ adminSecret, table, action, id, payload }) {
  if (adminSecret) {
    try {
      const res = await fetch('/api/admin-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({ table, action, id, payload }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.data != null) {
        return { data: json.data, error: null, via: 'api' };
      }
      if (
        res.status === 400
        && shouldRetryWithoutPosterColumns(json.error)
        && OPTIONAL_POSTER_COLUMNS.some((key) => Object.prototype.hasOwnProperty.call(payload || {}, key))
      ) {
        const retryRes = await fetch('/api/admin-db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': adminSecret,
          },
          body: JSON.stringify({
            table,
            action,
            id,
            payload: stripOptionalPosterColumns(payload),
          }),
        });
        const retryJson = await retryRes.json().catch(() => ({}));
        if (retryRes.ok && retryJson.data != null) {
          return { data: retryJson.data, error: null, via: 'api' };
        }
      }
      // 로컬 미설정(401/500) · 엔드포인트 없음(404/502) → anon 클라이언트 폴백
      if (![401, 404, 500, 502].includes(res.status)) {
        return {
          data: null,
          error: new Error(json.error || `Admin API failed (${res.status})`),
          via: 'api',
        };
      }
    } catch {
      /* 로컬 Vite만 쓸 때 /api 없음 → anon 폴백 */
    }
  }

  if (!supabase) {
    return {
      data: null,
      error: new Error('Supabase 연결이 없습니다.'),
      via: 'client',
    };
  }

  if (action === 'update') {
    const { data, error } = await clientUpdateRow(table, id, payload);
    if (error) return { data: null, error, via: 'client' };
    if (!data) {
      return {
        data: null,
        error: new Error(
          'DB에 반영되지 않았습니다. Supabase SQL Editor에서 RLS 마이그레이션(instructor / festivals / bootcamps)을 실행해 주세요.',
        ),
        via: 'client',
      };
    }
    return { data, error: null, via: 'client' };
  }

  if (action === 'delete') {
    const { data, error } = await supabase.from(table).delete().eq('id', id).select('id');
    if (error) return { data: null, error, via: 'client' };
    if (!data?.length) {
      return {
        data: null,
        error: new Error(
          '삭제되지 않았습니다. Supabase SQL Editor에서 RLS 마이그레이션(instructor / festivals / bootcamps)을 실행해 주세요.',
        ),
        via: 'client',
      };
    }
    return { data, error: null, via: 'client' };
  }

  return { data: null, error: new Error('Invalid action'), via: 'client' };
}
