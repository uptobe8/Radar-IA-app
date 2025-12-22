import { motion } from 'framer-motion';
import { Youtube, Instagram, Music, Globe, BarChart3, TrendingUp, Eye, Zap } from 'lucide-react';
import BackgroundParticles from '../components/BackgroundParticles';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const PlatformIcon = ({ platform }) => {
    switch (platform.toLowerCase()) {
        case 'youtube': return <Youtube className="w-5 h-5 text-red-500" />;
        case 'instagram': return <Instagram className="w-5 h-5 text-pink-500" />;
        case 'tiktok': return <Music className="w-5 h-5 text-cyan-400" />;
        default: return <Globe className="w-5 h-5 text-blue-400" />;
    }
};

const VelocityBadge = ({ velocity, isDark }) => {
    const styles = {
        viral: 'bg-gradient-to-r from-pink-500 to-orange-500 text-white',
        trending: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white',
        growing: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        stable: 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
    };
    const labels = { viral: '🔥 VIRAL', trending: '📈 Trending', growing: '↗️ Creciendo', stable: '→ Estable' };

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${styles[velocity] || styles.stable}`}>
            {labels[velocity] || velocity}
        </span>
    );
};

export default function TrendAnalysis() {
    const { t } = useLanguage();
    const { isDark } = useTheme();
    const results = JSON.parse(localStorage.getItem('trendResults') || '{}');
    const query = localStorage.getItem('lastQuery') || '';

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 px-4 py-20 pb-32">
            <BackgroundParticles />

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-sm font-medium mb-4"
                    >
                        <BarChart3 className="w-4 h-4" />
                        {t('nav.trends')}
                    </motion.div>
                    <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {t('search.resultsFor')} <span className="text-cyan-500">{query}</span>
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {(results.trends || []).length} tendencias detectadas en tiempo real
                    </p>
                </header>

                <div className="grid gap-4">
                    {(results.trends || []).map((trend, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`
                                rounded-2xl p-5 border backdrop-blur-xl
                                ${isDark ? 'bg-slate-900/50 border-white/10 hover:border-cyan-500/30' : 'bg-white/60 border-slate-200 hover:border-cyan-500/50'}
                                transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10
                            `}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex-1 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <PlatformIcon platform={trend.platform} />
                                        <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {trend.platform}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                            {trend.format}
                                        </span>
                                    </div>
                                    <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {trend.title}
                                    </h3>
                                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                        💡 {trend.insight}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    {trend.views && (
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                            <Eye className="w-4 h-4 text-cyan-500" />
                                            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{trend.views}</span>
                                        </div>
                                    )}
                                    {trend.engagement && (
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{trend.engagement}</span>
                                        </div>
                                    )}
                                    {trend.velocity && <VelocityBadge velocity={trend.velocity} isDark={isDark} />}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
