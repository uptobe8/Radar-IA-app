import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Newspaper, Loader2, ExternalLink, Calendar, Search, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackgroundParticles from '../components/BackgroundParticles';
import BottomNav from '../components/BottomNav';
import ThemeToggle from '../components/ThemeToggle';
import ConfigPanel from '../components/ConfigPanel';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchNews, newsConfigOptions, defaultNewsConfig } from '../services/newsAgent';

export default function NewsAnalysis() {
    const { isDark } = useTheme();
    const { t, language } = useLanguage();
    const navigate = useNavigate();

    const [niche, setNiche] = useState('');
    const [news, setNews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [configOpen, setConfigOpen] = useState(false);
    const [config, setConfig] = useState(defaultNewsConfig);

    const handleFetchNews = async () => {
        setIsLoading(true);
        setHasLoaded(true);

        try {
            const data = await fetchNews(niche, language, config);
            setNews(data);

            // Store for report
            localStorage.setItem('radarNews', JSON.stringify(data));
            if (niche) localStorage.setItem('radarNiche', niche);
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const configOptions = newsConfigOptions[language] || newsConfigOptions.es;

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
                    {t('cards.news.title')}
                </h1>
                <p className={`${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                    {t('cards.news.description')}
                </p>
            </motion.div>

            {/* Niche Input */}
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
                            onKeyPress={(e) => e.key === 'Enter' && handleFetchNews()}
                            placeholder={language === 'es' ? 'Introduce tu nicho o sector para noticias...' : 'Enter your niche or sector for news...'}
                            className={`
                w-full pl-12 pr-4 py-4 rounded-2xl
                backdrop-blur-xl
                ${isDark
                                    ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40'
                                    : 'bg-white/50 border border-slate-200 text-slate-800 placeholder:text-slate-400'
                                }
                focus:outline-none focus:ring-2 focus:ring-orange-400/50
                transition-all
              `}
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleFetchNews}
                        disabled={isLoading}
                        className={`
              px-8 py-4 rounded-2xl font-semibold
              bg-gradient-to-r from-orange-400 to-red-500
              text-white shadow-lg shadow-orange-500/30
              hover:shadow-orange-500/50
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2
              transition-all
            `}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{t('common.loading')}</span>
                            </>
                        ) : (
                            <>
                                <Newspaper className="w-5 h-5" />
                                <span>{t('news.searchNews')}</span>
                            </>
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
                    title={language === 'es' ? 'Configuración de noticias' : 'News configuration'}
                    config={config}
                    setConfig={setConfig}
                    options={configOptions}
                    isOpen={configOpen}
                    onToggle={() => setConfigOpen(!configOpen)}
                />
            </motion.div>

            {/* Loading */}
            {isLoading && (
                <div className="relative z-10 flex justify-center py-16">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                        <Loader2 className={`w-12 h-12 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} />
                    </motion.div>
                </div>
            )}

            {/* News Grid */}
            {!isLoading && news.length > 0 && (
                <div className="relative z-10 max-w-6xl mx-auto px-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                {language === 'es' ? 'Últimas Noticias' : 'Latest News'} ({news.length})
                            </h2>
                            {niche && (
                                <span className={`text-sm px-3 py-1 rounded-full ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
                                    }`}>
                                    {language === 'es' ? 'Nicho' : 'Niche'}: {niche}
                                </span>
                            )}
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleFetchNews}
                            className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                ${isDark
                                    ? 'bg-white/10 hover:bg-white/20 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }
                transition-colors
              `}
                        >
                            <RefreshCw className="w-4 h-4" />
                            {language === 'es' ? 'Actualizar' : 'Refresh'}
                        </motion.button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {news.map((item, index) => (
                            <motion.article
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`
                  p-6 rounded-2xl backdrop-blur-xl
                  ${isDark
                                        ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                                        : 'bg-white/70 border border-white/50 hover:bg-white/90'
                                    }
                  transition-all cursor-pointer group
                `}
                            >
                                {/* Source & Date */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`
                    text-sm font-medium px-3 py-1 rounded-full
                    ${isDark
                                            ? 'bg-orange-500/20 text-orange-400'
                                            : 'bg-orange-100 text-orange-600'
                                        }
                  `}>
                                        {item.source}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{item.date}</span>
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className={`
                  text-lg font-semibold mb-3 line-clamp-2
                  group-hover:text-orange-500 transition-colors
                  ${isDark ? 'text-white' : 'text-slate-800'}
                `}>
                                    {item.title}
                                </h3>

                                {/* Summary */}
                                <p className={`
                  text-sm leading-relaxed mb-4 line-clamp-3
                  ${isDark ? 'text-white/60' : 'text-slate-600'}
                `}>
                                    {item.summary}
                                </p>

                                {/* Read More Link */}
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`
                    inline-flex items-center gap-2 text-sm font-medium
                    ${isDark
                                            ? 'text-orange-400 hover:text-orange-300'
                                            : 'text-orange-600 hover:text-orange-700'
                                        }
                    transition-colors
                  `}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span>{t('news.readMore')}</span>
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </motion.article>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !hasLoaded && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`
            relative z-10 text-center py-16
            ${isDark ? 'text-white/40' : 'text-slate-400'}
          `}
                >
                    <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>{language === 'es' ? 'Introduce un nicho y busca noticias relevantes' : 'Enter a niche and search for relevant news'}</p>
                </motion.div>
            )}

            {!isLoading && hasLoaded && news.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`
            relative z-10 text-center py-16
            ${isDark ? 'text-white/40' : 'text-slate-400'}
          `}
                >
                    <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>{t('news.noNews')}</p>
                </motion.div>
            )}

            <BottomNav />
        </div>
    );
}
