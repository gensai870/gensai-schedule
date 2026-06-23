import { useState, useEffect } from 'react';
import { CalendarDays, Link2, Plus, ChevronLeft, ChevronRight, Menu, X, Bell, Globe, RefreshCw, LogOut, CheckCircle2, Loader2 } from 'lucide-react';
import type { CalendarEvent, BookingLink, CalendarView, BookingRequest } from './types/index';
import { todayStr, addDays, getWeekDates, MONTHS, generateCancelToken, dateLabel } from './utils/helpers';
import {
  fetchEvents, createEvent, updateEventStatus, cancelEventByToken,
  fetchLinks, createLink, toggleLink, deleteLink,
  submitBookingRequest, fetchLinkById,
} from './lib/db';
import { checkGcConnectionFromURL, syncGoogleCalendar, startGoogleOAuth } from './lib/gcal';
import MonthView from './components/admin/MonthView';
import WeekView from './components/admin/WeekView';
import DayView from './components/admin/DayView';
import EventDetail from './components/admin/EventDetail';
import AddEventDialog from './components/admin/AddEventDialog';
import BookingLinks from './components/admin/BookingLinks';
import Sidebar from './components/admin/Sidebar';
import BookingPage from './components/booking/BookingPage';

type Tab = 'calendar' | 'links';

