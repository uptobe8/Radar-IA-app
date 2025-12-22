import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePDFReport(data, language = 'es') {
    const { competitors, trends, news, niche } = data;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text with word wrap
    const addText = (text, fontSize = 12, isBold = false, color = [0, 0, 0]) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.setTextColor(...color);

        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);

        if (yPosition + lines.length * (fontSize * 0.4) > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
        }

        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * (fontSize * 0.4) + 5;
    };

    // Title page
    pdf.setFillColor(34, 211, 238);
    pdf.rect(0, 0, pageWidth, 60, 'F');

    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Radar IA Todo en Uno', margin, 35);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(language === 'es' ? 'Informe de Inteligencia de Mercado' : 'Market Intelligence Report', margin, 48);

    yPosition = 80;

    // Report info
    const date = new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    addText(`${language === 'es' ? 'Fecha' : 'Date'}: ${date}`, 11, false, [100, 100, 100]);
    if (niche) {
        addText(`${language === 'es' ? 'Nicho analizado' : 'Analyzed niche'}: ${niche}`, 11, false, [100, 100, 100]);
    }

    yPosition += 10;

    // Executive Summary
    addText(language === 'es' ? 'Resumen Ejecutivo' : 'Executive Summary', 18, true, [34, 211, 238]);
    yPosition += 3;

    const summaryText = language === 'es'
        ? 'Este informe presenta un análisis completo del mercado, incluyendo competidores clave, tendencias multiplataforma y noticias relevantes del sector. Los datos han sido recopilados y analizados para proporcionar insights accionables.'
        : 'This report presents a complete market analysis, including key competitors, multi-platform trends, and relevant industry news. Data has been collected and analyzed to provide actionable insights.';

    addText(summaryText, 11, false, [60, 60, 60]);
    yPosition += 10;

    // Competitors Section
    if (competitors && competitors.length > 0) {
        addText(language === 'es' ? 'Análisis de Competencia' : 'Competition Analysis', 18, true, [168, 85, 247]);
        yPosition += 3;

        addText(`${competitors.length} ${language === 'es' ? 'competidores identificados' : 'competitors identified'}`, 11, false, [60, 60, 60]);
        yPosition += 5;

        competitors.slice(0, 5).forEach((comp, index) => {
            if (yPosition > pageHeight - 50) {
                pdf.addPage();
                yPosition = margin;
            }

            addText(`${index + 1}. ${comp.name}`, 12, true, [0, 0, 0]);
            addText(`   ${language === 'es' ? 'Producto' : 'Product'}: ${comp.product}`, 10, false, [80, 80, 80]);
            addText(`   ${language === 'es' ? 'Precio' : 'Price'}: ${comp.priceRange}`, 10, false, [80, 80, 80]);
            yPosition += 3;
        });

        yPosition += 10;
    }

    // Trends Section
    if (trends && trends.trends && trends.trends.length > 0) {
        if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = margin;
        }

        addText(language === 'es' ? 'Tendencias Detectadas' : 'Detected Trends', 18, true, [249, 115, 22]);
        yPosition += 3;

        if (trends.patterns) {
            addText(language === 'es' ? 'Patrones clave:' : 'Key patterns:', 12, true, [0, 0, 0]);
            trends.patterns.slice(0, 5).forEach(pattern => {
                addText(`• ${pattern}`, 10, false, [80, 80, 80]);
            });
        }

        yPosition += 10;
    }

    // News Section
    if (news && news.length > 0) {
        if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = margin;
        }

        addText(language === 'es' ? 'Noticias Relevantes' : 'Relevant News', 18, true, [59, 130, 246]);
        yPosition += 3;

        news.slice(0, 5).forEach((item, index) => {
            if (yPosition > pageHeight - 40) {
                pdf.addPage();
                yPosition = margin;
            }

            addText(`${index + 1}. ${item.title}`, 11, true, [0, 0, 0]);
            addText(`   ${item.source} - ${item.date}`, 9, false, [100, 100, 100]);
            yPosition += 3;
        });

        yPosition += 10;
    }

    // Conclusions
    if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
    }

    addText(language === 'es' ? 'Conclusiones' : 'Conclusions', 18, true, [34, 211, 238]);
    yPosition += 3;

    const conclusions = language === 'es'
        ? [
            '• El mercado presenta oportunidades significativas para diferenciación.',
            '• Las tendencias de contenido muestran preferencia por formatos cortos y visuales.',
            '• La innovación tecnológica continúa siendo un factor diferenciador clave.',
            '• Se recomienda monitoreo continuo de competidores principales.'
        ]
        : [
            '• The market presents significant opportunities for differentiation.',
            '• Content trends show preference for short, visual formats.',
            '• Technological innovation continues to be a key differentiator.',
            '• Continuous monitoring of main competitors is recommended.'
        ];

    conclusions.forEach(conclusion => {
        addText(conclusion, 11, false, [60, 60, 60]);
    });

    // Footer on all pages
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
            `Radar IA Todo en Uno - ${language === 'es' ? 'Página' : 'Page'} ${i}/${totalPages}`,
            margin,
            pageHeight - 10
        );
    }

    // Generate filename
    const filename = `informe_radar_${language}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Save the PDF
    pdf.save(filename);

    return filename;
}

export async function captureAndExport(elementId, filename) {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(filename);
}
