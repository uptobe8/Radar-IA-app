import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
    es: {
        title: 'Radar de Tendencias y Contenido IA',
        subtitle: 'Investiga tendencias en tiempo real y genera un plan de contenido estratégico.',
        nav: {
            home: 'Inicio',
            trends: 'Tendencias',
            insights: 'Insights',
            calendar: 'Calendario'
        },
        search: {
            placeholder: 'Introduce un nicho o tema (ej: IA médica, moda sostenible...)',
            button: 'Escanear',
            scanning: 'Escaneando redes...',
            resultsFor: 'Resultados para:'
        },
        table: {
            platform: 'Plataforma',
            content: 'Título / Tema',
            format: 'Tipo / Formato',
            performance: 'Rendimiento',
            insight: 'Insight Clave'
        },
        insights: {
            title: 'Patrones Detectados',
            subtitle: 'Tendencias y comportamientos observados en el nicho.'
        },
        calendar: {
            title: 'Plan de Contenido (10 Días)',
            day: 'Día',
            idea: 'Idea de Contenido',
            cta: 'Call to Action'
        },
        common: {
            back: 'Volver',
            loading: 'Cargando...',
            error: 'Error',
            success: 'Éxito',
            high: 'Alto',
            medium: 'Medio',
            low: 'Bajo'
        }
    },
    en: {
        title: 'AI Trend & Content Radar',
        subtitle: 'Research real-time trends and generate a strategic content plan.',
        nav: {
            home: 'Home',
            trends: 'Trends',
            insights: 'Insights',
            calendar: 'Calendar'
        },
        search: {
            placeholder: 'Enter a niche or topic (e.g., Medical AI, sustainable fashion...)',
            button: 'Scan',
            scanning: 'Scanning networks...',
            resultsFor: 'Results for:'
        },
        table: {
            platform: 'Platform',
            content: 'Title / Topic',
            format: 'Type / Format',
            performance: 'Performance',
            insight: 'Key Insight'
        },
        insights: {
            title: 'Detected Patterns',
            subtitle: 'Trends and behaviors observed in the niche.'
        },
        calendar: {
            title: 'Content Plan (10 Days)',
            day: 'Day',
            idea: 'Content Idea',
            cta: 'Call to Action'
        },
        common: {
            back: 'Back',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            high: 'High',
            medium: 'Medium',
            low: 'Low'
        }
    }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('language');
        return saved || 'es';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];
        for (const k of keys) {
            value = value?.[k];
        }
        return value || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
