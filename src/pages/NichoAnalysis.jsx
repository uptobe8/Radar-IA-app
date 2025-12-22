import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Loader2, Globe, DollarSign, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackgroundParticles from '../components/BackgroundParticles';
import BottomNav from '../components/BottomNav';
import ThemeToggle from '../components/ThemeToggle';
import ConfigPanel from '../components/ConfigPanel';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { analyzeCompetitors, competitorConfigOptions, defaultCompetitorConfig } from '../services/analysisAgent';

export default function NichoAnalysis() {
    const { isDark } = useTheme();
    const { t, language } = useLanguage();
    const navigate = useNavigate();

    const [niche, setNiche] = useState('');
    const [competitors, setCompetitors] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [configOpen, setConfigOpen] = useState(false);
    const [config, setConfig] = useState(defaultCompetitorConfig);

    const handleAnalyze = async () => {
        if (!niche.trim()) return;

        setIsLoading(true);
        setHasSearched(true);

        try {
            const data = await analyzeCompetitors(niche, language, config);
            setCompetitors(data);

            // Store in localStorage for report
            localStorage.setItem('radarCompetitors', JSON.stringify(data));
            localStorage.setItem('radarNiche', niche);
        } catch (error) {
            console.error('Error analyzing competitors:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const configOptions = competitorConfigOptions[language] || competitorConfigOptions.es;

    return (
        <div className="min-h-screen relative overflow-hidden pb-24">
            <BackgroundParticles />

            {/* Header */}
            <header className="relative z-10 p-6 flex justify-between items-center">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/')}
                    className={`
            flex items-center gap-2 px-4 py-2 rounded-full
            backdrop-blur-xl
            ${isDark
                            ? 'bg-white/10 hover:bg-white/20 text-white'
                            : 'bg-black/5 hover:bg-black/10 text-slate-700'
                        }
            transition-colors
          `}
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>{t('common.back')}</span>
                </motion.button>

                <ThemeToggle />
            </header>

            {/* Title */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 text-center px-6 mb-6"
            >
                <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {t('cards.competition.title')}
                </h1>
                <p className={`${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                    {t('cards.competition.description')}
                </p>
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative z-10 max-w-2xl mx-auto px-6 mb-4"
            >
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className={`
              absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5
              ${isDark ? 'text-white/40' : 'text-slate-400'}
            `} />
                        <input
                            type="text"
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                            placeholder={t('analysis.inputPlaceholder')}
                            className={`
                w-full pl-12 pr-4 py-4 rounded-2xl
                backdrop-blur-xl
                ${isDark
                                    ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40'
                                    : 'bg-white/50 border border-slate-200 text-slate-800 placeholder:text-slate-400'
                                }
                focus:outline-none focus:ring-2 focus:ring-cyan-400/50
                transition-all
              `}
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAnalyze}
                        disabled={isLoading || !niche.trim()}
                        className={`
              px-8 py-4 rounded-2xl font-semibold
              bg-gradient-to-r from-cyan-400 to-blue-500
              text-white shadow-lg shadow-cyan-500/30
              hover:shadow-cyan-500/50
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2
              transition-all
            `}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{t('analysis.analyzing')}</span>
                            </>
                        ) : (
                            <span>{t('analysis.analyze')}</span>
                        )}
                    </motion.button>
                </div>
            </motion.div>

            {/* Configuration Panel */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative z-10 max-w-2xl mx-auto px-6 mb-6"
            >
                <ConfigPanel
                    title={language === 'es' ? 'Configuración del análisis' : 'Analysis configuration'}
                    config={config}
                    setConfig={setConfig}
                    options={configOptions}
                    isOpen={configOpen}
                    onToggle={() => setConfigOpen(!configOpen)}
                />
            </motion.div>

            {/* Results */}
            <div className="relative z-10 max-w-6xl mx-auto px-6">
                {!hasSearched && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`
              text-center py-16
              ${isDark ? 'text-white/40' : 'text-slate-400'}
            `}
                    >
                        <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>{t('analysis.noData')}</p>
                    </motion.div>
                )}

                {isLoading && (
                    <div className="flex justify-center py-16">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                            <Loader2 className={`w-12 h-12 ${isDark ? 'text-cyan-400' : 'text-cyan-500'}`} />
                        </motion.div>
                    </div>
                )}

                {!isLoading && competitors.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                {t('analysis.competitors')} ({competitors.length})
                            </h2>
                            <span className={`text-sm px-3 py-1 rounded-full ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'
                                }`}>
                                {language === 'es' ? 'Nicho' : 'Niche'}: {niche}
                            </span>
                        </div>

                        <div className={`
              rounded-2xl overflow-hidden backdrop-blur-xl
              ${isDark
                                ? 'bg-white/5 border border-white/10'
                                : 'bg-white/70 border border-white/50'
                            }
            `}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={isDark ? 'bg-white/5' : 'bg-slate-100/50'}>
                                            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                                {t('analysis.competitors')}
                                            </th>
                                            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4" />
                                                    {t('analysis.website')}
                                                </div>
                                            </th>
                                            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                                {t('analysis.product')}
                                            </th>
                                            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4" />
                                                    {t('analysis.priceRange')}
                                                </div>
                                            </th>
                                            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                                <div className="flex items-center gap-2">
                                                    <ThumbsUp className="w-4 h-4" />
                                                    {t('analysis.strengths')}
                                                </div>
                                            </th>
                                            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                                <div className="flex items-center gap-2">
                                                    <ThumbsDown className="w-4 h-4" />
                                                    {t('analysis.weaknesses')}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {competitors.map((comp, index) => (
                                            <motion.tr
                                                key={comp.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`
                          ${isDark
                                                        ? 'border-b border-white/5 hover:bg-white/5'
                                                        : 'border-b border-slate-100 hover:bg-white/50'
                                                    }
                          transition-colors
                        `}
                                            >
                                                <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                                    {comp.name}
                                                </td>
                                                <td className={`px-6 py-4 ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>
                                                    {comp.website}
                                                </td>
                                                <td className={`px-6 py-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                                                    {comp.product}
                                                </td>
                                                <td className={`px-6 py-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                                                    {comp.priceRange}
                                                </td>
                                                <td className={`px-6 py-4 text-sm ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                                                    {comp.strengths}
                                                </td>
                                                <td className={`px-6 py-4 text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                                                    {comp.weaknesses}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
