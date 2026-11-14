import type { Invoice } from './types';
import { stellarAccountBytes } from '@pollar/core';

const KEY = 'paylink.invoices.v1';
const validStatuses = new Set(['PENDING', 'PAID', 'FAILED']);

function validInvoice(value: unknown): value is Invoice {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Invoice>;
  return typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.title === 'string' && item.title.trim().length > 0 &&
    typeof item.customerName === 'string' && typeof item.amount === 'string' &&
    Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 &&
    item.currency === 'USDC' && typeof item.recipientAddress === 'string' &&
    stellarAccountBytes(item.recipientAddress) !== null &&
    typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt)) &&
    (item.confirmedAt === undefined || (typeof item.confirmedAt === 'string' && Number.isFinite(Date.parse(item.confirmedAt)))) &&
    validStatuses.has(String(item.status));
}

export function readInvoices(): Invoice[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(validInvoice);
  } catch {
    return [];
  }
}

export function writeInvoices(items: Invoice[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items.filter(validInvoice))); }
  catch { /* Browser storage may be disabled or full; the UI remains usable for this session. */ }
}

export function upsertInvoice(invoice: Invoice) {
  const items = readInvoices();
  if (items.some((item) => item.id === invoice.id)) throw new Error('This payment reference already exists. Create the link again.');
  const next = [invoice, ...items];
  writeInvoices(next);
  return next;
}

export function updateInvoice(id: string, patch: Partial<Invoice>) {
  const next = readInvoices().map((item) => item.id === id ? { ...item, ...patch } : item);
  writeInvoices(next);
  return next;
}

export function getInvoice(id: string) { return readInvoices().find((item) => item.id === id); }
