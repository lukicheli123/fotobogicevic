const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const fs = require('fs');
const mysql = require("mysql2");
const router = express.Router();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
global.io = io;
let db;


app.use(express.static('public')); // ili gde god se nalaze tvoji HTML fajlovi
function connectToDatabase() {
    db = mysql.createConnection({
        host: 'sql.freedb.tech',
        user: 'freedb_luka1',
        password: '9DjhFYY#Tq$hBd9',
        database: 'freedb_bazapodatak'
    });
    db = db.promise();
    db.connect((err) => {
        if (err) {
            console.error('Failed to connect to MySQL Database:', err);
            // Pokušajte ponovno povezivanje svakih 5 sekundi ako se ne uspije povezati
            setTimeout(connectToDatabase, 5000);
            return;
        }
        console.log('Povezano na bazu (recenzije)');
    });

    // Dodajte slušatelj za događaje greške veze s bazom podataka
    db.on('error', (err) => {
        console.error('Database connection error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            // Ako je veza izgubljena, ponovo se povežite
            connectToDatabase();
        } else {
            throw err;
        }
    });
}
connectToDatabase();


// Konfigurisanje Multera za upload slika
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// GET - sve recenzije
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT id, name, text, image, rating, date
            FROM reviews
            WHERE status = "odobrena"
            ORDER BY date DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Greška servera' });
    }
});

router.get('/admin', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT id, name, text, image, rating, date, status
            FROM reviews
            ORDER BY date DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('Greška pri dohvatanju svih recenzija za admina:', err);
        res.status(500).json({ error: 'Greška servera' });
    }
});
// DELETE - briši recenziju
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    console.log('📌 STIGAO DELETE ZA ID:', id);

    if (!id || isNaN(id)) {
        console.warn('❌ Nevalidan ID za brisanje:', id);
        return res.status(400).json({ error: 'Nevalidan ID' });
    }

    try {
        const [rows] = await db.query('SELECT image FROM reviews WHERE id = ?', [id]);

        if (rows.length === 0) {
            console.warn('⚠️ Recenzija sa ID ne postoji:', id);
            return res.status(404).json({ error: 'Recenzija ne postoji' });
        }

        const imgField = rows[0].image || '';
        const relPath = imgField.startsWith('/') ? imgField.slice(1) : imgField;
        const imagePath = path.join(__dirname, '..', relPath);
        console.log('🗂️ Pokušavam da obrišem fajl:', imagePath);

        try {
            if (relPath && fs.existsSync(imagePath)) {
                await fs.promises.unlink(imagePath);
                console.log('🗑️ Fajl obrisan:', imagePath);
            }
        } catch (unlinkErr) {
            console.error('❌ Greška pri brisanju fajla:', unlinkErr);
            // Fajl možda ne postoji – nastavi dalje
        }

        const [result] = await db.query('DELETE FROM reviews WHERE id = ?', [id]);
        console.log('✅ Recenzija obrisana iz baze. affectedRows =', result.affectedRows);

        res.json({ message: 'Uspešno obrisano' });

    } catch (err) {
        console.error('❌ Greška pri brisanju recenzije:', err);
        res.status(500).json({ error: 'Greška servera pri brisanju' });
    }
});


// POST - dodaj recenziju
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, text, rating } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        await db.query(
            'INSERT INTO reviews (name, text, image, rating, status, date) VALUES (?, ?, ?, ?, "na čekanju", NOW())',
            [name, text, image, rating]
        );

        console.log('🆕 Nova recenzija na čekanju:', name);

        if (global.io) {
            global.io.emit('nova_recenzija', {
                ime: name,
                ocena: rating
            });
        }

        res.status(201).json({ message: 'Recenzija sačuvana i čeka odobrenje' });
    } catch (err) {
        console.error('❌ Greška pri unosu recenzije:', err);
        res.status(500).json({ error: 'Greška servera' });
    }
});
// ✅ Odobri recenziju
router.put('/odobri/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE reviews SET status = "odobrena" WHERE id = ?', [id]);
        console.log('✔️ Recenzija odobrena, ID:', id);
        res.json({ message: 'Recenzija odobrena' });
    } catch (err) {
        console.error('Greška pri odobravanju:', err);
        res.status(500).json({ error: 'Greška servera' });
    }
});

// ❌ Odbij recenziju
router.put('/odbij/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE reviews SET status = "odbijena" WHERE id = ?', [id]);
        console.log('❌ Recenzija odbijena, ID:', id);
        res.json({ message: 'Recenzija odbijena' });
    } catch (err) {
        console.error('Greška pri odbijanju:', err);
        res.status(500).json({ error: 'Greška servera' });
    }
});
module.exports = router;
