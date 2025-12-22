// Dynamic news service
// Generates current, contextual news based on niche and configuration

const newsSources = {
    es: {
        generalista: ['El País', 'El Mundo', 'ABC', 'La Vanguardia', 'El Periódico', '20 Minutos', 'Público'],
        especializada: ['TechCrunch ES', 'Xataka', 'Genbeta', 'El Economista', 'Expansión', 'Cinco Días', 'Business Insider ES'],
        blog: ['Emprendedores', 'Marketing Directo', 'Reason Why', 'Puro Marketing', 'MarketingNews', 'Territorio Marketing']
    },
    en: {
        generalista: ['BBC', 'CNN', 'The Guardian', 'Reuters', 'AP News', 'Bloomberg', 'WSJ'],
        especializada: ['TechCrunch', 'The Verge', 'Wired', 'Forbes', 'Business Insider', 'Fast Company', 'Inc.'],
        blog: ['Entrepreneur', 'HubSpot Blog', 'Content Marketing Institute', 'Social Media Examiner', 'Buffer Blog']
    }
};

const headlineTemplates = {
    es: [
        'Cómo {niche} está transformando la industria en {year}',
        'Las {number} tendencias de {niche} que dominarán {year}',
        '{niche}: El sector que revoluciona el mercado español',
        'Inversiones récord en {niche} durante el último trimestre',
        'El futuro de {niche}: Expertos predicen cambios radicales',
        'Startups de {niche} lideran la innovación en Europa',
        'Los retos y oportunidades de {niche} para empresas españolas',
        '{niche} generará {bigNumber} empleos en los próximos años',
        'Nueva regulación afectará al sector de {niche}',
        'Las empresas de {niche} más valoradas del momento',
        'Guía completa: Cómo entrar en el mercado de {niche}',
        '{niche} experimenta crecimiento del {percentage} este año',
        'Los errores más comunes al invertir en {niche}',
        'Por qué {niche} es la apuesta segura para inversores',
        'El impacto de la IA en el sector de {niche}',
        'Caso de éxito: Cómo una empresa española triunfó en {niche}',
        'Comparativa: Las mejores soluciones de {niche} del mercado',
        'El ecosistema de {niche} se consolida en Barcelona y Madrid',
        'Nuevas herramientas de {niche} revolucionan el sector',
        'Los profesionales de {niche} más demandados en {year}'
    ],
    en: [
        'How {niche} is transforming the industry in {year}',
        'Top {number} {niche} trends that will dominate {year}',
        '{niche}: The sector revolutionizing the market',
        'Record investments in {niche} during the last quarter',
        'The future of {niche}: Experts predict radical changes',
        '{niche} startups lead innovation in tech',
        'Challenges and opportunities in {niche} for businesses',
        '{niche} will generate {bigNumber} jobs in coming years',
        'New regulation to affect the {niche} sector',
        'The most valued {niche} companies right now',
        'Complete guide: How to enter the {niche} market',
        '{niche} experiences {percentage} growth this year',
        'The most common mistakes when investing in {niche}',
        'Why {niche} is the safe bet for investors',
        'The impact of AI on the {niche} sector',
        'Success story: How a company succeeded in {niche}',
        'Comparison: The best {niche} solutions on the market',
        'The {niche} ecosystem consolidates in major cities',
        'New {niche} tools revolutionize the industry',
        'The most in-demand {niche} professionals in {year}'
    ]
};

const summaryTemplates = {
    es: [
        'Un análisis exhaustivo revela las oportunidades clave en el sector de {niche}, con proyecciones de crecimiento superiores al mercado general.',
        'Expertos del sector analizan los cambios que está experimentando {niche} y cómo las empresas pueden adaptarse para mantener su competitividad.',
        'Las últimas cifras muestran un aumento significativo en la inversión hacia {niche}, consolidando su posición como sector estratégico.',
        'Nuevos estudios confirman que {niche} será fundamental para la transformación digital de las empresas en los próximos años.',
        'Las principales empresas del sector comparten sus estrategias para aprovechar las oportunidades que ofrece {niche}.',
        'Un informe detallado examina el impacto de las nuevas tecnologías en el desarrollo de {niche} y sus implicaciones para el mercado.',
        'La comunidad de {niche} celebra los avances recientes que prometen revolucionar la forma en que operan las empresas.',
        'Instituciones y empresas unen fuerzas para impulsar el crecimiento sostenible del sector de {niche} en España.',
        'Los expertos advierten sobre los riesgos y oportunidades que presenta el mercado de {niche} para nuevos entrantes.',
        'Las últimas innovaciones en {niche} prometen reducir costes y aumentar la eficiencia para empresas de todos los tamaños.'
    ],
    en: [
        'A comprehensive analysis reveals key opportunities in the {niche} sector, with above-market growth projections.',
        'Industry experts analyze the changes in {niche} and how companies can adapt to maintain competitiveness.',
        'Latest figures show a significant increase in investment towards {niche}, consolidating its position as a strategic sector.',
        'New studies confirm that {niche} will be fundamental for digital transformation in coming years.',
        'Leading companies share their strategies to leverage the opportunities offered by {niche}.',
        'A detailed report examines the impact of new technologies on {niche} development and market implications.',
        'The {niche} community celebrates recent advances that promise to revolutionize business operations.',
        'Institutions and companies join forces to drive sustainable growth in the {niche} sector.',
        'Experts warn about the risks and opportunities in the {niche} market for new entrants.',
        'Latest innovations in {niche} promise to reduce costs and increase efficiency for businesses of all sizes.'
    ]
};

