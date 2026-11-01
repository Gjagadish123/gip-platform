// CRM: bookings the admin records, leads from the website and the live layouts, the common sheet of both, and the
// downloads. Tables, RPCs and the sheet view: supabase/migrations/20261102120000_crm.sql. Supabase mode only.
import type { Db } from './supabase/client';
import type { ID } from './types';

export type Channel = 'direct' | 'associate';
export const CHANNEL_LABEL: Record<Channel, string> = { direct: 'Direct', associate: 'Associate' };

export interface Booking {
  id: string;
  projectId: ID;
  plotNumber: string;
  area: number;            // sq yd, as booked
  customerName: string;
  customerPhone: string;   // E.164
  channel: Channel;
  agentName: string;       // the salesperson (Direct) or the associate
  price: number;           // final sold price, ₹
  bookedOn: string;        // YYYY-MM-DD
  note?: string;
  createdByName: string;
  updatedAt: string;
}

/** What the booking form sends: a new booking has no id; an edit carries id + updatedAt as loaded. */
export type BookingInput = Omit<Booking, 'id' | 'area' | 'createdByName' | 'updatedAt'> & { id?: string; updatedAt?: string };

export interface SheetRow {
  id: string;              // 'booking:<uuid>' | 'enquiry:<n>'
  at: string;              // when it came in
  kind: 'booking' | 'enquiry';
  source: string;          // 'Booking · Direct', 'Website · Enquiry form', 'Live layout · Plot enquiry', …
  projectId?: ID;
  projectName?: string;    // the project, or what the visitor asked about ("General enquiry")
  plotNumber?: string;
  area?: number;
  name: string;
  phone: string;
  email?: string;
  agent?: string;
  price?: number;
  bookedOn?: string;
  details?: string;
}

const und = <T,>(v: T | null): T | undefined => (v ?? undefined);

export async function loadBookings(db: Db): Promise<Booking[]> {
  const { data, error } = await db.from('bookings').select('*').order('booked_on', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((r) => ({
    id: r.id, projectId: r.project_id, plotNumber: r.plot_number, area: Number(r.area), customerName: r.customer_name,
    customerPhone: r.customer_phone, channel: r.channel as Channel, agentName: r.agent_name, price: Number(r.price),
    bookedOn: r.booked_on, note: und(r.note), createdByName: r.created_by_name, updatedAt: r.updated_at,
  }));
}

// One page of 5,000 rows, newest first; page it when the sheet outgrows that.
export const SHEET_LIMIT = 5000;
export async function loadSheet(db: Db): Promise<SheetRow[]> {
  const { data, error } = await db.from('crm_sheet').select('*').order('at', { ascending: false }).limit(SHEET_LIMIT);
  if (error) throw error;
  return data.map((r) => ({
    id: r.id!, at: r.at!, kind: r.kind as SheetRow['kind'], source: r.source!, projectId: und(r.project_id), projectName: und(r.project_name),
    plotNumber: und(r.plot_number), area: r.area == null ? undefined : Number(r.area), name: r.name!, phone: r.phone!,
    email: und(r.email), agent: und(r.agent), price: r.price == null ? undefined : Number(r.price), bookedOn: und(r.booked_on),
    details: und(r.details),
  }));
}

/** Saves one booking; markSold puts an Available or Hold plot to Sold Out with it. Resolves to the booking id. */
export async function saveBooking(db: Db, b: BookingInput, markSold: boolean): Promise<string> {
  const { data, error } = await db.rpc('save_booking', {
    p: {
      id: b.id ?? null, updated_at: b.updatedAt ?? null, project_id: b.projectId, plot_number: b.plotNumber,
      customer_name: b.customerName, customer_phone: b.customerPhone, channel: b.channel, agent_name: b.agentName,
      price: b.price, booked_on: b.bookedOn, note: b.note ?? null,
    },
    p_mark_sold: markSold,
  });
  if (error) throw error;
  return data;
}

export async function deleteBooking(db: Db, id: string) {
  const { error } = await db.from('bookings').delete().eq('id', id);
  if (error) throw error;
}

/** '+919876543210' -> '+91 98765 43210'; other countries as stored. */
export const formatPhone = (p: string) => (/^\+91\d{10}$/.test(p) ? `+91 ${p.slice(3, 8)} ${p.slice(8)}` : p);

/** '98765 43210', '+91 98765-43210', '0 98765 43210' -> '+919876543210'; null if it isn't a phone number. */
export function toE164(raw: string): string | null {
  const t = raw.trim();
  let d = t.replace(/\D/g, '');
  if (t.startsWith('+')) return /^\d{7,15}$/.test(d) ? `+${d}` : null;
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}

/** People group by name: "  ravi  KUMAR " and "Ravi Kumar" are one salesperson. */
export const personKey = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

// ---------------------------------------------------------------- downloads

/** A cell we built ourselves from checked data (no formula escaping), e.g. phoneCell. */
interface Trusted { trusted: string }
type Cell = string | number | null | undefined | Trusted;

/** A phone number that spreadsheets keep as text, + and spaces included. Safe: the database allows only + and digits. */
export const phoneCell = (p: string): Trusted => ({ trusted: `="${formatPhone(p)}"` });

/**
 * RFC 4180 CSV. Text that a spreadsheet would run as a formula (= + - @, tab, CR at the start) gets a leading
 * apostrophe: names, messages and notes come from the public or from free-text fields.
 */
export function toCsv(rows: Cell[][]): string {
  const cell = (v: Cell) => {
    if (v == null) return '';
    if (typeof v === 'number') return String(v);
    const s = typeof v === 'object' ? v.trusted : /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(cell).join(',')).join('\r\n');
}

/** Saves the CSV with a UTF-8 byte-order mark, so Excel shows ₹ and Telugu names correctly. */
export function downloadCsv(filename: string, rows: Cell[][]) {
  const url = URL.createObjectURL(new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
