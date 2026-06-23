export type EventType = 'internal' | 'meeting' | 'blocked' | 'lecture';
export type EventStatus = 'confirmed' | 'pending' | 'cancelled';
export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;         // YYYY-MM-DD
  startTime: string;    // HH:mm
  endTime: string;
  location?: string;
  description?: string;
  status: EventStatus;
  type: EventType;
  requesterName?: string;
  requesterOrg?: string;
  requesterEmail?: string;
  requesterPurpose?: string;
  requesterCount?: number;
  meetingFormat?: 'onsite' | 'online' | 'visit';
  cancelToken?: string;
}

export interface BookingSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export interface BookingLink {
  id: string;
  title: string;
  description?: string;
  duration: number;
  slots: BookingSlot[];
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  bookingCount: number;
  autoReplyMessage?: string;
  requirePurpose: boolean;
  requireCount: boolean;
  requireFormat: boolean;
}

export interface BookingRequest {
  linkId: string;
  slot: BookingSlot;
  name: string;
  org: string;
  email: string;
  purpose?: string;
  count?: number;
  format?: 'onsite' | 'online' | 'visit';
  message?: string;
}
