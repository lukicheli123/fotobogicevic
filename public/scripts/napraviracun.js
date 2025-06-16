app.get('/api/admin/pdf/:broj', (req, res) => {
    const broj = req.params.broj;

    const sql = 'SELECT * FROM porudzbine WHERE broj_porudzbine = ?';

    db.query(sql, [broj], async (err, rows) => {
        if (err || !rows.length) return res.status(404).send('Porudžbina nije pronađena');

        const p = rows[0];
        const brojSlika = p.kolicina || 0; // ako već imaš "kolicina" u tabeli
        const cenaPoKom = 200;
        const ukupno = brojSlika * cenaPoKom;

        const PDFDocument = require('pdfkit');
        const fs = require('fs');
        const path = require('path');

        const doc = new PDFDocument({ margin: 50 });
        const filePath = path.join(__dirname, `/pdf/porudzbina_${broj}.pdf`);
        doc.pipe(fs.createWriteStream(filePath));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=porudzbina_${broj}.pdf`);
        doc.pipe(res);

        // Pozadina
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#fefee9');
        doc.fillColor('black');

        // Font
        doc.registerFont('DejaVu', path.join(__dirname, 'fonts', 'DejaVuSans.ttf'));
        doc.registerFont('DejaVuBold', path.join(__dirname, 'fonts', 'DejaVuSans-Bold.ttf'));
        doc.registerFont('DejaVuItalic', path.join(__dirname, 'fonts', 'DejaVuSans-Oblique.ttf'));
        doc.font('DejaVu');

        // Logo
        const logoPath = path.join(__dirname, 'public/logo/logo2-crni.png');
        const logoWidth = 120;
        doc.image(logoPath, doc.page.width - logoWidth - 33, 5, { width: logoWidth });

        // Desna strana: datum i broj porudžbine
        doc.moveDown(3);
        doc.fontSize(11).text(`Datum: ${new Date().toLocaleDateString('sr-RS')}`, { align: 'right' });
        doc.moveDown(0.5);
        doc.text(`Broj porudžbine: #${broj}`, { align: 'right' });

        // Leva strana: podaci o kupcu
        doc.moveDown(1.5);
        doc.font('DejaVuBold').fontSize(12).text('Podaci o kupcu:');
        doc.moveDown(0.5);
        doc.font('DejaVu').fontSize(11);
        doc.text(`Ime: ${p.ime} ${p.prezime}`);
        doc.moveDown(0.5);
        doc.text(`Telefon: ${p.telefon}`);
        doc.moveDown(0.5);
        doc.text(`E-mail: ${p.email}`);
        doc.moveDown(3.5);

        // Tabela – samo jedan red: "Fotografija"
        const startX = 50;
        const startY = doc.y;
        const rowHeight = 25;
        const colWidths = [200, 100, 100, 100];
        const headers = ['Opis', 'Količina', 'Cena/kom', 'Ukupno'];
        const colX = [
            startX,
            startX + colWidths[0],
            startX + colWidths[0] + colWidths[1],
            startX + colWidths[0] + colWidths[1] + colWidths[2],
            startX + colWidths.reduce((a, b) => a + b, 0),
        ];

        // Header linije
        for (let i = 0; i <= 2; i++) {
            const y = startY + i * rowHeight;
            doc.moveTo(startX, y).lineTo(colX[4], y).stroke();
        }
        for (let i = 0; i < colX.length; i++) {
            doc.moveTo(colX[i], startY).lineTo(colX[i], startY + 2 * rowHeight).stroke();
        }

        // Header tekst
        doc.font('DejaVuBold').fontSize(11);
        headers.forEach((h, i) => {
            doc.text(h, colX[i] + 5, startY + 7);
        });

        // Red: Fotografija
        doc.font('DejaVu').fontSize(11);
        const yRed = startY + rowHeight + 7;
        const red = ['Fotografija', brojSlika, `${cenaPoKom} RSD`, `${ukupno} RSD`];
        red.forEach((cell, i) => {
            doc.text(cell.toString(), colX[i] + 5, yRed, {
                width: colWidths[i] - 10,
                align: i === 0 ? 'left' : 'center'
            });
        });

        // "Ukupno" red
        const ukupnoY = startY + 2 * rowHeight;
        doc.moveTo(startX, ukupnoY).lineTo(colX[4], ukupnoY).stroke();
        doc.moveTo(startX, ukupnoY + rowHeight).lineTo(colX[4], ukupnoY + rowHeight).stroke();
        doc.moveTo(startX, ukupnoY).lineTo(startX, ukupnoY + rowHeight).stroke();
        doc.moveTo(colX[3], ukupnoY).lineTo(colX[3], ukupnoY + rowHeight).stroke();
        doc.moveTo(colX[4], ukupnoY).lineTo(colX[4], ukupnoY + rowHeight).stroke();

        doc.font('DejaVuBold').text('Ukupno:', colX[0] + 5, ukupnoY + 7, {
            width: colX[3] - colX[0] - 10,
            align: 'left'
        });
        doc.text(`${ukupno} RSD`, colX[3] + 5, ukupnoY + 7, {
            width: colWidths[3] - 10,
            align: 'center'
        });

        // Potpis
        const yPotpis = ukupnoY + rowHeight + 50;
        doc.font('DejaVuItalic').fontSize(11).text('Potpis: ____________________', startX, yPotpis);

        doc.end();

        if (req.session.admin?.username) {
            logAkcija(req.session.admin.username, `Pregled PDF-a porudžbine #${broj}`);
        }
    });
});
