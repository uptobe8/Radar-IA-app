import { motion } from 'framer-motion';
import { Lightbulb, CheckCircle2, Target, Sparkles } from 'lucide-react';
import BackgroundParticles from '../components/BackgroundParticles';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function InsightsView() {
    const { t } = useLanguage();
    const { isDark } = useTheme();
    const results = JSON.parse(localStorage.getItem('trendResults') || '{}');
    const query = localStorage.getItem('lastQuery') || '';

    const patterns = results.patterns || [];

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 px-4 py-20 pb-32">
            <BackgroundParticles />

            <div className="max-w-4xl mx-auto relative z-10">
                <header className="mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-sm font-medium mb-4"
                    >
                        <Lightbulb className="w-4 h-4" />
                        {t('insights.title')}
                    </motion.div>
                    <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Patrones Detectados
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {patterns.length} patrones clave para <span className="text-violet-500 font-bold">{query}</span>
                    </p>
                </header>

                <div className="grid gap-5">
                    {patterns.map((item, i) => {
                        // Handle both string patterns (old format) and object patterns (new format)
                        const isObject = typeof item === 'object';
                        const pattern = isObject ? item.pattern : item;
                        const evidence = isObject ? item.evidence : null;
                        const recommendation = isObject ? item.recommendation : null;

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`
                                    p-5 rounded-2xl border backdrop-blur-md
                                    ${isDark ? 'bg-slate-900/50 border-white/10' : 'bg-white/60 border-slate-200'}
                                    hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10
                                `}
                            >
                                {/* Main Pattern */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="mt-0.5 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                    <p className={`text-lg font-semibold leading-relaxed ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {pattern}
                                    </p>
                                </div>

                                {/* Evidence */}
                                {evidence && evidence.length > 0 && (
                                    <div className={`ml-11 mb-4 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="w-4 h-4 text-amber-500" />
                                            <span className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Evidencia
                                            </span>
                                        </div>
                                        <ul className="space-y-1">
                                            {evidence.map((e, j) => (
                                                <li key={j} className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    • {e}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Recommendation */}
                                {recommendation && (
                                    <div className={`ml-11 p-3 rounded-xl border-l-4 border-cyan-500 ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-50'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Target className="w-4 h-4 text-cyan-500" />
                                            <span className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                                Acción Recomendada
                                            </span>
                                        </div>
                                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                            {recommendation}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
