import { useCallback, useEffect, useMemo, useState } from 'react';
import { sessionStore, workSessionService } from '../services/workSessionService';
import { buildDashboardStats } from '../utils/analytics';
import { hoursBetween, uid } from '../utils/date';

const defaultSessionFields = {
  work_type: 'office',
  mood: 'focused',
  notes: '',
};

export function useWorkSessions(showToast) {
  const [sessions, setSessions] = useState(sessionStore.getLocalSessions);
  const [activeSession, setActiveSession] = useState(sessionStore.getActiveSession);
  const [settings, setSettings] = useState(sessionStore.getSettings);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await workSessionService.list();
    setSessions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const sync = () => sessionStore.syncQueue();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [refresh]);

  const startWork = useCallback((payload = {}) => {
    const started = {
      id: uid(),
      start_time: payload.start_time || new Date().toISOString(),
      end_time: null,
      total_hours: 0,
      ...defaultSessionFields,
      ...payload,
      created_at: new Date().toISOString(),
      is_manual_edit: Boolean(payload.is_manual_edit),
      is_active_session: true,
    };
    sessionStore.setActiveSession(started);
    setActiveSession(started);
    showToast?.('Смена началась');
  }, [showToast]);

  const finishWork = useCallback(async (payload = {}) => {
    if (!activeSession) return;
    const finished = {
      ...activeSession,
      ...payload,
      end_time: payload.end_time || new Date().toISOString(),
      is_active_session: false,
      is_manual_edit: Boolean(payload.is_manual_edit || activeSession.is_manual_edit),
    };
    finished.total_hours = hoursBetween(finished.start_time, finished.end_time);
    const saved = await workSessionService.save(finished);
    sessionStore.setActiveSession(null);
    setActiveSession(null);
    setSessions((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
    showToast?.('Смена сохранена');
  }, [activeSession, showToast]);

  const saveSession = useCallback(async (payload) => {
    const session = {
      id: payload.id || uid(),
      created_at: payload.created_at || new Date().toISOString(),
      is_active_session: false,
      ...defaultSessionFields,
      ...payload,
      total_hours: hoursBetween(payload.start_time, payload.end_time),
      is_manual_edit: true,
    };
    const saved = await workSessionService.save(session);
    setSessions((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
    showToast?.('Запись обновлена');
  }, [showToast]);

  const deleteSession = useCallback(async (id) => {
    await workSessionService.remove(id);
    setSessions((items) => items.filter((item) => item.id !== id));
    showToast?.('Запись удалена', 'warning');
  }, [showToast]);

  const clearHistory = useCallback(() => {
    workSessionService.clear();
    setSessions([]);
    setActiveSession(null);
    showToast?.('История очищена', 'warning');
  }, [showToast]);

  const updateSettings = useCallback((next) => {
    const merged = { ...settings, ...next };
    sessionStore.saveSettings(merged);
    setSettings(merged);
    showToast?.('Настройки сохранены');
  }, [settings, showToast]);

  const dashboardStats = useMemo(
    () => buildDashboardStats(sessions, activeSession, settings),
    [sessions, activeSession, settings],
  );

  return {
    sessions,
    activeSession,
    settings,
    loading,
    dashboardStats,
    startWork,
    finishWork,
    saveSession,
    deleteSession,
    clearHistory,
    updateSettings,
    refresh,
  };
}
