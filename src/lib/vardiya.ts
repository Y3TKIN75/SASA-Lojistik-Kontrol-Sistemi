import type { Vardiya } from '../types';

// 23:45-07:44 → 00:00-08:00 | 07:45-15:44 → 08:00-16:00 | 15:45-23:44 → 16:00-00:00
export function detectVardiya(): Vardiya {
  const now = new Date();
  const m = now.getHours() * 60 + now.getMinutes();
  if (m >= 23 * 60 + 45 || m < 7 * 60 + 45) return '00:00-08:00';
  if (m < 15 * 60 + 45) return '08:00-16:00';
  return '16:00-00:00';
}

// 23:45'ten sonra vardiya 00:00-08:00'e geçer, form tarihi ertesi güne ait.
export function getFormDate(): string {
  const now = new Date();
  const m = now.getHours() * 60 + now.getMinutes();
  if (m >= 23 * 60 + 45) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  return now.toISOString().split('T')[0];
}
