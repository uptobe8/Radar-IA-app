import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Loader2, Download, BarChart3, PieChart as PieChartIcon, Users, Newspaper, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import BackgroundParticles from '../components/BackgroundParticles';
import BottomNav from '../components/BottomNav';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { generatePDFReport } from '../services/pdfExporter';

const COLORS = ['#22D3EE', '#A855F7', '#F97316', '#3B82F6', '#10B981'];

export default function ReportView() {
    const { isDark } = useTheme();
    const { t, language } = useLanguage();
    const navigate = useNavigate();

    const [isGenerating, setIsGenerating] = useState(false);
    const [reportData, setReportData] = useState({
        competitors: [],
        trends: null,
        news: [],
        niche: ''
    });

    useEffect(() => {
        // Load data from localStorage
        const competitors = JSON.parse(localStorage.getItem('radarCompetitors') || '[]');
        const trends = JSON.parse(localStorage.getItem('radarTrends') || 'null');
        const news = JSON.parse(localStorage.getItem('radarNews') || '[]');
        const niche = localStorage.getItem('radarNiche') || '';

        setReportData({ competitors, trends, news, niche });
    }, []);

    const handleGeneratePDF = async () => {
        setIsGenerating(true);
        try {
            await generatePDFReport(reportData, language);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Prepare chart data
    const competitorPriceData = reportData.competitors.slice(0, 6).map(comp => ({
        name: comp.name.split(' ')[0],
        min: parseInt(comp.priceRange.replace(/[^0-9]/g, '')) || 50,
        max: parseInt(comp.priceRange.split('-')[1]?.replace(/[^0-9]/g, '')) || 200,
    }));

    const platformData = reportData.trends?.trends?.reduce((acc, trend) => {
        const existing = acc.find(p => p.name === trend.platform);
        if (existing) {
            existing.value += 1;
        } else {
            acc.push({ name: trend.platform, value: 1 });
        }
        return acc;
    }, []) || [];

    const hasData = reportData.competitors.length > 0 || reportData.trends || reportData.news.length > 0;

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
                className="relative z-10 text-center px-6 mb-8"
            >
                <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {t('cards.report.title')}
                </h1>
                <p className={`${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                    {t('cards.report.description')}
                </p>
            </motion.div>

            {/* Generate PDF Button */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative z-10 flex justify-center mb-8"
            >
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGeneratePDF}
                    disabled={isGenerating || !hasData}
                    className={`
            px-8 py-4 rounded-2xl font-semibold
            bg-gradient-to-r from-blue-400 to-indigo-500
            text-white shadow-lg shadow-blue-500/30
            hover:shadow-blue-500/50
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center gap-2
            transition-all
          `}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>{t('report.generating')}</span>
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            <span>{t('report.generateReport')}</span>
                        </>
                    )}
                </motion.button>
            </motion.div>

            {/* Report Preview */}
            <div className="relative z-10 max-w-6xl mx-auto px-6">
                {!hasData ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`
              text-center py-16
              ${isDark ? 'text-white/40' : 'text-slate-400'}
            `}
                    >
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2">
                            {language === 'es'
                                ? 'No hay datos para generar el informe'
                                : 'No data available to generate report'}
                        </p>
                        <p className="text-sm">
                            {language === 'es'
                                ? 'Analiza competidores, tendencias y noticias primero'
                                : 'Analyze competitors, trends, and news first'}
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`
                  p-5 rounded-2xl backdrop-blur-xl
                  ${isDark
                                        ? 'bg-cyan-500/10 border border-cyan-500/20'
                                        : 'bg-cyan-50 border border-cyan-200'
                                    }
                `}
                            >
                                <Users className={`w-8 h-8 mb-2 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                    {reportData.competitors.length}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                    {language === 'es' ? 'Competidores' : 'Competitors'}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className={`
                  p-5 rounded-2xl backdrop-blur-xl
                  ${isDark
                                        ? 'bg-purple-500/10 border border-purple-500/20'
                                        : 'bg-purple-50 border border-purple-200'
                                    }
                `}
                            >
                                <TrendingUp className={`w-8 h-8 mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                    {reportData.trends?.trends?.length || 0}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                    {language === 'es' ? 'Tendencias' : 'Trends'}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className={`
                  p-5 rounded-2xl backdrop-blur-xl
                  ${isDark
                                        ? 'bg-orange-500/10 border border-orange-500/20'
                                        : 'bg-orange-50 border border-orange-200'
                                    }
                `}
                            >
                                <Newspaper className={`w-8 h-8 mb-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                    {reportData.news.length}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                    {language === 'es' ? 'Noticias' : 'News'}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className={`
                  p-5 rounded-2xl backdrop-blur-xl
                  ${isDark
                                        ? 'bg-blue-500/10 border border-blue-500/20'
                                        : 'bg-blue-50 border border-blue-200'
                                    }
                `}
                            >
                                <BarChart3 className={`w-8 h-8 mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                    {reportData.trends?.patterns?.length || 0}
                                </p>
                                <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                    {language === 'es' ? 'Patrones' : 'Patterns'}
                                </p>
                            </motion.div>
                        </div>

                        {/* Charts */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Price Range Chart */}
                            {competitorPriceData.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className={`
                    p-6 rounded-2xl backdrop-blur-xl
                    ${isDark
                                            ? 'bg-white/5 border border-white/10'
                                            : 'bg-white/70 border border-white/50'
                                        }
                  `}
                                >
                                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                        <BarChart3 className="w-5 h-5 text-cyan-500" />
                                        {language === 'es' ? 'Rango de Precios' : 'Price Range'}
                                    </h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={competitorPriceData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                                            />
                                            <YAxis
                                                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: isDark ? '#1e293b' : '#fff',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                                                }}
                                            />
                                            <Bar dataKey="min" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="max" fill="#A855F7" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </motion.div>
                            )}

                            {/* Platform Distribution */}
                            {platformData.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className={`
                    p-6 rounded-2xl backdrop-blur-xl
                    ${isDark
                                            ? 'bg-white/5 border border-white/10'
                                            : 'bg-white/70 border border-white/50'
                                        }
                  `}
                                >
                                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                        <PieChartIcon className="w-5 h-5 text-purple-500" />
                                        {language === 'es' ? 'Distribución por Plataforma' : 'Platform Distribution'}
                                    </h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={platformData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {platformData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </motion.div>
                            )}
                        </div>

                        {/* Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className={`
                p-6 rounded-2xl backdrop-blur-xl
                ${isDark
                                    ? 'bg-white/5 border border-white/10'
                                    : 'bg-white/70 border border-white/50'
                                }
              `}
                        >
                            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                {t('report.executiveSummary')}
                            </h3>
                            <p className={`leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                                {language === 'es'
                                    ? `Este informe analiza ${reportData.competitors.length} competidores en el sector ${reportData.niche || 'seleccionado'}, 
                     identifica ${reportData.trends?.trends?.length || 0} tendencias de contenido multiplataforma y recopila 
                     ${reportData.news.length} noticias relevantes del mercado. Los datos sugieren oportunidades significativas 
                     de diferenciación y crecimiento.`
                                    : `This report analyzes ${reportData.competitors.length} competitors in the ${reportData.niche || 'selected'} sector, 
                     identifies ${reportData.trends?.trends?.length || 0} multi-platform content trends, and compiles 
                     ${reportData.news.length} relevant market news. The data suggests significant opportunities 
                     for differentiation and growth.`
                                }
                            </p>
                        </motion.div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
