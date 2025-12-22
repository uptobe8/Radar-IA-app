// Dynamic competitor analysis service
// Generates contextual data based on the niche entered

const companyPrefixes = ['Tech', 'Digital', 'Smart', 'Pro', 'Ultra', 'Neo', 'Meta', 'Hyper', 'Quantum', 'Alpha', 'Beta', 'Prime', 'Max', 'Elite', 'Global'];
const companySuffixes = ['Solutions', 'Labs', 'Hub', 'Pro', 'Plus', 'AI', 'Works', 'Systems', 'Cloud', 'Connect', 'Flow', 'Wave', 'Force', 'Spark', 'Vision'];

const domains = ['.com', '.io', '.co', '.app', '.tech', '.ai', '.pro', '.es', '.net'];

const strengthsPool = {
    es: [
        'Interfaz intuitiva y moderna',
        'Soporte 24/7 en español',
        'Precios competitivos',
        'Integración con múltiples plataformas',
        'Actualizaciones frecuentes',
        'Comunidad activa de usuarios',
        'Documentación exhaustiva',
        'API robusta',
        'Análisis en tiempo real',
        'Personalización avanzada',
        'Automatización inteligente',
        'Informes detallados',
        'Seguridad de datos',
        'Escalabilidad probada',
        'Onboarding guiado'
    ],
    en: [
        'Intuitive and modern interface',
        '24/7 support',
        'Competitive pricing',
        'Multi-platform integration',
        'Frequent updates',
        'Active user community',
        'Comprehensive documentation',
        'Robust API',
        'Real-time analytics',
        'Advanced customization',
        'Intelligent automation',
        'Detailed reports',
        'Data security',
        'Proven scalability',
        'Guided onboarding'
    ]
};

const weaknessesPool = {
    es: [
        'Curva de aprendizaje pronunciada',
        'Precio elevado para startups',
        'Funciones premium de pago',
        'Limitaciones en plan gratuito',
        'Soporte técnico lento',
        'Pocas integraciones nativas',
        'Interfaz poco intuitiva',
        'Sin versión móvil',
        'Documentación incompleta',
        'Tiempos de carga lentos',
        'Pocos idiomas disponibles',
        'Sin modo offline',
        'Opciones de exportación limitadas',
        'Requiere conocimientos técnicos',
        'Actualizaciones poco frecuentes'
    ],
    en: [
        'Steep learning curve',
        'High price for startups',
        'Premium features require payment',
        'Free plan limitations',
        'Slow technical support',
        'Few native integrations',
        'Non-intuitive interface',
        'No mobile version',
        'Incomplete documentation',
        'Slow loading times',
        'Few languages available',
        'No offline mode',
        'Limited export options',
        'Requires technical knowledge',
        'Infrequent updates'
    ]
};

// Generate product/service based on niche
function generateProduct(niche, language) {
    const products = {
        es: [
            `Plataforma de ${niche} integral`,
            `Software de gestión para ${niche}`,
            `Herramienta de análisis de ${niche}`,
            `Solución SaaS para ${niche}`,
            `Sistema de automatización de ${niche}`,
            `Suite de ${niche} empresarial`,
            `Aplicación de ${niche} con IA`,
            `CRM especializado en ${niche}`,
            `Dashboard de ${niche}`,
            `Marketplace de ${niche}`
        ],
        en: [
            `Comprehensive ${niche} platform`,
            `${niche} management software`,
            `${niche} analytics tool`,
            `${niche} SaaS solution`,
            `${niche} automation system`,
            `Enterprise ${niche} suite`,
            `AI-powered ${niche} app`,
            `${niche}-focused CRM`,
            `${niche} dashboard`,
            `${niche} marketplace`
        ]
    };
    return products[language][Math.floor(Math.random() * products[language].length)];
}

// Generate price range based on config
function generatePriceRange(config, language) {
    const currency = language === 'es' ? '€' : '$';
    const ranges = {
        low: [`${currency}19 - ${currency}49/mes`, `${currency}29 - ${currency}79/mes`, `${currency}9 - ${currency}39/mes`],
        medium: [`${currency}49 - ${currency}199/mes`, `${currency}99 - ${currency}299/mes`, `${currency}79 - ${currency}249/mes`],
        high: [`${currency}199 - ${currency}599/mes`, `${currency}299 - ${currency}999/mes`, `${currency}499 - ${currency}1499/mes`],
        all: null
    };

    const tier = config.priceRange || 'all';
    if (tier === 'all') {
        const allRanges = [...ranges.low, ...ranges.medium, ...ranges.high];
        return allRanges[Math.floor(Math.random() * allRanges.length)];
    }
    return ranges[tier][Math.floor(Math.random() * ranges[tier].length)];
}

