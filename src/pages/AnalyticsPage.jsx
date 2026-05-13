import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { averageStartEnd, buildDailyChart, buildMonthComparison, buildWeeklyChart } from '../utils/analytics';
import { formatHours } from '../utils/date';

const tooltipStyle = {
  background: '#10131f',
  border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 16,
  color: '#fff',
  boxShadow: '0 18px 48px rgba(0,0,0,.36)',
};

const hourTick = (value) => `${value} ч`;
const hourValue = (value) => [`${value} ч`, 'Часы'];

export function AnalyticsPage({ sessions, settings }) {
  const daily = buildDailyChart(sessions);
  const weekly = buildWeeklyChart(sessions);
  const months = buildMonthComparison(sessions);
  const avg = sessions.length ? sessions.reduce((sum, s) => sum + s.total_hours, 0) / sessions.length : 0;
  const overtime = sessions.filter((s) => s.total_hours > Number(settings.overtimeThreshold || 8)).length;
  const weekends = sessions.filter((s) => [0, 6].includes(new Date(s.start_time).getDay())).length;
  const avgTimes = averageStartEnd(sessions);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Средняя смена" value={formatHours(avg)} />
        <MetricCard label="Переработки" value={overtime} tone="text-coral" />
        <MetricCard label="Смены в выходные" value={weekends} tone="text-sky" />
        <MetricCard label="Средний старт" value={avgTimes.start} />
      </div>

      <ChartCard title="Часы по дням">
        <ScrollableChart minWidth={Math.max(640, daily.length * 58)}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="hours" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#62f6c8" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#62f6c8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
              <XAxis dataKey="day" stroke="rgba(255,255,255,.32)" tickLine={false} axisLine={false} fontSize={11} interval={0} />
              <YAxis stroke="rgba(255,255,255,.24)" tickLine={false} axisLine={false} width={38} fontSize={11} tickFormatter={hourTick} />
              <Tooltip contentStyle={tooltipStyle} formatter={hourValue} cursor={{ stroke: 'rgba(98,246,200,.18)', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="hours" stroke="#62f6c8" strokeWidth={3} fill="url(#hours)" />
            </AreaChart>
          </ResponsiveContainer>
        </ScrollableChart>
      </ChartCard>

      <ChartCard title="Недельная нагрузка">
        <ScrollableChart minWidth={Math.max(560, weekly.length * 76)}>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={weekly}>
              <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
              <XAxis dataKey="week" stroke="rgba(255,255,255,.32)" tickLine={false} axisLine={false} fontSize={11} interval={0} />
              <YAxis stroke="rgba(255,255,255,.24)" tickLine={false} axisLine={false} width={38} fontSize={11} tickFormatter={hourTick} />
              <Tooltip contentStyle={tooltipStyle} formatter={hourValue} cursor={{ fill: 'rgba(255,255,255,.035)' }} />
              <Bar dataKey="hours" fill="#69c7ff" radius={[12, 12, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </ScrollableChart>
      </ChartCard>

      <ChartCard title="Сравнение месяцев">
        <ScrollableChart minWidth={Math.max(520, months.length * 96)}>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={months}>
              <XAxis dataKey="month" stroke="rgba(255,255,255,.32)" tickLine={false} axisLine={false} fontSize={11} interval={0} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} formatter={hourValue} cursor={false} />
              <Bar dataKey="hours" fill="#ff6f61" radius={[12, 12, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </ScrollableChart>
        <p className="mt-2 text-sm text-white/45">Среднее окончание работы: {avgTimes.end}</p>
      </ChartCard>
    </div>
  );
}

function MetricCard({ label, value, tone = 'text-white' }) {
  return (
    <GlassCard className="p-3.5">
      <p className="text-xs leading-4 text-white/45">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${tone}`}>{value}</p>
    </GlassCard>
  );
}

function ChartCard({ title, children }) {
  return (
    <GlassCard>
      <h3 className="mb-4 font-semibold">{title}</h3>
      {children}
    </GlassCard>
  );
}

function ScrollableChart({ minWidth, children }) {
  return (
    <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-2">
      <div style={{ minWidth }} className="h-full">
        {children}
      </div>
    </div>
  );
}
