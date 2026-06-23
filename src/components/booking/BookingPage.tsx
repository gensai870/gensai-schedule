import type { useState } from 'react';
import type { ArrowLeft, ChevronRight, CheckCircle2, Calendar, Clock, User, Building2, Mail, FileText, Users, Monitor, Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import type { BookingLink, BookingRequest, BookingSlot } from '../../types/index';
import type { Button } from '@/components/ui/button';
import type { Input } from '@/components/ui/input';
import type { dateLabel } from '../../utils/helpers';

type Step = 'slot' | 'form' | 'confirm' | 'done' | 'cancel' | 'cancelled';

interface BookingPageProps {
  link: BookingLink;
  initialToken?: string; // for cancel/change flow
  onBack: () => void;
  onSubmit: (req: BookingRequest) => { cancelToken: string };
  onCancel: (token: string) => void;
}

const FORMAT_OPTIONS = [
  { value: 'onsite', label: '来訪（当協会へお越しください）' },
  { value: 'online', label: 'オンライン（Zoom等）' },
  { value: 'visit', label: '訪問（貴組織へ伺います）' },
] as const;

export default function BookingPage({ link, initialToken, onBack, onSubmit, onCancel }: BookingPageProps) {
  const [step, setStep] = useState<Step>(initialToken ? 'cancel' : 'slot');
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [cancelToken, setCancelToken] = useState(initialToken || '');
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [f, setF] = useState({ name: '', org: '', email: '', purpose: '', count: 1, format: 'onsite' as 'onsite' | 'online' | 'visit', message: '' });

  // Group slots by date
  const byDate = link.slots.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {} as Record<string, BookingSlot[]>);

  const steps = ['日程を選ぶ', '情報を入力', '確認'];
  const stepIdx = { slot: 0, form: 1, confirm: 2, done: 3, cancel: -1, cancelled: -1 }[step];

  const handleSubmit = () => {
    if (!selectedSlot) return;
    const result = onSubmit({ linkId: link.id, slot: selectedSlot, name: f.name, org: f.org, email: f.email, purpose: f.purpose, count: f.count, format: f.format, message: f.message });
    setCancelToken(result.cancelToken);
    setStep('done');
  };

  const handleCancel = () => {
    onCancel(cancelToken);
    setStep('cancelled');
  };

  const copyReply = () => {
    navigator.clipboard.writeText(link.autoReplyMessage || '').then(() => { setCopiedMsg(true); setTimeout(() => setCopiedMsg(false), 2000); });
  };

  // ── Cancel flow ──
  if (step === 'cancel') {
    return (
      <PageShell onBack={onBack}>
        <div className="max-w-md mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-800">予約のキャンセル・変更</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">予約をキャンセルする場合は「キャンセルする」を押してください。<br />別の日程に変更する場合はキャンセル後、再度お申し込みください。</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onBack}>戻る</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleCancel}>キャンセルする</Button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (step === 'cancelled') {
    return (
      <PageShell onBack={onBack}>
        <div className="max-w-md mx-auto text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-slate-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">キャンセルしました</h2>
          <p className="text-sm text-slate-500 mb-6">予約をキャンセルしました。<br />別の日程をご希望の場合は、再度お申し込みください。</p>
          <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={onBack}>予約ページへ戻る</Button>
        </div>
      </PageShell>
    );
  }

  // ── Done ──
  if (step === 'done') {
    return (
      <PageShell onBack={onBack}>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">予約が完了しました</h2>
            <p className="text-sm text-slate-500 mt-1">担当者より改めてご連絡いたします</p>
          </div>

          {/* Summary */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
            {[
              { icon: <Calendar />, v: selectedSlot ? dateLabel(selectedSlot.date) : '' },
              { icon: <Clock />, v: selectedSlot ? `${selectedSlot.startTime}〜${selectedSlot.endTime}（${link.duration}分）` : '' },
              { icon: <User />, v: f.name },
              { icon: <Building2 />, v: f.org },
              { icon: <Mail />, v: f.email },
            ].map(({ icon, v }, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 text-sm text-slate-600 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <span className="text-slate-300 w-4 h-4">{icon}</span>
                {v}
              </div>
            ))}
          </div>

          {/* Auto reply */}
          {link.autoReplyMessage && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">自動返信メッセージ</span>
                <button onClick={copyReply} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
                  {copiedMsg ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedMsg ? 'コピー済' : 'コピー'}
                </button>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-line">{link.autoReplyMessage}</p>
            </div>
          )}

          {/* Cancel link */}
          <div className="text-center">
            <button onClick={() => setStep('cancel')} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mx-auto transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              キャンセル・変更はこちら
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell onBack={onBack}>
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 max-w-md mx-auto">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i < stepIdx ? 'bg-emerald-500 text-white' : i === stepIdx ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {i < stepIdx ? '✓' : i + 1}
            </div>
            <span className={`text-xs flex-1 ${i === stepIdx ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>{s}</span>
            {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />}
          </div>
        ))}
      </div>

      <div className="max-w-md mx-auto">
        {/* Description */}
        {step === 'slot' && link.description && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-600 mb-6 leading-relaxed">
            {link.description}
          </div>
        )}

        {/* STEP 1: Slot */}
        {step === 'slot' && (
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-1">ご希望の日程をお選びください</h2>
            <p className="text-xs text-slate-400 mb-5">面談時間：{link.duration}分</p>
            <div className="flex flex-col gap-5">
              {Object.entries(byDate).sort().map(([date, slots]) => (
                <div key={date}>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{dateLabel(date)}</div>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((sl, i) => (
                      <button key={i} onClick={() => setSelectedSlot(sl)}
                        className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${selectedSlot === sl ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}>
                        {sl.startTime}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Button disabled={!selectedSlot} onClick={() => setStep('form')} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm">
                この日程で進む →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Form */}
        {step === 'form' && (
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-5">お名前・ご連絡先をご入力ください</h2>
            {selectedSlot && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div className="text-sm text-slate-600 flex-1">
                  <span className="font-semibold">{dateLabel(selectedSlot.date, true)}</span>　{selectedSlot.startTime}〜{selectedSlot.endTime}
                </div>
                <button onClick={() => setStep('slot')} className="text-xs text-slate-400 hover:text-slate-600 underline">変更</button>
              </div>
            )}
            <div className="flex flex-col gap-4">
              <Field icon={<User />} label="お名前 *">
                <Input value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="山田 太郎" />
              </Field>
              <Field icon={<Building2 />} label="所属組織・団体 *">
                <Input value={f.org} onChange={e => setF(p => ({ ...p, org: e.target.value }))} placeholder="○○市役所 / △△株式会社" />
              </Field>
              <Field icon={<Mail />} label="メールアドレス *">
                <Input type="email" value={f.email} onChange={e => setF(p => ({ ...p, email: e.target.value }))} placeholder="yourname@example.com" />
              </Field>
              {link.requirePurpose && (
                <Field icon={<FileText />} label="ご用件・目的">
                  <Input value={f.purpose} onChange={e => setF(p => ({ ...p, purpose: e.target.value }))} placeholder="例：防災教育プログラムの連携について" />
                </Field>
              )}
              {link.requireCount && (
                <Field icon={<Users />} label="参加人数">
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setF(p => ({ ...p, count: n }))}
                        className={`w-10 h-9 rounded-lg border text-sm font-semibold transition-colors ${f.count === n ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                        {n}
                      </button>
                    ))}
                    <span className="self-center text-sm text-slate-400">名</span>
                  </div>
                </Field>
              )}
              {link.requireFormat && (
                <Field icon={<Monitor />} label="面談形式">
                  <div className="flex flex-col gap-2">
                    {FORMAT_OPTIONS.map(o => (
                      <label key={o.value} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${f.format === o.value ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input type="radio" name="format" value={o.value} checked={f.format === o.value} onChange={() => setF(p => ({ ...p, format: o.value }))} className="accent-slate-900" />
                        <span className="text-sm text-slate-700">{o.label}</span>
                      </label>
                    ))}
                  </div>
                </Field>
              )}
            </div>
            <div className="flex gap-2 mt-8">
              <Button variant="outline" className="flex-1" onClick={() => setStep('slot')}>戻る</Button>
              <Button className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                disabled={!f.name || !f.org || !f.email} onClick={() => setStep('confirm')}>
                確認画面へ →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirm */}
        {step === 'confirm' && selectedSlot && (
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-5">内容をご確認ください</h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
              {[
                { label: '面談内容', v: link.title },
                { label: '日時', v: `${dateLabel(selectedSlot.date)} ${selectedSlot.startTime}〜${selectedSlot.endTime}（${link.duration}分）` },
                { label: 'お名前', v: f.name },
                { label: '所属', v: f.org },
                { label: 'メール', v: f.email },
                ...(f.purpose ? [{ label: 'ご用件', v: f.purpose }] : []),
                ...(link.requireCount ? [{ label: '参加人数', v: `${f.count}名` }] : []),
                ...(link.requireFormat ? [{ label: '面談形式', v: FORMAT_OPTIONS.find(o => o.value === f.format)?.label || '' }] : []),
              ].map(({ label, v }, i) => (
                <div key={i} className={`flex gap-3 px-4 py-3 text-sm ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                  <span className="text-slate-400 w-20 flex-shrink-0">{label}</span>
                  <span className="text-slate-800">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>修正する</Button>
              <Button className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold" onClick={handleSubmit}>
                予約を確定する
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function PageShell({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div>
            <div className="text-[11px] text-slate-400 tracking-wide">特定非営利活動法人</div>
            <div className="text-sm font-bold text-slate-800 leading-tight">減災教育普及協会</div>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-10">
        {children}
      </main>
      <footer className="border-t border-slate-100 mt-16 py-6 text-center text-xs text-slate-300">
        © 減災教育普及協会　お問い合わせ: info@gensai.or.jp
      </footer>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
        <span className="w-3.5 h-3.5 text-slate-400">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}
