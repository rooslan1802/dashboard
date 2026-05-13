import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { fromDatetimeLocal, toDatetimeLocal } from '../utils/date';
import { PrimaryButton } from './PrimaryButton';

const workTypes = [
  ['office', 'Офис'],
  ['home', 'Удаленка'],
  ['business_trip', 'Командировка'],
  ['day_off', 'Выходной'],
];

export function SessionModal({ open, session, mode = 'create', onClose, onSave }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    const start = session?.start_time || new Date(now.getTime() - 8 * 36e5).toISOString();
    const end = session?.end_time || now.toISOString();
    setForm({
      ...session,
      start_time: toDatetimeLocal(start),
      end_time: toDatetimeLocal(end),
      work_type: session?.work_type || 'office',
      notes: session?.notes || '',
    });
  }, [open, session]);

  if (!open || !form) return null;

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      start_time: fromDatetimeLocal(form.start_time),
      end_time: fromDatetimeLocal(form.end_time),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/60 px-3 pb-3 backdrop-blur-sm">
      <motion.form
        onSubmit={submit}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="w-full max-w-md rounded-[32px] border border-white/10 bg-panel p-5 shadow-soft"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/35">{mode === 'edit' ? 'Редактирование' : 'Новая смена'}</p>
            <h2 className="mt-1 text-lg font-semibold">Время и детали</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/8 text-white/70">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm text-white/70">
            Начало
            <input
              type="datetime-local"
              value={form.start_time}
              onChange={(event) => update('start_time', event.target.value)}
              className="input"
              required
            />
          </label>
          <label className="grid gap-2 text-sm text-white/70">
            Конец
            <input
              type="datetime-local"
              value={form.end_time}
              onChange={(event) => update('end_time', event.target.value)}
              className="input"
              required
            />
          </label>
          <label className="grid gap-2 text-sm text-white/70">
            Тип работы
            <select value={form.work_type} onChange={(event) => update('work_type', event.target.value)} className="input">
              {workTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-white/70">
            Заметка
            <textarea
              value={form.notes}
              onChange={(event) => update('notes', event.target.value)}
              className="input min-h-24 resize-none"
              placeholder="Например: табеля днем, командировка, созвоны, дорога"
            />
          </label>
          <PrimaryButton type="submit">Сохранить смену</PrimaryButton>
        </div>
      </motion.form>
    </div>
  );
}
