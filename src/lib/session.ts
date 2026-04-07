import type { SessionData } from '../types';

const SESSION_KEY = 'sasa_session';

export const getSession = (): SessionData | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
};

export const setSession = (data: SessionData): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};
