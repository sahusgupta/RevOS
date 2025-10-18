import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  glow?: 'maroon' | 'gold' | 'none';
  gradient?: boolean;
}

export function GlassPanel({ children, className = '', glow = 'none', gradient = false }: GlassPanelProps) {
  const glowClass = glow === 'maroon' ? 'glow-maroon' : glow === 'gold' ? 'glow-gold' : '';
  const gradientClass = gradient ? 'gradient-maroon' : '';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass-panel rounded-2xl p-6 ${glowClass} ${gradientClass} ${className}`}
    >
      {children}
    </motion.div>
  );
}
