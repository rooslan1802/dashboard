import { motion } from 'framer-motion';

export function PrimaryButton({ children, tone = 'mint', className = '', ...props }) {
  const toneClass = tone === 'danger'
    ? 'from-coral to-amber text-ink'
    : 'from-mint to-sky text-ink';

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      className={`min-h-14 rounded-2xl bg-gradient-to-r ${toneClass} px-5 font-semibold shadow-glow transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