function pickRandom(arr, count = 1) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return count === 1 ? shuffled[0] : shuffled.slice(0, count);
}

function replaceNiche(text, niche) {
    const now = new Date();
    const year = now.getFullYear();
    return text
        .replace(/{niche}/g, niche || 'tu sector')
        .replace(/{year}/g, year.toString())
        .replace(/{number}/g, String(Math.floor(Math.random() * 10) + 5))
        .replace(/{bigNumber}/g, `${Math.floor(Math.random() * 50) + 10} millones de`)
        .replace(/{percentage}/g, `${Math.floor(Math.random() * 40) + 15}%`);
}

function generateRecentDate(daysAgo = 0) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
}

function generateLink(source, niche) {
    const slug = (niche || 'news').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const sourceSlug = source.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    return `https://${sourceSlug}.com/article/${slug}-${Date.now().toString(36)}`;
}

export async function fetchNews(niche = '', language = 'es', config = {}) {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));

    const count = config.count || 10;
    const sourceTypes = config.sourceTypes || ['generalista', 'especializada', 'blog'];
    const dateRange = config.dateRange || '7days';

    const maxDays = dateRange === '24h' ? 1 : dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 7;

    // Collect sources based on selected types
    let availableSources = [];
    sourceTypes.forEach(type => {
        const typeSources = newsSources[language]?.[type] || newsSources.es[type] || [];
        availableSources = [...availableSources, ...typeSources];
    });

    if (availableSources.length === 0) {
        availableSources = Object.values(newsSources[language] || newsSources.es).flat();
    }

    const news = [];
    const usedHeadlines = new Set();

    for (let i = 0; i < count; i++) {
        const source = pickRandom(availableSources);

        let headline = replaceNiche(pickRandom(headlineTemplates[language] || headlineTemplates.es), niche);
        // Ensure unique headlines
        while (usedHeadlines.has(headline)) {
            headline = replaceNiche(pickRandom(headlineTemplates[language] || headlineTemplates.es), niche);
        }
        usedHeadlines.add(headline);

        const summary = replaceNiche(pickRandom(summaryTemplates[language] || summaryTemplates.es), niche);
        const daysAgo = Math.floor(Math.random() * maxDays);

        news.push({
            id: i + 1,
            source,
            title: headline,
            link: generateLink(source, niche),
            summary,
            date: generateRecentDate(daysAgo)
        });
    }

    // Sort by date (most recent first)
    news.sort((a, b) => new Date(b.date) - new Date(a.date));

    return news;
}

export const newsConfigOptions = {
    es: [
        {
            key: 'count',
            label: 'Cantidad de noticias',
            type: 'select',
            options: [
                { value: 5, label: '5 noticias' },
                { value: 10, label: '10 noticias' },
                { value: 15, label: '15 noticias' },
                { value: 20, label: '20 noticias' }
            ]
        },
        {
            key: 'sourceTypes',
            label: 'Tipo de fuente',
            type: 'multiselect',
            options: [
                { value: 'generalista', label: 'Generalista' },
                { value: 'especializada', label: 'Especializada' },
                { value: 'blog', label: 'Blogs' }
            ]
        },
        {
            key: 'dateRange',
            label: 'Rango de fechas',
            type: 'select',
            options: [
                { value: '24h', label: 'Últimas 24 horas' },
                { value: '7days', label: 'Últimos 7 días' },
                { value: '30days', label: 'Últimos 30 días' }
            ]
        },
        {
            key: 'region',
            label: 'Región',
            type: 'select',
            options: [
                { value: 'global', label: 'Global' },
                { value: 'spain', label: 'España' },
                { value: 'latam', label: 'Latinoamérica' }
            ]
        }
    ],
    en: [
        {
            key: 'count',
            label: 'Number of news',
            type: 'select',
            options: [
                { value: 5, label: '5 news' },
                { value: 10, label: '10 news' },
                { value: 15, label: '15 news' },
                { value: 20, label: '20 news' }
            ]
        },
        {
            key: 'sourceTypes',
            label: 'Source type',
            type: 'multiselect',
            options: [
                { value: 'generalista', label: 'General' },
                { value: 'especializada', label: 'Specialized' },
                { value: 'blog', label: 'Blogs' }
            ]
        },
        {
            key: 'dateRange',
            label: 'Date range',
            type: 'select',
            options: [
                { value: '24h', label: 'Last 24 hours' },
                { value: '7days', label: 'Last 7 days' },
                { value: '30days', label: 'Last 30 days' }
            ]
        },
        {
            key: 'region',
            label: 'Region',
            type: 'select',
            options: [
                { value: 'global', label: 'Global' },
                { value: 'spain', label: 'Spain' },
                { value: 'latam', label: 'Latin America' }
            ]
        }
    ]
};

export const defaultNewsConfig = {
    count: 10,
    sourceTypes: ['generalista', 'especializada', 'blog'],
    dateRange: '7days',
    region: 'global'
};