// Shuffle and pick random items from array
function pickRandom(arr, count = 1) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return count === 1 ? shuffled[0] : shuffled.slice(0, count);
}

// Generate a random company name
function generateCompanyName(niche) {
    const prefix = pickRandom(companyPrefixes);
    const suffix = pickRandom(companySuffixes);
    const nicheWord = niche.split(' ')[0].charAt(0).toUpperCase() + niche.split(' ')[0].slice(1);

    const formats = [
        `${prefix}${suffix}`,
        `${nicheWord}${suffix}`,
        `${prefix}${nicheWord.slice(0, 3)}`,
        `${nicheWord}${prefix.slice(0, 3)}`,
        `${prefix} ${nicheWord}`,
    ];

    return pickRandom(formats);
}

// Generate website from company name
function generateWebsite(companyName) {
    const domain = pickRandom(domains);
    const cleanName = companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    return `www.${cleanName}${domain}`;
}

// Main function to generate competitors
export async function analyzeCompetitors(niche, language = 'es', config = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    const count = config.count || 10;
    const competitors = [];
    const usedNames = new Set();

    for (let i = 0; i < count; i++) {
        let name = generateCompanyName(niche);
        // Ensure unique names
        while (usedNames.has(name)) {
            name = generateCompanyName(niche);
        }
        usedNames.add(name);

        const website = generateWebsite(name);
        const product = generateProduct(niche, language);
        const priceRange = generatePriceRange(config, language);
        const strengths = pickRandom(strengthsPool[language] || strengthsPool.es, 2).join(', ');
        const weaknesses = pickRandom(weaknessesPool[language] || weaknessesPool.es, 2).join(', ');

        competitors.push({
            id: i + 1,
            name,
            website,
            product,
            priceRange,
            strengths,
            weaknesses
        });
    }

    return competitors;
}

// Config options for the competitor analysis module
export const competitorConfigOptions = {
    es: [
        {
            key: 'count',
            label: 'Cantidad de competidores',
            type: 'select',
            options: [
                { value: 5, label: '5 competidores' },
                { value: 10, label: '10 competidores' },
                { value: 15, label: '15 competidores' },
                { value: 20, label: '20 competidores' }
            ]
        },
        {
            key: 'analysisType',
            label: 'Tipo de análisis',
            type: 'select',
            options: [
                { value: 'basic', label: 'Básico' },
                { value: 'detailed', label: 'Detallado' }
            ]
        },
        {
            key: 'priceRange',
            label: 'Rango de precios',
            type: 'select',
            options: [
                { value: 'all', label: 'Todos' },
                { value: 'low', label: 'Bajo (< €50/mes)' },
                { value: 'medium', label: 'Medio (€50-200/mes)' },
                { value: 'high', label: 'Alto (> €200/mes)' }
            ]
        },
        {
            key: 'region',
            label: 'Región',
            type: 'select',
            options: [
                { value: 'global', label: 'Global' },
                { value: 'spain', label: 'España' },
                { value: 'latam', label: 'Latinoamérica' },
                { value: 'europe', label: 'Europa' }
            ]
        }
    ],
    en: [
        {
            key: 'count',
            label: 'Number of competitors',
            type: 'select',
            options: [
                { value: 5, label: '5 competitors' },
                { value: 10, label: '10 competitors' },
                { value: 15, label: '15 competitors' },
                { value: 20, label: '20 competitors' }
            ]
        },
        {
            key: 'analysisType',
            label: 'Analysis type',
            type: 'select',
            options: [
                { value: 'basic', label: 'Basic' },
                { value: 'detailed', label: 'Detailed' }
            ]
        },
        {
            key: 'priceRange',
            label: 'Price range',
            type: 'select',
            options: [
                { value: 'all', label: 'All' },
                { value: 'low', label: 'Low (< $50/mo)' },
                { value: 'medium', label: 'Medium ($50-200/mo)' },
                { value: 'high', label: 'High (> $200/mo)' }
            ]
        },
        {
            key: 'region',
            label: 'Region',
            type: 'select',
            options: [
                { value: 'global', label: 'Global' },
                { value: 'spain', label: 'Spain' },
                { value: 'latam', label: 'Latin America' },
                { value: 'europe', label: 'Europe' }
            ]
        }
    ]
};

export const defaultCompetitorConfig = {
    count: 10,
    analysisType: 'basic',
    priceRange: 'all',
    region: 'global'
};
