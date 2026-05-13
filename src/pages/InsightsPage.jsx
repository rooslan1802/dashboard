import { Brain, Calculator, HeartPulse, TrendingUp } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { buildInsights } from '../utils/analytics';

export function InsightsPage({ sessions, activeSession, settings }) {
  const insights = buildInsights(sessions, activeSession, settings);
  const color = insights.level === 'red' ? 'text-coral' : insights.level === 'yellow' ? 'text-amber' : 'text-mint';
  const label = insights.level === 'red' ? 'Высокий' : insights.level === 'yellow' ? 'Средний' : 'Зеленый';

  return (
    <div className="space-y-4">
      <GlassCard className="relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-mint/20 blur-3xl" />
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-mint/12 text-mint">
            <Brain size={22} />
          </div>
          <div>
            <p className="text-sm text-white/45">Оценка нагрузки</p>
            <h2 className="text-xl font-semibold">Уровень нагрузки: <span className={color}>{label}</span></h2>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Score label="Риск выгорания" value={insights.burnoutScore} tone={color} />
          <Score label="Усталость" value={insights.fatigueScore} tone="text-amber" />
          <Score label="Продуктивность" value={insights.productivity} tone="text-mint" />
        </div>
        <div className="mt-4 rounded-2xl border border-white/8 bg-black/15 p-3 text-xs leading-5 text-white/50">
          Оценка считается за последние 14 дней: средняя смена, доля переработок, дни подряд и доля выходных.
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2">
          <Calculator size={18} className="text-mint" />
          <h3 className="font-semibold">Формула оценки</h3>
        </div>
        <div className="mt-4 grid gap-2 text-sm leading-6 text-white/62">
          <p>Усталость = часы выше порога + доля переработок + длинная серия - выходные.</p>
          <p>Риск выгорания = усталость + мало выходных + переработки + длинная серия.</p>
          <p>Продуктивность снижается, когда усталость и переработки растут.</p>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2">
          <HeartPulse size={19} className="text-coral" />
          <h3 className="font-semibold">Рекомендации по отдыху</h3>
        </div>
        <div className="mt-4 space-y-3">
          {insights.recommendations.map((text) => (
            <div key={text} className="rounded-2xl border border-white/8 bg-white/[0.055] p-4 text-sm leading-6 text-white/70">
              {text}
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2">
          <TrendingUp size={19} className="text-sky" />
          <h3 className="font-semibold">Итоги недели</h3>
        </div>
        <div className="mt-4 grid gap-3">
          <InsightLine label="Выходных за 14 дней" value={insights.daysOff} />
          <InsightLine label="Средняя смена" value={`${insights.avgHours.toFixed(1)}ч`} />
          <InsightLine label="Дней с переработкой" value={insights.overtimeDays} />
        </div>
      </GlassCard>
    </div>
  );
}

function Score({ label, value, tone }) {
  return (
    <div className="rounded-2xl bg-white/[0.055] p-3 text-center">
      <p className="text-xs text-white/40">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function InsightLine({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/[0.055] px-4 py-3">
      <span className="text-sm text-white/55">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
