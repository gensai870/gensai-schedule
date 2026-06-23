import type { useMemo } from 'react';
import type { CalendarEvent } from '../../types/index';
import type { WEEKDAYS, getWeekDates, todayStr, typeConfig, fmt2 } from '../../utils/helpers';

interface WeekViewProps {
  weekStartDate: string;
  events: CalendarEvent[];
  onSelectEvent: (ev: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 8–20

export default function WeekView({ weekStartDate, events, onSelectEvent }: WeekViewProps) {
  const today = todayStr();
  const dates = getWeekDates(weekStartDate);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const timeToPos = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return ((h - 8) * 60 + m) / (12 * 60) * 100;
  };
  const duration = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return ((eh - 8) * 60 + em - (sh - 8) * 60 - sm) / (12 * 60) * 100;
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="grid sticky top-0 bg-white z-10 border-b border-slate-200" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
        <div className="border-r border-slate-100" />
        {dates.map((ds, i) => {
          const d = new Date(ds + 'T00:00:00');
          const isToday = ds === today;
          return (
            <div key={ds} className={`py-2 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-blue-50/40' : ''}`}>
              <div className={`text-[10px] font-semibold uppercase tracking-wider ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>
                {WEEKDAYS[d.getDay()]}
              </div>
              <div className={`text-sm font-semibold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${isToday ? 'bg-slate-900 text-white' : 'text-slate-700'}`}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="relative" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
        <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
          {/* Hour rows */}
          {HOURS.map(h => (
            <div key={h} className="contents">
              <div className="border-r border-b border-slate-100 text-right pr-2 py-1">
                <span className="text-[10px] text-slate-400 font-medium">{fmt2(h)}:00</span>
              </div>
              {dates.map(ds => (
                <div key={ds} className="border-r border-b border-slate-100 last:border-r-0 h-12" />
              ))}
            </div>
          ))}
        </div>

        {/* Events overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ left: 48 }}>
          <div className="grid h-full" style={{ gridTemplateColumns: `repeat(7, 1fr)` }}>
            {dates.map(ds => {
              const dayEvents = (eventsByDate[ds] || []).filter(e => e.status !== 'cancelled');
              return (
                <div key={ds} className="relative border-r border-slate-100 last:border-r-0">
                  {dayEvents.map(ev => {
                    const cfg = typeConfig[ev.type];
                    const top = timeToPos(ev.startTime);
                    const height = Math.max(duration(ev.startTime, ev.endTime), 3);
                    const isPending = ev.status === 'pending';
                    return (
                      <button
                        key={ev.id}
                        onClick={() => onSelectEvent(ev)}
                        style={{ top: `${top}%`, height: `${height}%` }}
                        className={`absolute inset-x-0.5 rounded text-left px-1.5 py-0.5 text-[10px] leading-tight pointer-events-auto overflow-hidden transition-opacity hover:opacity-80 ${cfg.bar} text-white ${isPending ? 'opacity-70 border border-amber-300' : ''}`}
                      >
                        <div className="font-semibold truncate">{ev.startTime}</div>
                        <div className="truncate opacity-90">{ev.title}</div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
