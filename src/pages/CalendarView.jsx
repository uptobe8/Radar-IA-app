import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Youtube, Instagram, Music, Globe, Send, Hash, Volume2, Image, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import BackgroundParticles from '../components/BackgroundParticles';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const PlatformIcon = ({ platform }) => {
    const p = (platform || '').toLowerCase();
    if (p === 'youtube') return <Youtube className="w-4 h-4" />;
    if (p === 'instagram') return <Instagram className="w-4 h-4" />;
    if (p === 'tiktok') return <Music className="w-4 h-4" />;
    return <Globe className="w-4 h-4" />;
};

const PillarBadge = ({ pillar, isDark }) => {
    const colors = {
        'Educativo': 'from-blue-500 to-cyan-500',
        'Educational': 'from-blue-500 to-cyan-500',
        'Entretenimiento': 'from-pink-500 to-orange-500',
        'Entertainment': 'from-pink-500 to-orange-500',
        'Comunidad': 'from-green-500 to-emerald-500',
        'Community': 'from-green-500 to-emerald-500',
        'Autoridad': 'from-violet-500 to-purple-500',
        'Authority': 'from-violet-500 to-purple-500',
        'Motivacional': 'from-amber-500 to-yellow-500',
        'Motivational': 'from-amber-500 to-yellow-500'
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${colors[pillar] || 'from-slate-500 to-slate-600'}`}>
            {pillar}
        </span>
    );
};

function CalendarCard({ item, index, isDark }) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const fullText = `${item.hook}\n\n${item.copy}\n\n${item.cta}\n\n${(item.hashtags || []).join(' ')}`;
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
                rounded-2xl border backdrop-blur-md overflow-hidden
                ${isDark ? 'bg-slate-900/50 border-white/10' : 'bg-white/60 border-slate-200'}
                hover:border-orange-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10
            `}
        >
            {/* Header */}
            <div className="p-4 pb-3">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/30`}>
                            {item.day}
                        </div>
                        <div>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.date}</p>
                            <div className="flex items-center gap-1.5">
                                <PlatformIcon platform={item.platform} />
                                <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.platform}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <PillarBadge pillar={item.pillar} isDark={isDark} />
                        <span className={`text-[10px] px-2 py-0.5 rounded ${isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                            {item.format}
                        </span>
                    </div>
                </div>

                {/* Hook */}
                <p className={`text-base font-bold leading-snug mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {item.hook || item.idea}
                </p>

                {/* CTA Preview */}
                <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                    <Send className="w-3.5 h-3.5" />
                    <span className="font-medium">{item.cta}</span>
                </div>
            </div>

            {/* Expand Button */}
            <button
                onClick={() => setExpanded(!expanded)}
                className={`w-full px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium transition-colors
                    ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}
                `}
            >
                {expanded ? 'Ver menos' : 'Ver copy completo'}
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                            {/* Full Copy */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Copy Completo
                                    </span>
                                    <button
                                        onClick={handleCopy}
                                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors
                                            ${copied
                                                ? 'bg-emerald-500/20 text-emerald-500'
                                                : isDark ? 'bg-white/10 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-700'
                                            }
                                        `}
                                    >
                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copied ? 'Copiado!' : 'Copiar'}
                                    </button>
                                </div>
                                <div className={`p-3 rounded-xl text-sm whitespace-pre-line leading-relaxed ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
                                    {item.copy}
                                </div>
                            </div>

                            {/* Hashtags */}
                            {item.hashtags && item.hashtags.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex items-center gap-1 mb-2">
                                        <Hash className="w-3 h-3 text-cyan-500" />
                                        <span className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Hashtags
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {item.hashtags.map((tag, i) => (
                                            <span key={i} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Audio Suggestion */}
                            {item.suggestedAudio && (
                                <div className="mb-4">
                                    <div className="flex items-center gap-1 mb-2">
                                        <Volume2 className="w-3 h-3 text-pink-500" />
                                        <span className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Audio Sugerido
                                        </span>
                                    </div>
                                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {item.suggestedAudio}
                                    </p>
                                </div>
                            )}

                            {/* Visual Description */}
                            {item.visualDescription && (
                                <div>
                                    <div className="flex items-center gap-1 mb-2">
                                        <Image className="w-3 h-3 text-violet-500" />
                                        <span className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Visual
                                        </span>
                                    </div>
                                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {item.visualDescription}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function CalendarView() {
    const { t } = useLanguage();
    const { isDark } = useTheme();
    const results = JSON.parse(localStorage.getItem('trendResults') || '{}');
    const query = localStorage.getItem('lastQuery') || '';
    const calendar = results.calendar || [];

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 px-4 py-20 pb-32">
            <BackgroundParticles />

            <div className="max-w-6xl mx-auto relative z-10">
                <header className="mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-sm font-medium mb-4"
                    >
                        <CalendarIcon className="w-4 h-4" />
                        {t('calendar.title')}
                    </motion.div>
                    <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Calendario de 10 Días
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Estrategia completa con copy listo para publicar · <span className="text-orange-500 font-bold">{query}</span>
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {calendar.map((item, i) => (
                        <CalendarCard key={i} item={item} index={i} isDark={isDark} />
                    ))}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
