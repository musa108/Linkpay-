import type { Invoice } from './types';
const KEY = 'paylink.invoices.v1';
export function readInvoices(): Invoice[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as Invoice[]; }
  catch { return []; }
}
export function writeInvoices(items: Invoice[]) { localStorage.setItem(KEY, JSON.stringify(items)); }
export function upsertInvoice(invoice: Invoice) {
  const items = readInvoices();
  const next = [invoice, ...items.filter((item) => item.id !== invoice.id)];
  writeInvoices(next);
  return next;
}
export function updateInvoice(id: string, patch: Partial<Invoice>) {
  const next = readInvoices().map((item) => item.id === id ? { ...item, ...patch } : item);
  writeInvoices(next);
  return next;
}
export function getInvoice(id: string) { return readInvoices().find((item) => item.id === id); }
