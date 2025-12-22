import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <motion.button
            onClick={toggleTheme}
            className={`
        relative flex items-center gap-2
        px-3 py-2 rounded-full
        backdrop-blur-xl
        ${isDark
                    ? 'bg-slate-800/80 border border-white/10'
                    : 'bg-white/80 border border-slate-200'
                }
        shadow-lg
        transition-colors duration-300
      `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Sun icon */}
            <motion.div
                animate={{
                    opacity: isDark ? 0.5 : 1,
                    scale: isDark ? 0.9 : 1,
                }}
                transition={{ duration: 0.2 }}
            >
                <Sun
                    className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-amber-500'
                        }`}
                />
            </motion.div>

            {/* Toggle switch */}
            <div className={`
        relative w-12 h-6 rounded-full
        ${isDark ? 'bg-slate-700' : 'bg-slate-200'}
        transition-colors duration-300
      `}>
                <motion.div
                    className={`
            absolute top-1 w-4 h-4 rounded-full
            ${isDark
                            ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                            : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                        }
          `}
                    animate={{
                        x: isDark ? 26 : 4,
                    }}
                    transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30
                    }}
                />
            </div>

            {/* Moon icon */}
            <motion.div
                animate={{
                    opacity: isDark ? 1 : 0.5,
                    scale: isDark ? 1 : 0.9,
                }}
                transition={{ duration: 0.2 }}
            >
                <Moon
                    className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-slate-400'
                        }`}
                />
            </motion.div>
        </motion.button>
    );
}
