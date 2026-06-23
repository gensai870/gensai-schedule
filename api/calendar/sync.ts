import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 保存済みトークンを取得
    const { data: tokenRow, error: tokenErr } = await supabase
      .from('google_tokens')
      .select('*')
      .eq('id', 'default')
      .single();

    if (tokenErr || !tokenRow) {
      return res.status(401).json({ error: 'Not connected to Google Calendar' });
    }

    // OAuth2クライアントにトークンをセット
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    oauth2Client.setCredentials({
      access_token: tokenRow.access_token,
      refresh_token: tokenRow.refresh_token,
      expiry_date: tokenRow.expiry_date,
    });

    // トークン自動更新時にSupabaseも更新
    oauth2Client.on('tokens', async (tokens) => {
      await supabase
        .from('google_tokens')
        .update({
          access_token: tokens.access_token,
          expiry_date: tokens.expiry_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'default');
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // 今日から60日分を取得
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 60);

    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    });

    const gcEvents = data.items ?? [];
    const imported: string[] = [];

    for (const ev of gcEvents) {
      if (!ev.start || !ev.summary) continue;

      // 終日イベント
      const isAllDay = !!ev.start.date;
      const date = isAllDay
        ? ev.start.date!
        : ev.start.dateTime!.split('T')[0];
      const startTime = isAllDay ? '00:00' : ev.start.dateTime!.slice(11, 16);
      const endTime = isAllDay ? '23:59' : (ev.end?.dateTime?.slice(11, 16) ?? '23:59');

      // gc_ プレフィックス付きIDで upsert（重複防止）
      const gcId = `gc_${ev.id}`;
      await supabase
        .from('schedule_events')
        .upsert({
          id: gcId,
          title: ev.summary,
          date,
          start_time: startTime,
          end_time: endTime,
          location: ev.location ?? null,
          description: ev.description ?? null,
          status: 'confirmed',
          type: 'internal',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      imported.push(gcId);
    }

    res.json({
      success: true,
      synced: imported.length,
      message: `${imported.length}件のイベントを同期しました`,
    });

  } catch (err: any) {
    console.error('Calendar sync error:', err);
    res.status(500).json({ error: err.message });
  }
}
