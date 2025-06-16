// logger.js

const mysql = require('mysql2');

// Kreiranje MySQL konekcije bez .env fajla
const db = mysql.createConnection({
        host: 'sql.freedb.tech',
        user: 'freedb_luka1',
        password: '9DjhFYY#Tq$hBd9',
        database: 'freedb_bazapodatak'
    });

db.connect((err) => {
    if (err) {
        console.error('❌ Greška pri povezivanju na bazu:', err);
    } else {
        console.log('✅ Logger povezan sa bazom.');
    }
});

/**
 * Upisuje admin aktivnost u audit log tabelu
 * @param {string} username - korisničko ime admina
 * @param {string} akcija - opis akcije
 * @param {object} [options] - dodatne opcije (npr. filteri)
 * @param {string[]} [options.ignoreKeywords] - lista ključnih reči koje treba ignorisati
 */
function logAkcija(username, akcija, options = {}) {
    if (!username || !akcija) return;

    if (typeof username !== 'string') {
        console.warn('⚠️ logAkcija: očekivan string za username, dobio:', username);
    }
    if (typeof akcija !== 'string') {
        console.warn('⚠️ logAkcija: očekivan string za akcija, dobio:', akcija);
    }

    const allIgnoreKeywords = ['audit log', ...(options.ignoreKeywords || [])];
    const akcijaLower = akcija.toString().toLowerCase();
    if (allIgnoreKeywords.some(keyword => akcijaLower.includes(keyword))) return;

    console.log(`[AUDIT] ${username} -> ${akcija}`);

    db.query(
        'INSERT INTO audit_log (admin_username, akcija) VALUES (?, ?)',
        [String(username), String(akcija)],
        (err) => {
            if (err) console.error('Greška pri logovanju akcije:', err);
        }
    );
}

/**
 * Upisuje sistemsku akciju (nema admina)
 * @param {string} akcija - opis akcije
 * @param {object} [options] - dodatne opcije (npr. filteri)
 */
function logSystemAkcija(akcija, options = {}) {
    if (!akcija) return;

    if (typeof akcija !== 'string') {
        console.warn('⚠️ logSystemAkcija: očekivan string za akcija, dobio:', akcija);
    }

    const allIgnoreKeywords = ['audit log', ...(options.ignoreKeywords || [])];
    const akcijaLower = akcija.toString().toLowerCase();
    if (allIgnoreKeywords.some(keyword => akcijaLower.includes(keyword))) return;

    console.log(`[AUDIT] sistem -> ${akcija}`);

    db.query(
        'INSERT INTO audit_log (admin_username, akcija) VALUES (?, ?)',
        ['sistem', String(akcija)],
        (err) => {
            if (err) console.error('Greška pri logovanju sistemske akcije:', err);
        }
    );
}

module.exports = {
    logAkcija,
    logSystemAkcija
};
