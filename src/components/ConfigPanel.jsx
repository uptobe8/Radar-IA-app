import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ConfigPanel({
    title,
    config,
    setConfig,
    options,
    isOpen,
    onToggle
}) {
    const { isDark } = useTheme();

    return (
        <div className={`
      rounded-2xl backdrop-blur-xl overflow-hidden
      ${isDark
                ? 'bg-white/5 border border-white/10'
                : 'bg-white/70 border border-white/50'
            }
    `}>
            {/* Header */}
            <button
                onClick={onToggle}
                className={`
          w-full flex items-center justify-between p-4
          ${isDark ? 'hover:bg-white/5' : 'hover:bg-white/50'}
          transition-colors
        `}
            >
                <div className="flex items-center gap-3">
                    <Settings className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {title}
                    </span>
                </div>
                {isOpen ? (
                    <ChevronUp className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-slate-400'}`} />
                ) : (
                    <ChevronDown className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-slate-400'}`} />
                )}
            </button>

            {/* Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className={`
              p-4 pt-0 grid gap-4 
              ${options.length > 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-' + options.length}
            `}>
                            {options.map((option) => (
                                <div key={option.key} className="space-y-2">
                                    <label className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                                        {option.label}
                                    </label>

                                    {option.type === 'select' && (
                                        <select
                                            value={config[option.key]}
                                            onChange={(e) => setConfig({ ...config, [option.key]: e.target.value })}
                                            className={`
                        w-full px-3 py-2 rounded-xl
                        ${isDark
                                                    ? 'bg-white/10 border border-white/20 text-white'
                                                    : 'bg-white border border-slate-200 text-slate-800'
                                                }
                        focus:outline-none focus:ring-2 focus:ring-cyan-400/50
                      `}
                                        >
                                            {option.options.map((opt) => (
                                                <option key={opt.value} value={opt.value} className="bg-slate-800">
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {option.type === 'number' && (
                                        <input
                                            type="number"
                                            min={option.min}
                                            max={option.max}
                                            value={config[option.key]}
                                            onChange={(e) => setConfig({ ...config, [option.key]: parseInt(e.target.value) })}
                                            className={`
                        w-full px-3 py-2 rounded-xl
                        ${isDark
                                                    ? 'bg-white/10 border border-white/20 text-white'
                                                    : 'bg-white border border-slate-200 text-slate-800'
                                                }
                        focus:outline-none focus:ring-2 focus:ring-cyan-400/50
                      `}
                                        />
                                    )}

                                    {option.type === 'multiselect' && (
                                        <div className="flex flex-wrap gap-2">
                                            {option.options.map((opt) => {
                                                const isSelected = config[option.key]?.includes(opt.value);
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => {
                                                            const current = config[option.key] || [];
                                                            const newValue = isSelected
                                                                ? current.filter(v => v !== opt.value)
                                                                : [...current, opt.value];
                                                            setConfig({ ...config, [option.key]: newValue });
                                                        }}
                                                        className={`
                              px-3 py-1.5 rounded-lg text-sm font-medium
                              transition-all
                              ${isSelected
                                                                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white'
                                                                : isDark
                                                                    ? 'bg-white/10 text-white/70 hover:bg-white/20'
                                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                            }
                            `}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {option.type === 'toggle' && (
                                        <button
                                            onClick={() => setConfig({ ...config, [option.key]: !config[option.key] })}
                                            className={`
                        relative w-12 h-6 rounded-full transition-colors
                        ${config[option.key]
                                                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                                                    : isDark ? 'bg-white/20' : 'bg-slate-200'
                                                }
                      `}
                                        >
                                            <motion.div
                                                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                                                animate={{ x: config[option.key] ? 26 : 4 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
