import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

const languages = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
];

export default function LanguageSelector() {
    const { language, setLanguage } = useLanguage();
    const { isDark } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    const currentLang = languages.find(l => l.code === language);

    return (
        <div className="relative">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 px-3 py-2
          rounded-full backdrop-blur-xl
          ${isDark
                        ? 'bg-slate-800/80 border border-white/10'
                        : 'bg-white/80 border border-slate-200'
                    }
          shadow-lg
          transition-colors duration-300
        `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Globe className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-slate-600'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>
                    {currentLang?.flag} {currentLang?.code.toUpperCase()}
                </span>
            </motion.button>

            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`
            absolute top-full mt-2 right-0
            min-w-[140px]
            rounded-xl backdrop-blur-xl
            ${isDark
                            ? 'bg-slate-800/95 border border-white/10'
                            : 'bg-white/95 border border-slate-200'
                        }
            shadow-xl overflow-hidden z-50
          `}
                >
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code);
                                setIsOpen(false);
                            }}
                            className={`
                w-full flex items-center gap-3 px-4 py-3
                ${language === lang.code
                                    ? isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'
                                    : ''
                                }
                ${isDark
                                    ? 'hover:bg-white/5 text-white'
                                    : 'hover:bg-slate-100 text-slate-700'
                                }
                transition-colors duration-200
              `}
                        >
                            <span className="text-lg">{lang.flag}</span>
                            <span className="text-sm font-medium">{lang.label}</span>
                        </button>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
