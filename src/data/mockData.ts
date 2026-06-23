import { CalendarEvent, BookingLink } from '../types';

const d = new Date();
const fmt = (n: Date) => n.toISOString().split('T')[0];
const add = (n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export const MOCK_EVENTS: CalendarEvent[] = [
  { id:'ev1', title:'理事会 定例会議', date:fmt(add(0)), startTime:'10:00', endTime:'12:00', location:'本部 会議室A', status:'confirmed', type:'internal', description:'月次定例。議題：年度予算・活動報告' },
  { id:'ev2', title:'防災講演（徳島市教育委員会）', date:fmt(add(1)), startTime:'14:00', endTime:'16:00', location:'徳島市立文化センター', status:'confirmed', type:'lecture', requesterName:'山田 太郎', requesterOrg:'徳島市教育委員会', requesterEmail:'yamada@city.tokushima.lg.jp', meetingFormat:'onsite' },
  { id:'ev3', title:'面談：田中様（NPO法人 安全ネット）', date:fmt(add(2)), startTime:'13:00', endTime:'14:00', status:'pending', type:'meeting', requesterName:'田中 花子', requesterOrg:'NPO法人 安全ネット', requesterEmail:'tanaka@safetynet.org', requesterPurpose:'連携協定の締結に向けた協議', requesterCount:2, meetingFormat:'onsite', cancelToken:'tok_e3' },
  { id:'ev4', title:'文部科学省ヒアリング', date:fmt(add(3)), startTime:'15:00', endTime:'16:30', location:'オンライン（Zoom）', status:'confirmed', type:'meeting', meetingFormat:'online' },
  { id:'ev5', title:'出張（大阪）', date:fmt(add(5)), startTime:'09:00', endTime:'18:00', status:'confirmed', type:'blocked', description:'関西防災フォーラム 登壇' },
  { id:'ev6', title:'年度総会 準備会議', date:fmt(add(7)), startTime:'11:00', endTime:'12:30', location:'本部 会議室B', status:'confirmed', type:'internal' },
  { id:'ev7', title:'面談依頼：佐藤様（防災テック株式会社）', date:fmt(add(4)), startTime:'10:00', endTime:'11:00', status:'pending', type:'meeting', requesterName:'佐藤 健', requesterOrg:'防災テック株式会社', requesterEmail:'sato@bousai-tech.co.jp', requesterPurpose:'防災教育プログラムの共同開発', requesterCount:3, meetingFormat:'onsite', cancelToken:'tok_e7' },
  { id:'ev8', title:'メディア取材（NHK）', date:fmt(add(9)), startTime:'13:30', endTime:'15:00', location:'本部', status:'confirmed', type:'meeting' },
];

export const MOCK_LINKS: BookingLink[] = [
  {
    id:'lnk1',
    title:'理事長との面談予約（60分）',
    description:'減災教育普及協会 理事長との面談をご希望の方は、以下よりご希望の日程をお選びください。担当者より確認のご連絡をいたします。',
    duration: 60,
    slots:[
      { date:fmt(add(8)), startTime:'10:00', endTime:'11:00' },
      { date:fmt(add(8)), startTime:'14:00', endTime:'15:00' },
      { date:fmt(add(10)), startTime:'10:00', endTime:'11:00' },
      { date:fmt(add(10)), startTime:'13:00', endTime:'14:00' },
      { date:fmt(add(12)), startTime:'15:00', endTime:'16:00' },
    ],
    createdAt: fmt(d),
    expiresAt: fmt(add(30)),
    isActive: true,
    bookingCount: 3,
    autoReplyMessage: 'お申し込みありがとうございます。\n担当者より2営業日以内にご連絡いたします。\n\nご不明な点は info@gensai.or.jp までお問い合わせください。',
    requirePurpose: true,
    requireCount: true,
    requireFormat: true,
  },
  {
    id:'lnk2',
    title:'30分ブリーフィング',
    description:'短時間でのご相談・情報共有（30分）',
    duration: 30,
    slots:[
      { date:fmt(add(11)), startTime:'09:00', endTime:'09:30' },
      { date:fmt(add(11)), startTime:'16:30', endTime:'17:00' },
    ],
    createdAt: fmt(d),
    isActive: true,
    bookingCount: 1,
    autoReplyMessage: 'お申し込みありがとうございます。内容を確認のうえご連絡いたします。',
    requirePurpose: true,
    requireCount: false,
    requireFormat: false,
  },
];
