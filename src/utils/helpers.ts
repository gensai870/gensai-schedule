export const WEEKDAYS = ['日','月','火','水','木','金','土'];
export const MONTHS = Array.from({length:12},(_,i)=>`${i+1}月`);

export const fmt2 = (n: number) => String(n).padStart(2,'0');

export const dateLabel = (dateStr: string, short = false) => {
  const d = new Date(dateStr + 'T00:00:00');
  const wd = WEEKDAYS[d.getDay()];
  if (short) return `${d.getMonth()+1}/${d.getDate()}(${wd})`;
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${wd}）`;
};

export const isSameDay = (a: string, b: string) => a === b;

export const addDays = (dateStr: string, n: number) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

export const todayStr = () => new Date().toISOString().split('T')[0];

export const getWeekDates = (dateStr: string): string[] => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  return Array.from({length:7},(_,i)=>{
    const x = new Date(monday);
    x.setDate(monday.getDate()+i);
    return x.toISOString().split('T')[0];
  });
};

export const HOURS = Array.from({length:13},(_,i)=>fmt2(8+i)+':00'); // 08:00-20:00

export const typeConfig = {
  internal: { label:'内部予定', color:'bg-navy-100 text-navy-800', bar:'bg-blue-600', dot:'bg-blue-600' },
  meeting:  { label:'外部面談', color:'bg-emerald-50 text-emerald-800', bar:'bg-emerald-500', dot:'bg-emerald-500' },
  lecture:  { label:'講演・登壇', color:'bg-violet-50 text-violet-800', bar:'bg-violet-500', dot:'bg-violet-500' },
  blocked:  { label:'ブロック', color:'bg-slate-100 text-slate-500', bar:'bg-slate-400', dot:'bg-slate-400' },
};

export const statusConfig = {
  confirmed: { label:'確定', color:'text-emerald-600' },
  pending:   { label:'承認待ち', color:'text-amber-600' },
  cancelled: { label:'却下', color:'text-red-400' },
};

export const generateCancelToken = () => `tok_${Math.random().toString(36).slice(2,10)}`;
