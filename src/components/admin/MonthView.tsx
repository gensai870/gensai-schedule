import type { useMemo } from 'react';
import type { CalendarEvent } from '../../types/index';
import type { WEEKDAYS, isSameDay, todayStr, typeConfig } from '../../utils/helpers';

interface MonthViewProps {
  year: number;
  month: number; // 0-indexed
  events: CalendarEvent[];
  onSelectDay: (date: string) => void;
  onSelectEvent: (ev: CalendarEvent) => void;
}

export default function MonthView({ year, month, events, onSelectDay, onSelectEvent }: MonthViewProps) {
  const today = todayStr();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const cells = Array.from({ length: firstDay }, (_, i) => ({ type: 'empty' as const, key: `e${i}` }))
    .concat(Array.from({ length: daysInMonth }, (_, i) => ({ type: 'day' as const, day: i + 1, key: `d${i + 1}` })));

  const dateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`py-2 text-center text-xs font-semibold tracking-widest uppercase ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: 'minmax(90px, 1fr)' }}>
        {cells.map(cell => {
          if (cell.type === 'empty') return (
            <div key={cell.key} className="border-b border-r border-slate-100 bg-slate-50/40" />
          );

          const ds = dateStr(cell.day!);
          const dayEvents = eventsByDate[ds] || [];
          const isToday = isSameDay(ds, today);
          const col = (firstDay + cell.day! - 1) % 7;
          const hasPending = dayEvents.some(e => e.status === 'pending');

          return (
            <div
              key={cell.key}
              onClick={() => onSelectDay(ds)}
              className={`border-b border-r border-slate-100 p-1.5 cursor-pointer group transition-colors hover:bg-slate-50 ${isToday ? 'bg-blue-50/30' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                  isToday
                    ? 'bg-slate-900 text-white font-bold'
                    : col === 0 ? 'text-red-400 group-hover:bg-red-50'
                    : col === 6 ? 'text-blue-400 group-hover:bg-blue-50'
                    : 'text-slate-600 group-hover:bg-slate-100'
                }`}>
                  {cell.day}
                </span>
                {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </div>
              <div className="flex flex-col gap-px">
                {dayEvents.slice(0, 3).map(ev => {
                  const cfg = typeConfig[ev.type];
                  const isPending = ev.status === 'pending';
                  return (
                    <button
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); onSelectEvent(ev); }}
                      className={`text-left text-[10px] leading-tight px-1.5 py-0.5 rounded truncate w-full border-l-2 transition-opacity hover:opacity-70 ${cfg.color} ${isPending ? 'border-amber-400 opacity-80' : cfg.bar.replace('bg-', 'border-')}`}
                    >
                      <span className="opacity-60">{ev.startTime}</span> {ev.title}
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-slate-400 px-1.5">+{dayEvents.length - 3}件</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
