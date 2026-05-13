import { Download, RotateCcw, Trash2, Upload } from 'lucide-react';
import { useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { sessionStore } from '../services/workSessionService';

export function SettingsPage({ settings, updateSettings, clearHistory, refresh, showToast }) {
  const inputRef = useRef(null);

  const exportData = () => {
    const blob = new Blob([sessionStore.exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `work-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Резервная копия экспортирована');
  };

  const restoreData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      sessionStore.importData(await file.text());
      await refresh();
      showToast('Резервная копия восстановлена');
    } catch {
      showToast('Не удалось восстановить файл', 'warning');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard>
        <h3 className="font-semibold">Порог нагрузки</h3>
        <div className="mt-4 grid gap-4">
          <label className="grid gap-2 text-sm text-white/70">
            Переработка начинается после, часов
            <input
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={settings.overtimeThreshold}
              onChange={(event) => updateSettings({ overtimeThreshold: Number(event.target.value) })}
              className="input"
            />
          </label>
          <p className="rounded-2xl border border-white/8 bg-white/[0.055] p-4 text-sm leading-6 text-white/55">
            Если указать 8, смены длиннее 8 часов будут отмечаться как переработка в истории, статистике и инсайтах.
          </p>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold">Данные</h3>
        <div className="mt-4 grid gap-3">
          <PrimaryButton onClick={exportData} className="flex items-center justify-center gap-2">
            <Download size={18} /> Экспорт данных
          </PrimaryButton>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/8 font-semibold active:scale-95"
          >
            <Upload size={18} /> Восстановить копию
          </button>
          <input ref={inputRef} type="file" accept="application/json" onChange={restoreData} className="hidden" />
          <button
            type="button"
            onClick={() => {
              if (confirm('Очистить всю историю?')) clearHistory();
            }}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-coral/14 font-semibold text-coral active:scale-95"
          >
            <Trash2 size={18} /> Очистить историю
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-semibold">Установка и работа без сети</h3>
        <div className="mt-4 space-y-3 text-sm leading-6 text-white/58">
          <p>Приложение можно установить на телефон. Оно открывается на весь экран и сохраняет интерфейс для быстрого запуска.</p>
          <p>Если сеть пропадет, смены сохраняются на устройстве и отправляются в базу при восстановлении соединения.</p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white/8 text-sm active:scale-95"
        >
          <RotateCcw size={16} /> Обновить приложение
        </button>
      </GlassCard>
    </div>
  );
}
