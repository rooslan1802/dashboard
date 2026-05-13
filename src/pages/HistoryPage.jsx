import { ArrowDown, ArrowUp, Pencil, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { SessionModal } from '../components/SessionModal';
import { formatDate, formatHours, formatTime } from '../utils/date';
import { getSessionStatus, getStatusTone } from '../utils/analytics';

const filters = [
  ['all', 'Все'],
  ['overtime', 'Переработка'],
  ['short', 'Короткие'],
  ['home', 'Удаленка'],
  ['business_trip', 'Командировки'],
];

const workTypeLabels = {
  office: 'Офис',
  home: 'Удаленка',
  business_trip: 'Командировка',
  day_off: 'Выходной',
};

const monthKey = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const sessionTimeLabel = (session) => {
  if (session.work_type === 'day_off') return 'Без смены';
  return `${formatTime(session.start_time)} - ${formatTime(session.end_time)}`;
};

export function HistoryPage({ sessions, settings, saveSession, deleteSession }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [month, setMonth] = useState('all');
  const [editing, setEditing] = useState(null);
  const [nearBottom, setNearBottom] = useState(false);

  useEffect(() => {
    const update = () => {
      const distance = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      setNearBottom(distance < 260);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const months = useMemo(() => {
    const unique = [...new Set(sessions.map((session) => monthKey(session.start_time)))];
    return unique.map((key) => {
      const [year, monthNumber] = key.split('-').map(Number);
      return {
        key,
        label: new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(new Date(year, monthNumber - 1, 1)).replace('.', ''),
      };
    });
  }, [sessions]);

  const filtered = useMemo(() => sessions.filter((session) => {
    const haystack = `${session.notes} ${workTypeLabels[session.work_type] || ''} ${formatDate(session.start_time)}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesMonth = month === 'all' || monthKey(session.start_time) === month;
    const matchesFilter =
      filter === 'all' ||
      (filter === 'overtime' && session.total_hours > Number(settings.overtimeThreshold || 8)) ||
      (filter === 'short' && session.total_hours > 0 && session.total_hours < 5) ||
      session.work_type === filter;
    return matchesQuery && matchesMonth && matchesFilter;
  }), [sessions, query, filter, month, settings.overtimeThreshold]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по заметкам, типу, дате"
          className="input h-14 pl-6 pr-14"
        />
        <Search className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-white/35" size={18} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`shrink-0 rounded-2xl border px-4 py-2 text-sm transition active:scale-95 ${
              filter === value ? 'border-mint/40 bg-mint/15 text-mint' : 'border-white/10 bg-white/7 text-white/55'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setMonth('all')}
          className={`shrink-0 rounded-2xl border px-4 py-2 text-sm transition active:scale-95 ${
            month === 'all' ? 'border-sky/40 bg-sky/15 text-sky' : 'border-white/10 bg-white/7 text-white/55'
          }`}
        >
          Все месяцы
        </button>
        {months.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setMonth(item.key)}
            className={`shrink-0 rounded-2xl border px-4 py-2 text-sm capitalize transition active:scale-95 ${
              month === item.key ? 'border-sky/40 bg-sky/15 text-sky' : 'border-white/10 bg-white/7 text-white/55'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((session) => {
            const status = getSessionStatus(session, settings);
            const note = session.notes?.trim();
            const showNote = note && note !== status && note !== workTypeLabels[session.work_type];
            return (
              <div key={session.id} className="rounded-3xl border border-white/10 bg-white/[0.07] px-4 py-3 shadow-soft backdrop-blur-2xl">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{formatDate(session.start_time, { weekday: 'short' })}</p>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] ${getStatusTone(status)}`}>{status}</span>
                    </div>
                    <p className="mt-1 text-sm text-white/50">
                      {sessionTimeLabel(session)} · {workTypeLabels[session.work_type] || 'Работа'}
                    </p>
                    {showNote && <p className="mt-1 truncate text-sm text-white/45">{note}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-mint">{formatHours(session.total_hours)}</p>
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => setEditing(session)}
                        className="grid h-9 w-9 place-items-center rounded-2xl bg-white/8 text-white/75 active:scale-95"
                        title="Исправить"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="grid h-9 w-9 place-items-center rounded-2xl bg-coral/12 text-coral active:scale-95"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="История пуста" text="Добавьте смену вручную или завершите активную работу, чтобы увидеть записи." />
      )}

      <SessionModal open={Boolean(editing)} mode="edit" session={editing} onClose={() => setEditing(null)} onSave={saveSession} />
      <div className="fixed bottom-28 right-[max(1rem,calc((100vw-28rem)/2+1rem))] z-30">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: nearBottom ? 0 : document.documentElement.scrollHeight, behavior: 'smooth' })}
          className="grid h-16 w-16 place-items-center rounded-full border border-white/20 bg-panel/92 text-mint shadow-soft backdrop-blur-2xl ring-1 ring-white/10 active:scale-95"
          title={nearBottom ? 'Вверх' : 'Вниз'}
        >
          {nearBottom ? <ArrowUp size={25} /> : <ArrowDown size={25} />}
        </button>
      </div>
    </div>
  );
}
