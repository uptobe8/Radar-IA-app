import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const colorVariants = {
    cyan: {
        gradient: 'from-cyan-400/20 via-cyan-500/10 to-transparent',
        border: 'border-cyan-400/50',
        glow: 'shadow-[0_0_40px_rgba(34,211,238,0.3)]',
        hoverGlow: 'hover:shadow-[0_0_60px_rgba(34,211,238,0.5)]',
        iconBg: 'bg-gradient-to-br from-cyan-400/30 to-cyan-600/20',
        dot: 'bg-cyan-400',
    },
    purple: {
        gradient: 'from-purple-400/20 via-purple-500/10 to-transparent',
        border: 'border-purple-400/50',
        glow: 'shadow-[0_0_40px_rgba(168,85,247,0.3)]',
        hoverGlow: 'hover:shadow-[0_0_60px_rgba(168,85,247,0.5)]',
        iconBg: 'bg-gradient-to-br from-purple-400/30 to-purple-600/20',
        dot: 'bg-purple-400',
    },
    orange: {
        gradient: 'from-orange-400/20 via-orange-500/10 to-transparent',
        border: 'border-orange-400/50',
        glow: 'shadow-[0_0_40px_rgba(249,115,22,0.3)]',
        hoverGlow: 'hover:shadow-[0_0_60px_rgba(249,115,22,0.5)]',
        iconBg: 'bg-gradient-to-br from-orange-400/30 to-orange-600/20',
        dot: 'bg-orange-400',
    },
    blue: {
        gradient: 'from-blue-400/20 via-blue-500/10 to-transparent',
        border: 'border-blue-400/50',
        glow: 'shadow-[0_0_40px_rgba(59,130,246,0.3)]',
        hoverGlow: 'hover:shadow-[0_0_60px_rgba(59,130,246,0.5)]',
        iconBg: 'bg-gradient-to-br from-blue-400/30 to-blue-600/20',
        dot: 'bg-blue-400',
    },
};

export default function GlassCard({
    title,
    description,
    icon: Icon,
    color = 'cyan',
    route,
    delay = 0
}) {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const variant = colorVariants[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay }}
            whileHover={{
                scale: 1.02,
                y: -5,
            }}
            onClick={() => route && navigate(route)}
            className={`
        relative cursor-pointer
        w-full max-w-[220px] h-[320px]
        rounded-3xl overflow-hidden
        backdrop-blur-xl
        ${isDark
                    ? 'bg-white/5 border border-white/10'
                    : 'bg-white/40 border border-white/50'
                }
        ${variant.glow}
        ${variant.hoverGlow}
        transition-all duration-300
        flex flex-col items-center justify-center
        px-6 py-8
        group
      `}
        >
            {/* Gradient overlay */}
            <div
                className={`
          absolute inset-0 
          bg-gradient-to-b ${variant.gradient}
          opacity-60
        `}
            />

            {/* Border glow effect */}
            <div
                className={`
          absolute inset-0 rounded-3xl
          border-2 ${variant.border}
          opacity-30 group-hover:opacity-60
          transition-opacity duration-300
        `}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center">
                {/* Icon container */}
                <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    className={`
            w-20 h-20 rounded-full
            ${variant.iconBg}
            backdrop-blur-sm
            flex items-center justify-center
            mb-6
            border border-white/20
            shadow-lg
          `}
                >
                    <Icon
                        className={`w-10 h-10 ${isDark ? 'text-white' : 'text-slate-700'}`}
                        strokeWidth={1.5}
                    />
                </motion.div>

                {/* Title */}
                <h3 className={`
          text-lg font-semibold mb-2
          ${isDark ? 'text-white' : 'text-slate-800'}
        `}>
                    {title}
                </h3>

                {/* Description */}
                <p className={`
          text-sm leading-relaxed
          ${isDark ? 'text-white/70' : 'text-slate-600'}
        `}>
                    {description}
                </p>
            </div>

            {/* Dots indicator */}
            <div className="absolute bottom-6 flex gap-2">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className={`w-2 h-2 rounded-full ${i === 0 ? variant.dot : 'bg-white/30'}`}
                        animate={i === 0 ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                ))}
            </div>
        </motion.div>
    );
}
