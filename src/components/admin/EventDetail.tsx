import type { Clock, MapPin, User, Building2, Mail, FileText, Users, Monitor, CheckCircle2, XCircle, X, Tag } from 'lucide-react';
import type { CalendarEvent } from '../../types/index';
import type { dateLabel, typeConfig, statusConfig } from '../../utils/helpers';
import type { Button } from '@/components/ui/button';
import type { Badge } from '@/components/ui/badge';

interface EventDetailProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const formatLabel: Record<string, string> = {
  onsite: '来訪（当協会へ）',
  online: 'オンライン（Zoom等）',
  visit: '訪問（先方へ）',
};

export default function EventDetail({ event, onClose, onApprove, onReject }: EventDetailProps) {
  if (!event) return null;

  const cfg = typeConfig[event.type];
  const scfg = statusConfig[event.status];
  const isPending = event.status === 'pending';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-5 pt-5 pb-4 border-b border-slate-100`}>
          <div className="flex items-start gap-3">
            <div className={`w-1 self-stretch rounded-full ${cfg.bar}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                <span className={`text-[11px] font-semibold ${scfg.color}`}>{scfg.label}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 leading-snug">{event.title}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          <Row icon={<Clock />} label="日時">
            {dateLabel(event.date)} {event.startTime}〜{event.endTime}
          </Row>
          {event.location && (
            <Row icon={<MapPin />} label="場所">{event.location}</Row>
          )}
          {event.meetingFormat && (
            <Row icon={<Monitor />} label="形式">{formatLabel[event.meetingFormat]}</Row>
          )}
          {event.requesterName && (
            <Row icon={<User />} label="申請者">
              <div>
                <div className="font-semibold text-slate-800">{event.requesterName}</div>
                {event.requesterOrg && <div className="text-xs text-slate-400 mt-0.5">{event.requesterOrg}</div>}
              </div>
            </Row>
          )}
          {event.requesterEmail && (
            <Row icon={<Mail />} label="メール">
              <a href={`mailto:${event.requesterEmail}`} className="text-blue-600 hover:underline">{event.requesterEmail}</a>
            </Row>
          )}
          {event.requesterPurpose && (
            <Row icon={<FileText />} label="目的・用件">{event.requesterPurpose}</Row>
          )}
          {event.requesterCount !== undefined && (
            <Row icon={<Users />} label="参加人数">{event.requesterCount}名</Row>
          )}
          {event.description && (
            <Row icon={<Tag />} label="メモ">{event.description}</Row>
          )}
        </div>

        {/* Actions */}
        {isPending && (
          <div className="px-5 py-4 bg-amber-50 border-t border-amber-100 flex gap-2">
            <Button
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white gap-2 h-10"
              onClick={() => { onApprove(event.id); onClose(); }}
            >
              <CheckCircle2 className="w-4 h-4" />
              承認する
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-2 h-10"
              onClick={() => { onReject(event.id); onClose(); }}
            >
              <XCircle className="w-4 h-4" />
              却下する
            </Button>
          </div>
        )}
        {!isPending && (
          <div className="px-5 py-3 border-t border-slate-100">
            <button onClick={onClose} className="w-full text-sm text-slate-400 hover:text-slate-600 py-1">閉じる</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm">
      <div className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
        <div className="text-slate-700">{children}</div>
      </div>
    </div>
  );
}
