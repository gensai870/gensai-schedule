import type { useState } from 'react';
import type { CalendarEvent, EventType } from '../../types/index';
import type { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Input } from '@/components/ui/input';
import type { Button } from '@/components/ui/button';

interface AddEventDialogProps {
  open: boolean;
  defaultDate?: string;
  onClose: () => void;
  onAdd: (ev: Omit<CalendarEvent, 'id'>) => void;
}

const typeOptions: { value: EventType; label: string }[] = [
  { value: 'internal', label: '内部予定' },
  { value: 'meeting', label: '外部面談' },
  { value: 'lecture', label: '講演・登壇' },
  { value: 'blocked', label: 'ブロック' },
];

export default function AddEventDialog({ open, defaultDate, onClose, onAdd }: AddEventDialogProps) {
  const [f, setF] = useState({
    title: '', type: 'internal' as EventType,
    date: defaultDate || new Date().toISOString().split('T')[0],
    startTime: '10:00', endTime: '11:00',
    location: '', description: '',
  });

  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const submit = () => {
    if (!f.title || !f.date) return;
    onAdd({ ...f, status: 'confirmed' });
    setF(p => ({ ...p, title: '', location: '', description: '' }));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>予定を追加</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4 mt-1">
          <div>
            <label className="label-sm">タイトル *</label>
            <Input value={f.title} onChange={e => set('title', e.target.value)} placeholder="例：理事会 定例会議" autoFocus />
          </div>
          <div>
            <label className="label-sm">種別</label>
            <div className="grid grid-cols-4 gap-1.5 mt-1">
              {typeOptions.map(o => (
                <button key={o.value} onClick={() => set('type', o.value)}
                  className={`py-1.5 text-xs rounded-md border font-medium transition-colors ${f.type === o.value ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-sm">日付 *</label>
            <Input type="date" value={f.date} onChange={e => set('date', e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">開始</label>
              <Input type="time" value={f.startTime} onChange={e => set('startTime', e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="label-sm">終了</label>
              <Input type="time" value={f.endTime} onChange={e => set('endTime', e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="label-sm">場所（任意）</label>
            <Input value={f.location} onChange={e => set('location', e.target.value)} placeholder="例：本部 会議室A / オンライン" className="mt-1" />
          </div>
          <div>
            <label className="label-sm">メモ（任意）</label>
            <Input value={f.description} onChange={e => set('description', e.target.value)} placeholder="備考" className="mt-1" />
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={onClose}>キャンセル</Button>
            <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white" disabled={!f.title} onClick={submit}>追加する</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
