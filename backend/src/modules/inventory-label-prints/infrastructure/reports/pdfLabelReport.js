import PDFDocument from 'pdfkit';

// Hoja de etiquetas para imprimir y recortar/pegar en el lote físico
// (ERS 6.9.9, RN-INV-016). No hay librería de código de barras en el
// proyecto: el "código" identificador es products.internalCode en texto
// grande, mismo dato que ya se usaba como referencia en el comentario del
// use-case de impresión. Una etiqueta por cada unidad de quantityPrinted,
// en grilla para recortar.
const LABEL_WIDTH = 150;
const LABEL_HEIGHT = 70;
const COLS = 3;
const ROWS = 9;
const GAP_X = 10;
const GAP_Y = 8;
const MARGIN = 50;

export const streamLabelSheetPdf = (lot, labelPrint, res) => {
    const doc = new PDFDocument({ margin: MARGIN, size: 'A4' });
    doc.pipe(res);

    const total = labelPrint.quantityPrinted;
    const perPage = COLS * ROWS;

    for (let i = 0; i < total; i += 1) {
        const posInPage = i % perPage;
        if (posInPage === 0 && i > 0) doc.addPage();

        const col = posInPage % COLS;
        const row = Math.floor(posInPage / COLS);
        const x = MARGIN + col * (LABEL_WIDTH + GAP_X);
        const y = MARGIN + row * (LABEL_HEIGHT + GAP_Y);

        doc.rect(x, y, LABEL_WIDTH, LABEL_HEIGHT).stroke();

        doc.fontSize(8).font('Helvetica').text(lot.product?.name || '-', x + 6, y + 6, {
            width: LABEL_WIDTH - 12,
            height: 20,
            ellipsis: true,
        });

        doc.fontSize(14).font('Helvetica-Bold').text(lot.product?.internalCode || '-', x + 6, y + 26, {
            width: LABEL_WIDTH - 12,
        });

        doc.fontSize(7).font('Helvetica').text(`Lote: ${lot.lotCode}`, x + 6, y + 46, {
            width: LABEL_WIDTH - 12,
        });

        doc.fontSize(7).text(`${i + 1}/${total}`, x + 6, y + 57, {
            width: LABEL_WIDTH - 12,
        });
    }

    doc.end();
};
