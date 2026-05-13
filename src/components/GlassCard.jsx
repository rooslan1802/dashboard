import { motion } from 'framer-motion';

export function GlassCard({ children, className = '', onClick }) {
  const Component = onClick ? motion.button : motion.div;
  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      className={`w-full rounded-3xl border border-white/10 bg-white/[0.075] p-4 text-left shadow-soft backdrop-blur-2xl ${className}`}
    >
      {children}
    </Component>
  );
}