export default function App() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [links, setLinks] = useState<BookingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('calendar');
  const [view, setView] = useState<CalendarView>('month');
  const [navDate, setNavDate] = useState(todayStr());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addDefaultDate, setAddDefaultDate] = useState<string | undefined>();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingLink, setBookingLink] = useState<BookingLink | null>(null);
  const [gcConnected, setGcConnected] = useState(false);
  const [gcLastSynced, setGcLastSynced] = useState<string | undefined>();
  const [gcSyncing, setGcSyncing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: 'ok' | 'err' } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 初期ロード
  useEffect(() => {
    loadAll();
    const p = new URLSearchParams(window.location.search);
    const bid = p.get('booking');
    if (bid) setBookingId(bid);
  }, []);

  // 予約ページ用リンクをDB取得
  useEffect(() => {
    if (!bookingId) { setBookingLink(null); return; }
    fetchLinkById(bookingId).then(l => setBookingLink(l));
  }, [bookingId]);

  // ウィンドウ幅変化でドロワーを閉じる
  useEffect(() => {
    const h = () => { if (window.innerWidth >= 768) setDrawerOpen(false); };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [evs, lnks] = await Promise.all([fetchEvents(), fetchLinks()]);
      setEvents(evs);
      setLinks(lnks);

      // OAuthコールバック後のURLパラメータを確認
      const gcStatus = checkGcConnectionFromURL();
      if (gcStatus.connected) {
        setGcConnected(true);
        setGcLastSynced(new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
        showToast('✅ Googleカレンダーと連携しました');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (gcStatus.error) {
        showToast('❌ Google連携に失敗しました: ' + gcStatus.error, 'err');
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (e) {
      showToast('❌ データの読み込みに失敗しました', 'err');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const d = new Date(navDate + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();

  const navigate = (dir: 1 | -1) => {
    if (view === 'month') {
      const nd = new Date(year, month + dir, 1);
      setNavDate(nd.toISOString().split('T')[0]);
    } else if (view === 'week') {
      setNavDate(addDays(navDate, dir * 7));
    } else {
      setNavDate(addDays(navDate, dir));
    }
  };

  const navLabel = () => {
    if (view === 'month') return `${year}年 ${MONTHS[month]}`;
    if (view === 'week') {
      const wk = getWeekDates(navDate);
      return `${wk[0].slice(5).replace('-','/')} 〜 ${wk[6].slice(5).replace('-','/')}`;
    }
    return dateLabel(navDate, true);
  };

  const handleGcSync = async () => {
    setGcSyncing(true);
    try {
      const result = await syncGoogleCalendar();
      await loadAll(); // カレンダーを再取得
      setGcLastSynced(new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
      showToast(`🔄 ${result.message}`);
    } catch (e: any) {
      showToast('❌ 同期失敗: ' + e.message, 'err');
    } finally {
      setGcSyncing(false);
    }
  };

  const switchTab = (t: Tab) => { setTab(t); setDrawerOpen(false); };

  // ── 予約ページ表示 ──
  if (bookingId && bookingLink) {
    return (
      <div>
        {toast && <Toast toast={toast} />}
        <BookingPage
          link={bookingLink}
          onBack={() => { setBookingId(null); setBookingLink(null); }}
          onSubmit={async (req: BookingRequest) => {
            const token = generateCancelToken();
            await submitBookingRequest(req, token);
            // ローカル状態も更新（即反映）
            await loadAll();
            return { cancelToken: token };
          }}
          onCancel={async (token) => {
            await cancelEventByToken(token);
            await loadAll();
          }}
        />
      </div>
    );
  }

  // bookingIdがあるがリンクがまだ取得中
  if (bookingId && !bookingLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  const pendingCount = events.filter(e => e.status === 'pending').length;
  const pending = events.filter(e => e.status === 'pending');
  const totalBookings = links.reduce((s, l) => s + l.bookingCount, 0);

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans">
      {toast && <Toast toast={toast} />}

      {/* ── Topbar ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-black">減</span>
            </div>
            <div className="hidden sm:block min-w-0">
              <div className="text-[10px] text-slate-400 leading-none">特定非営利活動法人</div>
              <div className="text-sm font-bold text-slate-900 leading-tight">減災教育普及協会</div>
            </div>
            <div className="sm:hidden min-w-0">
              <div className="text-sm font-bold text-slate-900">減災スケジュール</div>
            </div>
            <div className="hidden md:flex items-center ml-3 bg-slate-100 rounded-lg px-2.5 py-1 flex-shrink-0">
              <span className="text-xs text-slate-400">理事長スケジュール管理</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-0.5 flex-shrink-0">
            {([['calendar','カレンダー',<CalendarDays className="w-3.5 h-3.5"/>],['links','予約リンク',<Link2 className="w-3.5 h-3.5"/>]] as const).map(([t,label,icon]) => (
              <button key={t} onClick={() => setTab(t as Tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab===t?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-100'}`}>
                {icon}{label}
                {t==='calendar' && pendingCount>0 && (
                  <span className="bg-amber-400 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{pendingCount}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:hidden flex-shrink-0">
            {pendingCount>0 && (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
                <Bell className="w-3 h-3"/>{pendingCount}
              </div>
            )}
            <button onClick={() => setDrawerOpen(o=>!o)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
              {drawerOpen ? <X className="w-5 h-5 text-slate-700"/> : <Menu className="w-5 h-5 text-slate-700"/>}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setDrawerOpen(false)}/>
          <div className="fixed top-14 right-0 bottom-0 w-72 bg-white z-40 md:hidden overflow-y-auto shadow-2xl border-l border-slate-100">
            <div className="p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">メニュー</p>
                {([['calendar','カレンダー',<CalendarDays className="w-4 h-4"/>],['links','予約リンク',<Link2 className="w-4 h-4"/>]] as const).map(([t,label,icon]) => (
                  <button key={t} onClick={() => switchTab(t as Tab)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${tab===t?'bg-slate-900 text-white':'text-slate-600 hover:bg-slate-50'}`}>
                    {icon}{label}
                    {t==='calendar' && pendingCount>0 && (
                      <span className="ml-auto bg-amber-400 text-white text-[9px] rounded-full w-5 h-5 flex items-center justify-center font-bold">{pendingCount}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Googleカレンダー</p>
                <div className={`rounded-xl border p-3 ${gcConnected?'border-emerald-200 bg-emerald-50/40':'border-slate-200 bg-white'}`}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${gcConnected?'bg-white shadow-sm':'bg-slate-100'}`}>
                      <Globe className={`w-3.5 h-3.5 ${gcConnected?'text-emerald-600':'text-slate-400'}`}/>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        Googleカレンダー {gcConnected && <CheckCircle2 className="w-3 h-3 text-emerald-500"/>}
                      </div>
                      <div className="text-[10px] text-slate-400">{gcConnected?(gcLastSynced?`同期: ${gcLastSynced}`:'接続中'):'未接続'}</div>
                    </div>
                    {gcConnected && (
                      <div className="flex gap-1">
                        <button onClick={handleGcSync} className="p-1.5 hover:bg-white rounded-lg">
                          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${gcSyncing?'animate-spin':''}`}/>
                        </button>
                        <button onClick={() => {setGcConnected(false);setGcLastSynced(undefined);}} className="p-1.5 hover:bg-red-50 rounded-lg">
                          <LogOut className="w-3.5 h-3.5 text-slate-300"/>
                        </button>
                      </div>
                    )}
                  </div>
                  {!gcConnected && (
                    <button onClick={() => startGoogleOAuth()}
                      className="w-full py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                      Googleで連携する
                    </button>
                  )}
                </div>
              </div>

              {pending.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">承認待ち</p>
                  {pending.map(e => (
                    <button key={e.id} onClick={() => {setSelectedEvent(e);setDrawerOpen(false);}}
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-left hover:bg-amber-100 transition-colors mb-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5"/>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-amber-800 truncate">{e.requesterName}</div>
                        <div className="text-[10px] text-amber-600 truncate">{e.requesterOrg}</div>
                        <div className="text-[10px] text-amber-500 mt-0.5">{e.date} {e.startTime}〜</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-100 pt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">概要</p>
                <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-2">
                  {[
                    {label:'予定（全体）',value:events.filter(e=>e.status!=='cancelled').length+'件'},
                    {label:'承認待ち',value:pending.length+'件',warn:pending.length>0},
                    {label:'有効な予約リンク',value:links.filter(l=>l.isActive).length+'件'},
                    {label:'予約合計',value:totalBookings+'件'},
                  ].map(({label,value,warn}) => (
                    <div key={label} className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">{label}</span>
                      <span className={`font-bold ${warn?'text-amber-600':'text-slate-800'}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-3.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">使い方</p>
                {['「予約リンク」で空き枠を設定','URLをコピーして相手に送信','予約が入ったら承認して確定'].map((s,i) => (
                  <div key={i} className="flex gap-2 items-start mb-2 last:mb-0">
                    <span className="w-4 h-4 rounded bg-slate-700 text-[10px] flex items-center justify-center flex-shrink-0 font-bold text-slate-300">{i+1}</span>
                    <span className="text-[11px] text-slate-400 leading-snug">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-3 sm:px-5 py-4 sm:py-5">
        <div className="flex gap-5">
          <div className="flex-1 min-w-0">

            {loading ? (
              <div className="bg-white border border-slate-200 rounded-2xl flex items-center justify-center" style={{minHeight:540}}>
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin"/>
                  <span className="text-sm">データを読み込み中...</span>
                </div>
              </div>
            ) : tab === 'calendar' ? (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col" style={{minHeight:540}}>
                <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                      <ChevronLeft className="w-4 h-4 text-slate-500"/>
                    </button>
                    <button onClick={() => setNavDate(todayStr())} className="px-2 py-1 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">今日</button>
                    <button onClick={() => navigate(1)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-500"/>
                    </button>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800 flex-1 truncate">{navLabel()}</h2>
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5 flex-shrink-0">
                    {([['month','月'],['week','週'],['day','日']] as const).map(([v,l]) => (
                      <button key={v} onClick={() => setView(v)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${view===v?'bg-white text-slate-900 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>{l}</button>
                    ))}
                  </div>
                  <button onClick={() => {setAddDefaultDate(undefined);setShowAdd(true);}}
                    className="flex items-center gap-1 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors flex-shrink-0">
                    <Plus className="w-3.5 h-3.5"/>追加
                  </button>
                </div>
                <div className="flex gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 border-b border-slate-50 text-[10px] text-slate-400 flex-wrap">
                  {[['bg-blue-500','内部'],['bg-emerald-500','外部面談'],['bg-violet-500','講演'],['bg-slate-400','ブロック'],['bg-amber-400','承認待ち']].map(([c,l]) => (
                    <span key={l} className="flex items-center gap-1 flex-shrink-0"><span className={`w-2 h-2 rounded-full ${c}`}/>{l}</span>
                  ))}
                </div>
                {view==='month' && <MonthView year={year} month={month} events={events} onSelectDay={(ds) => {setView('day');setNavDate(ds);}} onSelectEvent={setSelectedEvent}/>}
                {view==='week' && <WeekView weekStartDate={navDate} events={events} onSelectEvent={setSelectedEvent}/>}
                {view==='day' && <DayView date={navDate} events={events} onSelectEvent={setSelectedEvent}/>}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
                <BookingLinks
                  links={links}
                  onToggle={async (id) => {
                    const lnk = links.find(l=>l.id===id);
                    if (!lnk) return;
                    await toggleLink(id, !lnk.isActive);
                    setLinks(ls=>ls.map(l=>l.id===id?{...l,isActive:!l.isActive}:l));
                  }}
                  onCreate={async (link) => {
                    const created = await createLink(link);
                    setLinks(ls=>[created,...ls]);
                    showToast('✅ 予約リンクを作成しました');
                  }}
                  onDelete={async (id) => {
                    await deleteLink(id);
                    setLinks(ls=>ls.filter(l=>l.id!==id));
                    showToast('🗑️ 削除しました');
                  }}
                  onPreview={(id) => setBookingId(id)}
                />
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <Sidebar
              events={events} links={links}
              gcConnected={gcConnected} gcLastSynced={gcLastSynced}
              onGcConnect={() => startGoogleOAuth()}
              onGcDisconnect={() => {setGcConnected(false);setGcLastSynced(undefined);}}
              onGcSync={handleGcSync}
            />
          </div>
        </div>
      </main>

      {/* ── モバイル ボトムタブバー ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 flex">
        {([['calendar','カレンダー',<CalendarDays className="w-5 h-5"/>],['links','予約リンク',<Link2 className="w-5 h-5"/>]] as const).map(([t,label,icon]) => (
          <button key={t} onClick={() => setTab(t as Tab)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-semibold transition-colors relative ${tab===t?'text-slate-900':'text-slate-400'}`}>
            {icon}{label}
            {t==='calendar' && pendingCount>0 && (
              <span className="absolute top-1.5 right-[calc(50%-18px)] bg-amber-400 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{pendingCount}</span>
            )}
            {tab===t && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-slate-900 rounded-full"/>}
          </button>
        ))}
        <button onClick={() => setDrawerOpen(o=>!o)}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-semibold text-slate-400">
          <Menu className="w-5 h-5"/>メニュー
        </button>
      </nav>
      <div className="md:hidden h-16"/>

      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onApprove={async (id) => {
            await updateEventStatus(id, 'confirmed');
            setEvents(es=>es.map(e=>e.id===id?{...e,status:'confirmed'}:e));
            setSelectedEvent(null);
            showToast('✅ 承認しました');
          }}
          onReject={async (id) => {
            await updateEventStatus(id, 'cancelled');
            setEvents(es=>es.map(e=>e.id===id?{...e,status:'cancelled'}:e));
            setSelectedEvent(null);
            showToast('❌ 却下しました','err');
          }}
        />
      )}
      <AddEventDialog
        open={showAdd} defaultDate={addDefaultDate}
        onClose={() => setShowAdd(false)}
        onAdd={async (ev) => {
          const created = await createEvent(ev);
          setEvents(es=>[...es,created]);
          showToast('✅ 予定を追加しました');
        }}
      />
    </div>
  );
}

function Toast({toast}:{toast:{msg:string;type?:'ok'|'err'}}) {
  return (
    <div className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 text-white text-sm px-5 py-2.5 rounded-full shadow-xl whitespace-nowrap ${toast.type==='err'?'bg-red-600':'bg-slate-900'}`}>
      {toast.msg}
    </div>
  );
}
