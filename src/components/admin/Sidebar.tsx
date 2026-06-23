import type { useState } from 'react';
import type { Globe, CheckCircle2, RefreshCw, LogOut, BarChart2, Bell, Loader2 } from 'lucide-react';
import type { CalendarEvent, BookingLink } from '../../types/index';

interface SidebarProps {
  events: CalendarEvent[];
  links: BookingLink[];
  gcConnected: boolean;
  gcLastSynced?: string;
  onGcConnect: () => void;
  onGcDisconnect: () => void;
  onGcSync: () => Promise<void>;
}

export default function Sidebar({ events, links, gcConnected, gcLastSynced, onGcConnect, onGcDisconnect, onGcSync }: SidebarProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await onGcSync();
    setSyncing(false);
  };

  const pending = events.filter(e => e.status === 'pending');
  const totalBookings = links.reduce((s, l) => s + l.bookingCount, 0);

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col gap-3">
      {/* Google Calendar */}
      <div className={`rounded-xl border p-3.5 ${gcConnected ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${gcConnected ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
            <Globe className={`w-3.5 h-3.5 ${gcConnected ? 'text-emerald-600' : 'text-slate-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
              Googleカレンダー
              {gcConnected && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </div>
            <div className="text-[10px] text-slate-400">
              {gcConnected ? (gcLastSynced ? `同期: ${gcLastSynced}` : '接続中') : '未接続'}
            </div>
          </div>
          {gcConnected && (
            <div className="flex gap-0.5">
              <button onClick={handleSync} disabled={syncing} className="p-1 hover:bg-white rounded transition-colors" title="今すぐ同期">
                {syncing
                  ? <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                  : <RefreshCw className="w-3 h-3 text-slate-400" />}
              </button>
              <button onClick={onGcDisconnect} className="p-1 hover:bg-red-50 rounded transition-colors" title="連携を解除">
                <LogOut className="w-3 h-3 text-slate-300 hover:text-red-400" />
              </button>
            </div>
          )}
        </div>
        {!gcConnected ? (
          <a href="/api/auth/google"
            className="block w-full text-center text-xs font-semibold py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
            Googleで連携する
          </a>
        ) : (
          <p className="text-[10px] text-emerald-600 text-center">
            ✓ カレンダーと同期中
          </p>
        )}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-700">承認待ち {pending.length}件</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {pending.map(e => (
              <div key={e.id} className="text-[11px] text-amber-700 bg-white/70 rounded-lg px-2.5 py-1.5 leading-snug">
                <div className="font-semibold truncate">{e.requesterName}</div>
                <div className="opacity-70 truncate">{e.requesterOrg}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">概要</span>
        </div>
        {[
          { label: '予定（全体）', value: events.filter(e => e.status !== 'cancelled').length + '件' },
          { label: '承認待ち', value: pending.length + '件', warn: pending.length > 0 },
          { label: '有効な予約リンク', value: links.filter(l => l.isActive).length + '件' },
          { label: '予約合計', value: totalBookings + '件' },
        ].map(({ label, value, warn }) => (
          <div key={label} className="flex justify-between items-center py-1.5 text-xs border-b border-slate-50 last:border-0">
            <span className="text-slate-500">{label}</span>
            <span className={`font-bold ${warn ? 'text-amber-600' : 'text-slate-800'}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Guide */}
      <div className="rounded-xl bg-slate-900 p-3.5 text-white">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">使い方</div>
        {['「予約リンク」で空き枠を設定', 'URLをコピーして相手に送信', '予約が入ったらカレンダーで承認'].map((s, i) => (
          <div key={i} className="flex gap-2 items-start mb-2 last:mb-0">
            <span className="w-4 h-4 rounded bg-slate-700 text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-slate-300">{i+1}</span>
            <span className="text-[11px] text-slate-400 leading-snug">{s}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
