// Googleカレンダー連携のフロント側ユーティリティ

// 接続状態をURLパラメータから確認
export function checkGcConnectionFromURL(): { connected?: boolean; error?: string } {
  const p = new URLSearchParams(window.location.search);
  if (p.get('gc_connected') === '1') return { connected: true };
  if (p.get('gc_error')) return { error: p.get('gc_error') ?? 'unknown' };
  return {};
}

// Googleカレンダーと同期（APIルートを呼ぶ）
export async function syncGoogleCalendar(): Promise<{ synced: number; message: string }> {
  const res = await fetch('/api/calendar/sync');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// OAuth開始（/api/auth/google にリダイレクト）
export function startGoogleOAuth() {
  window.location.href = '/api/auth/google';
}
