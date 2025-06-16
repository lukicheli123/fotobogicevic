const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// TEST ruta za proveru slanja mejla
router.get('/email', (req, res) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'lukanoob744@gmail.com',
            pass: 'glnqhynzpqzwxqdq' // proveri da li je važeći app password
        }
    });

    const mailOptions = {
        from: 'lukanoob744@gmail.com',
        to: 'bogdanovicluka33@gmail.com', // 👈 promeni po želji
        subject: 'Test poruka sa servera',
        text: 'Ovo je test poruka sa servera Foto Bogićević.'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('❌ Greška pri slanju:', error);
            return res.status(500).send('Greška pri slanju emaila');
        } else {
            console.log('✅ Email uspešno poslat:', info.response);
            return res.send('Email uspešno poslat!');
        }
    });
});

module.exports = router;
