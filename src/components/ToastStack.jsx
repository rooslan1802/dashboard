import { AnimatePresence, motion } from 'framer-motion';

export function ToastStack({ toasts }) {
  return (
    <div className="fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-50 w-full max-w-md -translate-x-1/2 px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            className={`mb-2 rounded-2xl border px-4 py-3 text-sm shadow-soft backdrop-blur-2xl ${
              toast.tone === 'warning'
                ? 'border-amber/25 bg-amber/15 text-amber'
                : 'border-mint/25 bg-mint/15 text-mint'
            }`}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
