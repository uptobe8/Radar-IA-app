import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, TrendingUp, Newspaper, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const navItems = [
    { id: 'home', icon: Home, route: '/', key: 'nav.home' },
    { id: 'trends', icon: TrendingUp, route: '/trends', key: 'nav.trends' },
    { id: 'insights', icon: Search, route: '/insights', key: 'nav.insights' },
    { id: 'calendar', icon: FileText, route: '/calendar', key: 'nav.calendar' },
];

export default function BottomNav() {
    const { isDark } = useTheme();
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <motion.nav
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className={`
        fixed bottom-6 left-1/2 -translate-x-1/2
        px-8 py-4
        rounded-full
        backdrop-blur-xl
        ${isDark
                    ? 'bg-slate-800/90 border border-white/10'
                    : 'bg-white/90 border border-slate-200'
                }
        shadow-2xl
        z-50
        flex items-center gap-8
      `}
        >
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.route;

                return (
                    <motion.button
                        key={item.id}
                        onClick={() => navigate(item.route)}
                        className="relative flex flex-col items-center gap-1"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {/* Active indicator glow */}
                        {isActive && (
                            <motion.div
                                layoutId="navGlow"
                                className={`
                  absolute -inset-3 rounded-full
                  bg-cyan-400/20
                  blur-md
                `}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}

                        <motion.div
                            animate={{
                                color: isActive
                                    ? '#22D3EE'
                                    : isDark ? '#94A3B8' : '#64748B',
                            }}
                            className="relative z-10"
                        >
                            <Icon
                                className={`w-6 h-6 ${isActive
                                    ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                                    : ''
                                    }`}
                                strokeWidth={isActive ? 2 : 1.5}
                            />
                        </motion.div>
                    </motion.button>
                );
            })}
        </motion.nav>
    );
}
