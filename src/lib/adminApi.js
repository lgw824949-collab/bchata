import { supabase } from './supabase';

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
    const { data, error } = await supabase
      .from(table)
      .update(payload || {})
      .eq('id', id)
      .select()
      .maybeSingle();
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
