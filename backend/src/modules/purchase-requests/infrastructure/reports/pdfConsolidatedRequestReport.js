import PDFDocument from 'pdfkit';

/**
 * Escribe el PDF de "solicitud de cotización" (RFQ) para mandarle al
 * proveedor, a partir de las líneas ya consolidadas (agrupadas por
 * producto+unidad). Solo se genera y se descarga: el sistema no manda nada
 * automático al proveedor. Los headers HTTP los define el controller antes
 * de llamar aquí, mismo criterio que streamPdfReport (logs).
 */
export const streamConsolidatedRequestPdf = (lines, meta, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(18).text('Solicitud de cotización', { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(10);
    doc.text(meta.companyName, { align: 'center' });
    doc.text(`Solicitudes de origen: ${meta.requestCodes.join(', ')}`, { align: 'center' });
    doc.text(`Fecha: ${meta.generatedAt.toLocaleDateString('es-ES')}`, { align: 'center' });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    const tableTop = doc.y;
    const rowHeight = 22;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Producto', 50, tableTop, { width: 220 });
    doc.text('Unidad', 270, tableTop, { width: 80 });
    doc.text('Cantidad solicitada', 350, tableTop, { width: 100 });
    doc.text('Precio / condiciones (proveedor)', 450, tableTop, { width: 100 });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    doc.font('Helvetica').fontSize(8);
    let y = tableTop + 20;

    lines.forEach((line) => {
        if (y > 700) {
            doc.addPage();
            y = 50;
        }

        doc.text(line.productName, 50, y, { width: 220 });
        doc.text(line.unitName, 270, y, { width: 80 });
        doc.text(String(line.totalQuantity), 350, y, { width: 100 });
        // Espacio en blanco para que el proveedor anote a mano precio y condiciones.
        doc.moveTo(450, y + 12).lineTo(545, y + 12).stroke();

        y += rowHeight;
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.fontSize(9);
    doc.text(
        'Documento generado por el sistema. Favor completar precios y condiciones comerciales y devolverlo cotizado.',
        50,
        doc.y + 10,
        { width: 500 },
    );

    doc.end();
};
