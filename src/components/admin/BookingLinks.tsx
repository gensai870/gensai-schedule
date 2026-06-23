import type { useState } from 'react';
import type { Copy, CheckCheck, Plus, ToggleLeft, ToggleRight, Trash2, ExternalLink, Clock, Calendar, Users, Link2 } from 'lucide-react';
import type { BookingLink, BookingSlot } from '../../types/index';
import type { Button } from '@/components/ui/button';
import type { Input } from '@/components/ui/input';
import type { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BookingLinksProps {
  links: BookingLink[];
  onToggle: (id: string) => void;
  onCreate: (link: Omit<BookingLink, 'id' | 'createdAt' | 'bookingCount'>) => void;
  onDelete: (id: string) => void;
  onPreview: (id: string) => void;
}

const DURATIONS = [30, 45, 60, 90];

export default function BookingLinks({ links, onToggle, onCreate, onDelete, onPreview }: BookingLinksProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    title: '', description: '', duration: 60,
    autoReplyMessage: 'お申し込みありがとうございます。\n担当者より2営業日以内にご連絡いたします。',
    requirePurpose: true, requireCount: false, requireFormat: true,
    slots: [] as BookingSlot[],
    slotDate: '', slotStart: '10:00', slotEnd: '11:00',
  });

  const copy = (id: string) => {
    const url = `${window.location.href.split('?')[0]}?booking=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const addSlot = () => {
    if (!f.slotDate) return;
    setF(p => ({ ...p, slots: [...p.slots, { date: p.slotDate, startTime: p.slotStart, endTime: p.slotEnd }], slotDate: '' }));
  };

  const submit = () => {
    if (!f.title || f.slots.length === 0) return;
    onCreate({ title: f.title, description: f.description, duration: f.duration, slots: f.slots, isActive: true, autoReplyMessage: f.autoReplyMessage, requirePurpose: f.requirePurpose, requireCount: f.requireCount, requireFormat: f.requireFormat });
    setOpen(false);
    setF(p => ({ ...p, title: '', description: '', slots: [] }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800">予約受付リンク</h2>
          <p className="text-xs text-slate-400 mt-0.5">URLを送るだけで外部からの予約を自動受付</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" />新規作成
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {links.map(lnk => (
          <div key={lnk.id} className={`bg-white border rounded-xl overflow-hidden transition-opacity ${lnk.isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
            <div className="px-4 py-3 flex items-start gap-3 border-b border-slate-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">{lnk.title}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${lnk.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {lnk.isActive ? '受付中' : '停止中'}
                  </span>
                </div>
                {lnk.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{lnk.description}</p>}
                <div className="flex gap-3 mt-1.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lnk.duration}分</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{lnk.slots.length}枠</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />予約{lnk.bookingCount}件</span>
                </div>
              </div>
              <button onClick={() => onToggle(lnk.id)} className={lnk.isActive ? 'text-emerald-500' : 'text-slate-300'}>
                {lnk.isActive ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
              </button>
            </div>
            <div className="px-4 py-2.5 flex items-center gap-2 bg-slate-50/60">
              <Link2 className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              <span className="text-[11px] text-slate-400 truncate flex-1 font-mono">…?booking={lnk.id}</span>
              <button onClick={() => copy(lnk.id)} className={`flex items-center gap-1 text-xs px-3 py-1 rounded-md font-medium transition-colors ${copied === lnk.id ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
                {copied === lnk.id ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === lnk.id ? 'コピー済' : 'URLをコピー'}
              </button>
              <button onClick={() => onPreview(lnk.id)} className="p-1.5 border border-slate-200 rounded-md hover:bg-white transition-colors" title="予約ページを確認">
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <button onClick={() => onDelete(lnk.id)} className="p-1.5 border border-red-100 rounded-md hover:bg-red-50 transition-colors" title="削除">
                <Trash2 className="w-3.5 h-3.5 text-red-300" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>予約受付リンクを作成</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <label className="label-sm">タイトル *</label>
              <Input className="mt-1" value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} placeholder="例：理事長との面談予約（60分）" />
            </div>
            <div>
              <label className="label-sm">説明文（外部に表示）</label>
              <Input className="mt-1" value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} placeholder="予約ページに表示されます" />
            </div>
            <div>
              <label className="label-sm">面談時間</label>
              <div className="flex gap-2 mt-1">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setF(p => ({ ...p, duration: d }))}
                    className={`flex-1 py-1.5 text-xs rounded-md border font-medium transition-colors ${f.duration === d ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                    {d}分
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-sm">フォーム項目</label>
              <div className="flex flex-col gap-2 mt-1">
                {[
                  { key: 'requirePurpose', label: '目的・用件（任意入力）' },
                  { key: 'requireCount', label: '参加人数' },
                  { key: 'requireFormat', label: '面談形式（来訪/オンライン/訪問）' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                    <input type="checkbox" checked={(f as any)[key]} onChange={e => setF(p => ({ ...p, [key]: e.target.checked }))} className="w-4 h-4 accent-slate-900" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label-sm">自動返信メッセージ</label>
              <textarea className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 h-20 resize-none outline-none focus:ring-1 focus:ring-slate-400"
                value={f.autoReplyMessage} onChange={e => setF(p => ({ ...p, autoReplyMessage: e.target.value }))} />
            </div>
            <div>
              <label className="label-sm">空き枠を追加 *</label>
              <div className="flex gap-2 mt-1 flex-wrap items-end">
                <Input type="date" value={f.slotDate} onChange={e => setF(p => ({ ...p, slotDate: e.target.value }))} className="flex-1 min-w-32 text-sm" />
                <Input type="time" value={f.slotStart} onChange={e => setF(p => ({ ...p, slotStart: e.target.value }))} className="w-24 text-sm" />
                <span className="text-slate-400 text-sm">〜</span>
                <Input type="time" value={f.slotEnd} onChange={e => setF(p => ({ ...p, slotEnd: e.target.value }))} className="w-24 text-sm" />
                <Button size="sm" variant="outline" onClick={addSlot}>追加</Button>
              </div>
              {f.slots.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {f.slots.map((s, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-1.5 text-xs text-slate-600">
                      <span>{s.date} {s.startTime}〜{s.endTime}</span>
                      <button onClick={() => setF(p => ({ ...p, slots: p.slots.filter((_, j) => j !== i) }))} className="text-slate-300 hover:text-red-400">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>キャンセル</Button>
              <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white" disabled={!f.title || f.slots.length === 0} onClick={submit}>作成する</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
