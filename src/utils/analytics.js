import { addDays, dateKey, formatHours, hoursBetween, startOfDay, weekKey } from './date';

const byDate = (sessions) =>
  sessions.reduce((acc, session) => {
    const key = dateKey(session.start_time);
    acc[key] = (acc[key] || 0) + Number(session.total_hours || 0);
    return acc;
  }, {});

export const getSessionStatus = (session, settings = {}) => {
  const overtimeThreshold = Number(settings.overtimeThreshold || 8);
  if (session.work_type === 'day_off') return 'Выходной';
  if (session.work_type === 'business_trip') return 'Командировка';
  if (session.work_type === 'home') return 'Удаленка';
  if (session.total_hours > overtimeThreshold) return 'Переработка';
  if (session.total_hours > 0 && session.total_hours < 5) return 'Короткий день';
  return 'Обычный день';
};

export const getStatusTone = (status) => {
  const tones = {
    Переработка: 'text-coral bg-coral/12 border-coral/30',
    'Короткий день': 'text-amber bg-amber/12 border-amber/30',
    Выходной: 'text-sky bg-sky/12 border-sky/30',
    Командировка: 'text-violet-200 bg-violet-400/12 border-violet-300/30',
    Удаленка: 'text-mint bg-mint/12 border-mint/30',
    'Обычный день': 'text-white/70 bg-white/8 border-white/10',
  };

  return tones[status] || tones['Обычный день'];
};

export const buildDashboardStats = (sessions, activeSession, settings) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = addDays(todayStart, -((todayStart.getDay() + 6) % 7));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const activeHours = activeSession ? hoursBetween(activeSession.start_time, now) : 0;

  const totalFor = (predicate) =>
    sessions.reduce((sum, session) => sum + (predicate(new Date(session.start_time)) ? Number(session.total_hours) : 0), 0);

  const todayHours = totalFor((date) => date >= todayStart) + activeHours;
  const weekHours = totalFor((date) => date >= weekStart) + activeHours;
  const monthHours = totalFor((date) => date >= monthStart) + activeHours;
  const totalHours = sessions.reduce((sum, session) => sum + Number(session.total_hours), 0) + activeHours;
  const streak = getWorkStreak(sessions, activeSession);

  return [
    { label: 'Сегодня', value: formatHours(todayHours), hint: todayHours > Number(settings.overtimeThreshold || 8) ? 'есть переработка' : 'в пределах нормы' },
    { label: 'Эта неделя', value: formatHours(weekHours), hint: `${sessions.filter((s) => new Date(s.start_time) >= weekStart).length} смен` },
    { label: 'Этот месяц', value: formatHours(monthHours), hint: `${sessions.filter((s) => new Date(s.start_time) >= monthStart && s.total_hours > Number(settings.overtimeThreshold || 8)).length} переработок` },
    { label: 'Дней подряд', value: String(streak), hint: streak >= 6 ? 'пора на отдых' : 'ритм стабильный' },
    { label: 'Всего часов', value: formatHours(totalHours), hint: `${sessions.length} записей` },
  ];
};

export const getWorkStreak = (sessions, activeSession) => {
  const days = new Set(sessions.filter((s) => s.total_hours > 0).map((s) => dateKey(s.start_time)));
  if (activeSession) days.add(dateKey(activeSession.start_time));
  if (!days.size) return 0;

  let streak = 0;
  const latestDay = [...days].sort().at(-1);
  let cursor = startOfDay(new Date(`${latestDay}T00:00:00`));
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
};

export const buildDailyChart = (sessions, days = 14) => {
  const totals = byDate(sessions);
  const latest = sessions.length
    ? new Date(Math.max(...sessions.map((session) => new Date(session.start_time).getTime())))
    : new Date();

  return Array.from({ length: days }, (_, index) => {
    const date = addDays(latest, index - days + 1);
    const key = dateKey(date);
    return {
      day: new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date).replace('.', ''),
      hours: Number((totals[key] || 0).toFixed(1)),
    };
  });
};

export const buildWeeklyChart = (sessions) => {
  const weeks = sessions.reduce((acc, session) => {
    const key = weekKey(session.start_time);
    acc[key] = (acc[key] || 0) + Number(session.total_hours || 0);
    return acc;
  }, {});
  return Object.entries(weeks)
    .reverse()
    .map(([week, hours]) => ({ week: `${week.replace('W', '')} нед.`, hours: Number(hours.toFixed(1)) }));
};

export const buildMonthComparison = (sessions) => {
  const months = sessions.reduce((acc, session) => {
    const date = new Date(session.start_time);
    const key = new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(date);
    acc[key] = (acc[key] || 0) + Number(session.total_hours || 0);
    return acc;
  }, {});
  return Object.entries(months)
    .map(([month, hours]) => ({ month, hours: Number(hours.toFixed(1)) }));
};

export const averageStartEnd = (sessions) => {
  const completed = sessions.filter((s) => s.start_time && s.end_time);
  if (!completed.length) return { start: '--:--', end: '--:--' };

  const avgMinutes = (field) => {
    const total = completed.reduce((sum, session) => {
      const date = new Date(session[field]);
      return sum + date.getHours() * 60 + date.getMinutes();
    }, 0);
    const minutes = Math.round(total / completed.length);
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  };

  return { start: avgMinutes('start_time'), end: avgMinutes('end_time') };
};

export const buildInsights = (sessions, activeSession, settings = {}) => {
  const overtimeThreshold = Number(settings.overtimeThreshold || 8);
  const recent = sessions.filter((session) => new Date(session.start_time) >= addDays(new Date(), -14));
  const daysWorked = new Set(recent.map((s) => dateKey(s.start_time))).size + (activeSession ? 1 : 0);
  const daysOff = Math.max(0, 14 - daysWorked);
  const avgHours = recent.length
    ? recent.reduce((sum, session) => sum + Number(session.total_hours || 0), 0) / recent.length
    : 0;
  const overtimeDays = recent.filter((session) => session.total_hours > overtimeThreshold).length;
  const streak = getWorkStreak(sessions, activeSession);

  const burnoutScore = Math.min(100, Math.round(streak * 9 + avgHours * 6 + overtimeDays * 7 + Math.max(0, 4 - daysOff) * 8));
  const fatigueScore = Math.min(100, Math.round(avgHours * 8 + streak * 5 + overtimeDays * 10));
  const productivity = Math.max(35, Math.min(98, Math.round(88 - Math.max(0, avgHours - 8) * 5 - Math.max(0, streak - 5) * 4)));
  const level = burnoutScore >= 72 ? 'red' : burnoutScore >= 45 ? 'yellow' : 'green';

  const recommendations = [
    daysOff <= 2 ? `За последние 14 дней у вас было только ${daysOff} выходных.` : `За последние 14 дней было ${daysOff} дней отдыха.`,
    streak >= 6 ? 'После 6 дней подряд средняя продуктивность обычно снижается.' : 'Ритм работы выглядит устойчивым.',
    avgHours >= 9 ? 'Средняя длительность смены высокая, запланируйте короткий день.' : 'Средняя длительность смены в здоровом диапазоне.',
  ];

  return {
    burnoutScore,
    fatigueScore,
    productivity,
    level,
    daysOff,
    avgHours,
    overtimeDays,
    recommendations,
  };
};
