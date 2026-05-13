import { supabase } from '../lib/supabaseClient';
import { uid } from '../utils/date';

const STORAGE_KEY = 'work-tracker:sessions';
const ACTIVE_KEY = 'work-tracker:active-session';
const SETTINGS_KEY = 'work-tracker:settings';
const QUEUE_KEY = 'work-tracker:offline-queue';

const fromStorage = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const toStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const sortSessions = (sessions) =>
  [...sessions].sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

const queueMutation = (mutation) => {
  const queue = fromStorage(QUEUE_KEY, []);
  toStorage(QUEUE_KEY, [...queue, mutation]);
};

const mapSession = (session) => ({
  id: session.id || uid(),
  start_time: session.start_time,
  end_time: session.end_time,
  total_hours: Number(session.total_hours || 0),
  work_type: session.work_type === 'deep_work' ? 'office' : session.work_type || 'office',
  mood: session.mood || 'focused',
  notes: session.notes === 'Работа дома'
    ? 'Удаленка'
    : session.notes === 'Дома, Жезказган'
      ? 'Удаленка, Жезказган'
      : session.notes || '',
  created_at: session.created_at || new Date().toISOString(),
  is_manual_edit: Boolean(session.is_manual_edit),
  is_active_session: Boolean(session.is_active_session),
});

export const sessionStore = {
  getLocalSessions() {
    return sortSessions(fromStorage(STORAGE_KEY, []).map(mapSession));
  },

  saveLocalSessions(sessions) {
    toStorage(STORAGE_KEY, sortSessions(sessions.map(mapSession)));
  },

  getActiveSession() {
    return fromStorage(ACTIVE_KEY, null);
  },

  setActiveSession(session) {
    if (!session) {
      localStorage.removeItem(ACTIVE_KEY);
      return;
    }

    toStorage(ACTIVE_KEY, mapSession(session));
  },

  getSettings() {
    return {
      overtimeThreshold: 8,
      ...fromStorage(SETTINGS_KEY, {}),
    };
  },

  saveSettings(settings) {
    toStorage(SETTINGS_KEY, settings);
  },

  exportData() {
    return JSON.stringify(
      {
        sessions: this.getLocalSessions(),
        activeSession: this.getActiveSession(),
        settings: this.getSettings(),
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
  },

  async importData(payload) {
    const parsed = JSON.parse(payload);
    const sessions = sortSessions((parsed.sessions || []).map(mapSession));
    this.saveLocalSessions(sessions);
    this.setActiveSession(parsed.activeSession || null);
    this.saveSettings({ ...this.getSettings(), ...(parsed.settings || {}) });

    if (supabase && navigator.onLine && sessions.length) {
      const { error } = await supabase.from('work_sessions').upsert(sessions);
      if (error) queueMutation({ type: 'upsert', payload: sessions });
    } else if (sessions.length) {
      queueMutation({ type: 'upsert', payload: sessions });
    }
  },

  async syncQueue() {
    if (!supabase || !navigator.onLine) return;
    const queue = fromStorage(QUEUE_KEY, []);
    if (!queue.length) return;

    const remaining = [];
    for (const mutation of queue) {
      try {
        if (mutation.type === 'upsert') {
          const { error } = await supabase.from('work_sessions').upsert(mutation.payload);
          if (error) throw error;
        }
        if (mutation.type === 'delete') {
          const { error } = await supabase.from('work_sessions').delete().eq('id', mutation.id);
          if (error) throw error;
        }
      } catch {
        remaining.push(mutation);
      }
    }

    toStorage(QUEUE_KEY, remaining);
  },
};

export const workSessionService = {
  async list() {
    const local = sessionStore.getLocalSessions();
    if (!supabase) return local;

    await sessionStore.syncQueue();
    const { data, error } = await supabase
      .from('work_sessions')
      .select('*')
      .eq('is_active_session', false)
      .order('start_time', { ascending: false });

    if (error) return local;
    const sessions = sortSessions((data || []).map(mapSession));
    sessionStore.saveLocalSessions(sessions);
    return sessions;
  },

  async save(session) {
    const mapped = mapSession(session);
    const local = sessionStore.getLocalSessions();
    const next = sortSessions([mapped, ...local.filter((item) => item.id !== mapped.id)]);
    sessionStore.saveLocalSessions(next);

    if (supabase && navigator.onLine) {
      const { error } = await supabase.from('work_sessions').upsert(mapped);
      if (error) queueMutation({ type: 'upsert', payload: mapped });
    } else {
      queueMutation({ type: 'upsert', payload: mapped });
    }

    return mapped;
  },

  async remove(id) {
    const next = sessionStore.getLocalSessions().filter((item) => item.id !== id);
    sessionStore.saveLocalSessions(next);

    if (supabase && navigator.onLine) {
      const { error } = await supabase.from('work_sessions').delete().eq('id', id);
      if (error) queueMutation({ type: 'delete', id });
    } else {
      queueMutation({ type: 'delete', id });
    }
  },

  clear() {
    sessionStore.saveLocalSessions([]);
    sessionStore.setActiveSession(null);
  },
};
