import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Activity, BarChart3, Brain, Clock3, History, Settings } from 'lucide-react';
import { useToast } from './hooks/useToast';
import { useWorkSessions } from './hooks/useWorkSessions';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ToastStack } from './components/ToastStack';

const tabs = [
  { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
  { id: 'history', label: 'История', icon: History },
  { id: 'insights', label: 'Инсайты', icon: Brain },
  { id: 'dashboard', label: 'Главная', icon: Clock3 },
  { id: 'settings', label: 'Настройки', icon: Settings },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toasts, showToast } = useToast();
  const work = useWorkSessions(showToast);
  const ActiveIcon = tabs.find((tab) => tab.id === activeTab)?.icon || Activity;

  const page = useMemo(() => {
    const props = { ...work, showToast };
    return {
      dashboard: <DashboardPage {...props} />,
      history: <HistoryPage {...props} />,
      analytics: <AnalyticsPage {...props} />,
      insights: <InsightsPage {...props} />,
      settings: <SettingsPage {...props} />,
    }[activeTab];
  }, [activeTab, work, showToast]);

  return (
    <div className="min-h-screen overflow-hidden bg-ink text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-mint/20 blur-3xl" />
        <div className="absolute -right-24 top-48 h-72 w-72 rounded-full bg-coral/16 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky/12 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col pb-24">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/70 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/40">Job Analytics</p>
              <h1 className="mt-1 text-xl font-semibold">{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/10 shadow-glow">
              <ActiveIcon size={20} className="text-mint" />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
            >
              {page}
            </motion.div>
          </AnimatePresence>
        </main>

        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-5 rounded-[28px] border border-white/10 bg-panel/86 p-2 shadow-soft backdrop-blur-2xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] text-white/50 transition active:scale-95"
                >
                  {selected && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-2xl bg-white/10"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon size={19} className={`relative ${selected ? 'text-mint' : ''}`} />
                  <span className={`relative ${selected ? 'text-white' : ''}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <ToastStack toasts={toasts} />
    </div>
  );
}
