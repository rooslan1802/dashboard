export const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export const startOfDay = (date = new Date()) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const endOfDay = (date = new Date()) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

export const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const hoursBetween = (start, end) => {
  if (!start || !end) return 0;
  return Math.max(0, (new Date(end) - new Date(start)) / 36e5);
};

export const formatHours = (hours) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}ч ${String(m).padStart(2, '0')}м`;
};

export const formatTimer = (hours) => {
  const totalSeconds = Math.max(0, Math.floor(hours * 3600));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const formatTime = (value) =>
  value ? new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '--:--';

export const formatDate = (value, options = {}) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...options,
  }).format(new Date(value));

export const toDatetimeLocal = (value) => {
  const date = value ? new Date(value) : new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date - offset).toISOString().slice(0, 16);
};

export const fromDatetimeLocal = (value) => new Date(value).toISOString();

export const dateKey = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const weekKey = (value) => {
  const date = new Date(value);
  const first = startOfDay(new Date(date.getFullYear(), 0, 1));
  const day = Math.floor((startOfDay(date) - first) / 86400000);
  return `W${Math.ceil((day + first.getDay() + 1) / 7)}`;
};
