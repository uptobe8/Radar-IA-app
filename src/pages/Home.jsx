import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Search, Sparkles, Youtube, Instagram, Music, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSelector from '../components/LanguageSelector';
import BackgroundParticles from '../components/BackgroundParticles';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { scanTrends } from '../services/trendsAgent';

export default function Home() {
    const { t, language } = useLanguage();
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsScanning(true);
        try {
            const results = await scanTrends(query, language);
            localStorage.setItem('trendResults', JSON.stringify(results));
            localStorage.setItem('lastQuery', query);

            // Wait a bit more for the effect
            setTimeout(() => {
                navigate('/trends');
            }, 2000);
        } catch (error) {
            console.error(error);
            setIsScanning(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <BackgroundParticles />

            {/* Header */}
            <header className="relative z-10 p-6 flex justify-between items-start">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Radar className="w-7 h-7 text-white" />
                    </div>
                    <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        Radar <span className="text-cyan-400">IA</span>
                    </h1>
                </motion.div>

                <div className="flex items-center gap-4">
                    <LanguageSelector />
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex flex-col items-center justify-center px-6 min-h-[70vh]">
                <AnimatePresence mode="wait">
                    {!isScanning ? (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-3xl text-center"
                        >
                            <h2 className={`text-4xl md:text-5xl font-black mb-6 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {t('title')}
                            </h2>
                            <p className={`text-lg mb-12 max-w-xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                {t('subtitle')}
                            </p>

                            <form onSubmit={handleSearch} className="relative group">
                                <div className={`
                                    absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-2xl blur opacity-25 
                                    group-focus-within:opacity-100 transition duration-1000 group-hover:duration-200
                                `} />
                                <div className={`
                                    relative flex items-center p-2 rounded-2xl border backdrop-blur-xl
                                    ${isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200'}
                                `}>
                                    <Search className="w-6 h-6 ml-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={t('search.placeholder')}
                                        className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-4 text-lg outline-none text-slate-400"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center gap-2"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        {t('search.button')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="scanning"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center text-center"
                        >
                            <div className="relative w-48 h-48 mb-8">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/30"
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-4 rounded-full border-2 border-dotted border-blue-500/20"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Radar className="w-16 h-16 text-cyan-400 animate-pulse" />
                                </div>
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-cyan-400 blur-3xl opacity-20 rounded-full"
                                />
                            </div>

                            <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {t('search.scanning')}
                            </h3>

                            <div className="flex gap-6 mt-8">
                                {[Youtube, Instagram, Music, Globe].map((Icon, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ y: [0, -10, 0], opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                                        className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
                                    >
                                        <Icon className="w-6 h-6 text-cyan-400" />
                                    </motion.div>
                                ))}
                            </div>

                            <p className="mt-8 text-cyan-400 font-mono text-sm animate-pulse">
                                Extracting tokens: {query}...
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <BottomNav />
        </div>
    );
}
