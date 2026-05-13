import { addDays, dateKey, formatHours, hoursBetween, startOfDay, weekKey } from './date';

const byDate = (sessions) =>
  sessions.reduce((acc, session) => {
    const key = dateKey(session.start_time);
    acc[key] = (acc[key] || 0) + Number(session.total_hours || 0);
    return acc;
  }, {});

const isDayOff = (session) => session.work_type === 'day_off';
const isWorkSession = (session) => !isDayOff(session) && Number(session.total_hours || 0) > 0;

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
    { label: 'Эта неделя', value: formatHours(weekHours), hint: `${sessions.filter((s) => new Date(s.start_time) >= weekStart && isWorkSession(s)).length} смен` },
    { label: 'Этот месяц', value: formatHours(monthHours), hint: `${sessions.filter((s) => new Date(s.start_time) >= monthStart && s.total_hours > Number(settings.overtimeThreshold || 8)).length} переработок` },
    { label: 'Дней подряд', value: String(streak), hint: streak >= 6 ? 'пора на отдых' : 'ритм стабильный' },
    { label: 'Всего часов', value: formatHours(totalHours), hint: `${sessions.length} записей` },
  ];
};

export const getWorkStreak = (sessions, activeSession) => {
  const days = new Set(sessions.filter(isWorkSession).map((s) => dateKey(s.start_time)));
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
  const latest = sessions.length
    ? new Date(Math.max(...sessions.map((session) => new Date(session.start_time).getTime())))
    : new Date();
  const windowStart = addDays(startOfDay(latest), -13);
  const recent = sessions.filter((session) => {
    const date = new Date(session.start_time);
    return date >= windowStart && date <= latest;
  });
  const workRecent = recent.filter(isWorkSession);
  const daysOff = new Set(recent.filter(isDayOff).map((s) => dateKey(s.start_time))).size;
  const avgHours = workRecent.length
    ? workRecent.reduce((sum, session) => sum + Number(session.total_hours || 0), 0) / workRecent.length
    : 0;
  const overtimeDays = workRecent.filter((session) => session.total_hours > overtimeThreshold).length;
  const streak = getWorkStreak(sessions, activeSession);

  const totalDays = Math.max(1, new Set(recent.map((s) => dateKey(s.start_time))).size);
  const workDays = new Set(workRecent.map((s) => dateKey(s.start_time))).size;
  const restRatio = daysOff / totalDays;
  const overtimeRatio = workRecent.length ? overtimeDays / workRecent.length : 0;
  const avgPressure = Math.max(0, (avgHours - overtimeThreshold) / Math.max(1, overtimeThreshold));
  const streakPressure = Math.max(0, (streak - 5) / 5);

  const fatigueScore = Math.min(100, Math.round(
    28 +
    avgPressure * 30 +
    overtimeRatio * 24 +
    streakPressure * 18 -
    restRatio * 18,
  ));
  const burnoutScore = Math.min(100, Math.round(
    22 +
    fatigueScore * 0.45 +
    overtimeRatio * 22 +
    Math.max(0, 0.28 - restRatio) * 55 +
    streakPressure * 16,
  ));
  const productivity = Math.max(35, Math.min(98, Math.round(
    86 -
    avgPressure * 16 -
    overtimeRatio * 10 -
    Math.max(0, fatigueScore - 65) * 0.25 +
    Math.min(restRatio, 0.35) * 12,
  )));
  const level = burnoutScore >= 72 ? 'red' : burnoutScore >= 45 ? 'yellow' : 'green';

  const recommendations = [
    daysOff >= 5
      ? `За последние 14 дней было ${daysOff} выходных. Восстановление выглядит нормальным.`
      : `За последние 14 дней было ${daysOff} выходных. Стоит заранее поставить день без работы.`,
    overtimeDays >= 4
      ? `${overtimeDays} дня с переработкой за период. Лучше не ставить тяжелые задачи подряд.`
      : `Переработок немного: ${overtimeDays}. Нагрузка пока контролируемая.`,
    avgHours >= overtimeThreshold
      ? `Средняя рабочая смена ${avgHours.toFixed(1)}ч — выше выбранного порога. Запланируйте короткую смену.`
      : `Средняя рабочая смена ${avgHours.toFixed(1)}ч — ниже порога переработки.`,
  ];

  return {
    burnoutScore,
    fatigueScore,
    productivity,
    level,
    daysOff,
    workDays,
    totalDays,
    restRatio,
    overtimeRatio,
    avgHours,
    overtimeDays,
    recommendations,
  };
};
