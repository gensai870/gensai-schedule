import { supabase } from './supabase';
import type { CalendarEvent, BookingLink, BookingRequest } from '../types/index';

// ─────────────────────────────────────────
// 型変換ヘルパー（DB行 ↔ フロント型）
// ─────────────────────────────────────────

function rowToEvent(r: any): CalendarEvent {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    startTime: r.start_time?.slice(0, 5) ?? '',
    endTime: r.end_time?.slice(0, 5) ?? '',
    location: r.location ?? undefined,
    description: r.description ?? undefined,
    status: r.status,
    type: r.type,
    requesterName: r.requester_name ?? undefined,
    requesterOrg: r.requester_org ?? undefined,
    requesterEmail: r.requester_email ?? undefined,
    requesterPurpose: r.requester_purpose ?? undefined,
    requesterCount: r.requester_count ?? undefined,
    meetingFormat: r.meeting_format ?? undefined,
    cancelToken: r.cancel_token ?? undefined,
  };
}

function eventToRow(e: Omit<CalendarEvent, 'id'>) {
  return {
    title: e.title,
    date: e.date,
    start_time: e.startTime,
    end_time: e.endTime,
    location: e.location ?? null,
    description: e.description ?? null,
    status: e.status,
    type: e.type,
    requester_name: e.requesterName ?? null,
    requester_org: e.requesterOrg ?? null,
    requester_email: e.requesterEmail ?? null,
    requester_purpose: e.requesterPurpose ?? null,
    requester_count: e.requesterCount ?? null,
    meeting_format: e.meetingFormat ?? null,
    cancel_token: e.cancelToken ?? null,
  };
}

function rowToLink(r: any): BookingLink {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    duration: r.duration,
    slots: r.slots ?? [],
    isActive: r.is_active,
    bookingCount: r.booking_count,
    autoReplyMessage: r.auto_reply_message ?? undefined,
    requirePurpose: r.require_purpose,
    requireCount: r.require_count,
    requireFormat: r.require_format,
    expiresAt: r.expires_at ?? undefined,
    createdAt: r.created_at?.split('T')[0] ?? '',
  };
}

// ─────────────────────────────────────────
// Events
// ─────────────────────────────────────────

export async function fetchEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('schedule_events')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToEvent);
}

export async function createEvent(ev: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('schedule_events')
    .insert(eventToRow(ev))
    .select()
    .single();
  if (error) throw error;
  return rowToEvent(data);
}

export async function updateEventStatus(id: string, status: CalendarEvent['status']): Promise<void> {
  const { error } = await supabase
    .from('schedule_events')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function cancelEventByToken(token: string): Promise<void> {
  const { error } = await supabase
    .from('schedule_events')
    .update({ status: 'cancelled' })
    .eq('cancel_token', token);
  if (error) throw error;
}

// ─────────────────────────────────────────
// Booking Links
// ─────────────────────────────────────────

export async function fetchLinks(): Promise<BookingLink[]> {
  const { data, error } = await supabase
    .from('booking_links')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToLink);
}

export async function createLink(link: Omit<BookingLink, 'id' | 'createdAt' | 'bookingCount'>): Promise<BookingLink> {
  const { data, error } = await supabase
    .from('booking_links')
    .insert({
      title: link.title,
      description: link.description ?? null,
      duration: link.duration,
      slots: link.slots,
      is_active: link.isActive,
      auto_reply_message: link.autoReplyMessage ?? null,
      require_purpose: link.requirePurpose,
      require_count: link.requireCount,
      require_format: link.requireFormat,
      expires_at: link.expiresAt ?? null,
      booking_count: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToLink(data);
}

export async function toggleLink(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('booking_links')
    .update({ is_active: isActive })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteLink(id: string): Promise<void> {
  const { error } = await supabase
    .from('booking_links')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────
// Booking Requests（外部予約の受付）
// ─────────────────────────────────────────

export async function submitBookingRequest(
  req: BookingRequest,
  cancelToken: string
): Promise<{ eventId: string }> {
  // 1. schedule_eventsに承認待ちで追加
  const ev = await createEvent({
    title: `面談依頼（承認待ち）`,
    date: req.slot.date,
    startTime: req.slot.startTime,
    endTime: req.slot.endTime,
    status: 'pending',
    type: 'meeting',
    requesterName: req.name,
    requesterOrg: req.org,
    requesterEmail: req.email,
    requesterPurpose: req.purpose,
    requesterCount: req.count,
    meetingFormat: req.format,
    cancelToken,
  });

  // 2. booking_requestsにログ保存
  const { error } = await supabase
    .from('booking_requests')
    .insert({
      link_id: req.linkId,
      event_id: ev.id,
      slot_date: req.slot.date,
      slot_start: req.slot.startTime,
      slot_end: req.slot.endTime,
      name: req.name,
      org: req.org,
      email: req.email,
      purpose: req.purpose ?? null,
      count: req.count ?? null,
      format: req.format ?? null,
      message: req.message ?? null,
      cancel_token: cancelToken,
    });
  if (error) throw error;

  // 3. booking_countをインクリメント
  await supabase.rpc('increment_booking_count', { link_id: req.linkId })
    .then(() => {}) // エラーは無視（RPCなければ手動更新）
    .catch(async () => {
      // RPCがなければ手動でインクリメント
      const { data: cur } = await supabase
        .from('booking_links')
        .select('booking_count')
        .eq('id', req.linkId)
        .single();
      if (cur) {
        await supabase
          .from('booking_links')
          .update({ booking_count: cur.booking_count + 1 })
          .eq('id', req.linkId);
      }
    });

  return { eventId: ev.id };
}

export async function fetchLinkById(id: string): Promise<BookingLink | null> {
  const { data, error } = await supabase
    .from('booking_links')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();
  if (error) return null;
  return rowToLink(data);
}
