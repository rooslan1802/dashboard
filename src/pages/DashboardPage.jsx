import { CalendarPlus, Clock, Edit3, Play, Square } from 'lucide-react';
import { useMemo, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SessionModal } from '../components/SessionModal';
import { useInterval } from '../hooks/useInterval';
import { formatDate, formatHours, formatTime, formatTimer, hoursBetween } from '../utils/date';

export function DashboardPage({ sessions, activeSession, dashboardStats, startWork, finishWork, saveSession }) {
  const [now, setNow] = useState(new Date());
  const [modal, setModal] = useState(null);

  useInterval(() => setNow(new Date()), activeSession ? 1000 : 30000);

  const activeDuration = useMemo(
    () => (activeSession ? hoursBetween(activeSession.start_time, now) : 0),
    [activeSession, now],
  );

  const recent = sessions.slice(0, 3);
  const lastWork = sessions.find((session) => session.work_type !== 'day_off' && session.total_hours > 0);
  const monthHours = dashboardStats.find((stat) => stat.label === 'Этот месяц')?.value || '0ч 00м';

  return (
    <div className="space-y-4">
      <GlassCard className="relative overflow-hidden">
        <div className="absolute right-4 top-4 h-24 w-24 rounded-full bg-mint/20 blur-2xl" />
        <p className="text-sm text-white/55">{formatDate(now, { weekday: 'long' })}</p>
        <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-4">
          <div>
            <p className="text-sm text-white/45">В этом месяце</p>
            <h2 className="mt-1 text-4xl font-semibold leading-none">{monthHours}</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">последняя</p>
            <p className="mt-1 text-sm font-medium text-white/80">{lastWork ? formatHours(lastWork.total_hours) : 'нет смен'}</p>
          </div>
        </div>
        <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">{activeSession ? 'Сейчас в работе' : 'Готово к старту'}</span>
            <Clock size={18} className="text-mint" />
          </div>
          <div className="mt-3 text-center font-mono text-5xl font-semibold tracking-normal text-white">
            {activeSession ? formatTimer(activeDuration) : '00:00:00'}
          </div>
          {activeSession && (
            <p className="mt-2 text-sm text-white/50">Начало в {formatTime(activeSession.start_time)}</p>
          )}
        </div>
        <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
          <PrimaryButton
            tone={activeSession ? 'danger' : 'mint'}
            onClick={() => (activeSession ? finishWork() : startWork())}
            className="flex items-center justify-center gap-2"
          >
            {activeSession ? <Square size={18} /> : <Play size={18} />}
            {activeSession ? 'Закончить работу' : 'Начать работу'}
          </PrimaryButton>
          <button
            type="button"
            onClick={() => setModal({ mode: activeSession ? 'finish' : 'create', session: activeSession })}
            className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white active:scale-95"
            title="Ручное время"
          >
            {activeSession ? <Edit3 size={20} /> : <CalendarPlus size={20} />}
          </button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        {dashboardStats.map((stat, index) => (
          <GlassCard key={stat.label} className={index === 4 ? 'col-span-2' : ''}>
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-sm text-white/45">{stat.hint}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Последние смены</h3>
          <button type="button" onClick={() => setModal({ mode: 'create' })} className="text-sm text-mint">Добавить</button>
        </div>
        <div className="mt-4 space-y-3">
          {recent.length ? recent.map((session) => (
            <div key={session.id} className="flex items-center justify-between rounded-2xl bg-white/[0.055] px-4 py-3">
              <div>
                <p className="text-sm font-medium">{formatDate(session.start_time)}</p>
                <p className="text-xs text-white/45">
                  {session.work_type === 'day_off' ? 'Без смены' : `${formatTime(session.start_time)} - ${formatTime(session.end_time)}`}
                </p>
              </div>
              <span className="text-sm text-mint">{formatHours(session.total_hours)}</span>
            </div>
          )) : (
            <p className="py-4 text-sm text-white/45">Пока нет записей. Первая смена появится здесь сразу после сохранения.</p>
          )}
        </div>
      </GlassCard>

      <SessionModal
        open={Boolean(modal)}
        mode={modal?.mode === 'create' ? 'create' : 'edit'}
        session={modal?.session}
        onClose={() => setModal(null)}
        onSave={(session) => {
          if (modal?.mode === 'finish' && activeSession) {
            finishWork({ ...session, is_manual_edit: true });
          } else {
            saveSession(session);
          }
        }}
      />
    </div>
  );
}
