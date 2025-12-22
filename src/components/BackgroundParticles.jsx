import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const generateParticles = (count) => {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        duration: Math.random() * 10 + 8,
        delay: Math.random() * 5,
    }));
};

export default function BackgroundParticles() {
    const { isDark } = useTheme();
    const [particles] = useState(() => generateParticles(50));

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Gradient background */}
            <div
                className={`absolute inset-0 transition-all duration-700 ${isDark
                        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
                        : 'bg-gradient-to-br from-cyan-50 via-white to-rose-50'
                    }`}
            />

            {/* Ambient glow orbs */}
            <motion.div
                className={`absolute w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-300/20'
                    }`}
                style={{ top: '10%', left: '10%' }}
                animate={{
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            <motion.div
                className={`absolute w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-300/15'
                    }`}
                style={{ top: '50%', right: '15%' }}
                animate={{
                    x: [0, -40, 0],
                    y: [0, 40, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            <motion.div
                className={`absolute w-72 h-72 rounded-full blur-3xl ${isDark ? 'bg-orange-500/10' : 'bg-orange-300/15'
                    }`}
                style={{ bottom: '20%', left: '30%' }}
                animate={{
                    x: [0, 60, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Floating particles */}
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className={`absolute rounded-full ${isDark ? 'bg-white/40' : 'bg-slate-400/30'
                        }`}
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
}
