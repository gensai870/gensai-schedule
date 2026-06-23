import type { CalendarEvent } from '../../types/index';
import type { dateLabel, typeConfig, fmt2 } from '../../utils/helpers';

interface DayViewProps {
  date: string;
  events: CalendarEvent[];
  onSelectEvent: (ev: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i);

export default function DayView({ date, events, onSelectEvent }: DayViewProps) {
  const dayEvents = events.filter(e => e.date === date && e.status !== 'cancelled');

  const timeToPos = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return ((h - 8) * 60 + m) / (12 * 60) * 100;
  };
  const duration = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return Math.max(((eh * 60 + em) - (sh * 60 + sm)) / (12 * 60) * 100, 4);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10">
        <p className="text-base font-semibold text-slate-800">{dateLabel(date)}</p>
        <p className="text-xs text-slate-400 mt-0.5">{dayEvents.length}件の予定</p>
      </div>
      <div className="flex">
        {/* Time axis */}
        <div className="w-12 flex-shrink-0">
          {HOURS.map(h => (
            <div key={h} className="h-14 border-b border-slate-100 flex items-start justify-end pr-2 pt-1">
              <span className="text-[10px] text-slate-400">{fmt2(h)}:00</span>
            </div>
          ))}
        </div>

        {/* Events column */}
        <div className="flex-1 relative border-l border-slate-100">
          {HOURS.map(h => (
            <div key={h} className="h-14 border-b border-slate-100" />
          ))}
          {dayEvents.map(ev => {
            const cfg = typeConfig[ev.type];
            const top = timeToPos(ev.startTime);
            const height = duration(ev.startTime, ev.endTime);
            const isPending = ev.status === 'pending';
            return (
              <button
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                style={{ top: `${top}%`, height: `${height}%` }}
                className={`absolute inset-x-2 rounded-lg text-left px-3 py-1.5 overflow-hidden transition-all hover:brightness-95 hover:shadow-sm ${cfg.bar} text-white ${isPending ? 'opacity-75 ring-2 ring-amber-400 ring-offset-1' : ''}`}
              >
                <div className="text-xs font-bold">{ev.startTime}–{ev.endTime}</div>
                <div className="text-sm font-semibold truncate mt-0.5">{ev.title}</div>
                {ev.location && <div className="text-[11px] opacity-80 truncate mt-0.5">📍 {ev.location}</div>}
                {ev.requesterName && <div className="text-[11px] opacity-80 truncate">👤 {ev.requesterName}（{ev.requesterOrg}）</div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
