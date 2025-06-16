    const { logAkcija, logSystemAkcija } = require('./logger');
    const express = require("express");
    const fs = require("fs");
    const path = require("path");
    const multer = require("multer");
    const bodyParser = require("body-parser");
    const exifParser = require("exif-parser");
    const session = require("express-session");
    const mysql = require("mysql2");
    const PDFDocument = require('pdfkit');
    const QRCode = require('qrcode');
    //za recenzije
    const cors = require('cors');
    const reviewsRouter = require('./routes/reviews');
    const archiver = require('archiver');
    const app = express();
    const port = process.env.PORT || 4000;
    const imagesFolder = path.join(__dirname, "public/images");
    const sliderFolder = path.join(__dirname, "public/Slider")
    const categoriesFile = path.join(__dirname, "categories.json");

    const adminUsername = "lukicheli";
    const adminPassword = "svejeovopremalozakraj";
    const router = express.Router();
    let db;
    const http = require("http");
    const server = http.createServer(app);

    const { Server } = require("socket.io");
    const io = new Server(server);

    // Emituj svima pristupnog admin panela kada se nova porudžbina desi
    app.set("io", io); // omogućava da koristimo io u drugim fajlovima ako treba
    // ✅ Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // ✅ Static fajlovi
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    app.use(express.static(path.join(__dirname, 'public')));

    // za admin
    app.use('/uploads/narudzbineslike', express.static(path.join(__dirname, 'uploads/photos')));

    app.get("/galerija", (req, res) => {
        res.sendFile(path.join(__dirname, "public/narucivanje(stari).html"));
        });
    app.get("/narucivanjeslika", (req, res) => {
        res.sendFile(path.join(__dirname, "public/narucivanjeslika.html"));
    });
    app.get("/cenovnik", (req, res) => {
        res.sendFile(path.join(__dirname, "public/cenovnik.html"));
    });
    // ✅ Rute
    app.use('/api/reviews', reviewsRouter);
    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "index.html"));
    });
    // 📄 Frontend HTML rute (bez .html u URL-u)

    app.get("/login", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "adminizbor.html"));
    });

    app.get("/admin", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "admin.html"));
    });
    app.get("/admin_porudzbine", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "admin_porudzbine.html"));
    });

    app.get("/admin_orders", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "admin_orders.html"));
    });

    app.get("/admin_slider", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "admin_slider.html"));
    });

    app.get("/admin_zakazivanja", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "admin_zakazivanja.html"));
    });

    app.get("/admin_recenzije", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "admin_recenzije.html"));
    });

    app.get("/admin_audit", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "admin_audit.html"));
    });

    app.get("/superadmini", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "admin_admini.html"));
    });

    app.get("/narucivanje", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "narucivanjeslika.html"));
    });

    app.get("/cart", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "cart.html"));
    });

    app.get("/pracenje", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "pracenje.html"));
    });

    app.get("/admin_uplate", (req, res) => {
        res.sendFile(path.join(__dirname, "public", "admin_uplate.html"));
    });

    app.post("/api/zakazivanje", (req, res) => {
        const { ime, prezime, email, telefon, usluga, datum } = req.body;

        if (!ime || !prezime || !email || !telefon || !usluga || !datum) {
            return res.status(400).send("Sva polja su obavezna.");
        }

        const sql = `
            INSERT INTO zakazivanja (ime, prezime, email, telefon, usluga, zakazano_vreme)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, [ime, prezime, email, telefon, usluga, datum], (err) => {
            if (err) {
                console.error("❌ Greška pri upisu u bazu:", err);
                return res.status(500).send("Greška pri zakazivanju termina.");
            }

            console.log(`
    📸 NOVO ZAKAZIVANJE
    ━━━━━━━━━━━━━━━━━━━━━━━
    🧑 ${ime} ${prezime}
    📧 ${email}
    📱 ${telefon}
    🛎️ ${usluga}
    📅 Datum: ${datum}
    ━━━━━━━━━━━━━━━━━━━━━━━
        `);

            res.status(200).send("Uspešno zakazano!");
        });
    });


    function connectToDatabase() {
        db = mysql.createConnection({
            host: 'sql.freedb.tech',
            user: 'freedb_luka1',
            password: '9DjhFYY#Tq$hBd9',
            database: 'freedb_bazapodatak'
        });

        db.connect((err) => {
            if (err) {
                console.error('Failed to connect to MySQL Database:', err);
                // Pokušajte ponovno povezivanje svakih 5 sekundi ako se ne uspije povezati
                setTimeout(connectToDatabase, 5000);
                return;
            }
            console.log('Connected to MySQL Database');
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

    server.listen(port, () => {
        console.log(`🚀 Server pokrenut na http://localhost:${port}`);
    });
    if (!fs.existsSync(imagesFolder)) {
      fs.mkdirSync(imagesFolder);
    }

    if (!fs.existsSync(categoriesFile)) {
      fs.writeFileSync(categoriesFile, JSON.stringify(["Sve"]));
    }

    app.use(express.static("public"));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(
      session({
        secret: "your-secret-key",
        resave: false,
        saveUninitialized: true,
      })
    );

    // Multer storage setup
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const category = req.body.category;
        const categoryPath = path.join(imagesFolder, category);
        if (!fs.existsSync(categoryPath)) {
          fs.mkdirSync(categoryPath);
        }
        cb(null, categoryPath);
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
      },
    });
    const upload = multer({ storage: storage });

    function checkAuthentication(req, res, next) {
      if (req.session.authenticated) {
        next();
      } else {
        res.redirect("/adminlogin");
      }
    }

    app.get("/admin", checkAuthentication, (req, res) => {
      res.sendFile(path.join(__dirname, "public/admin.html"));
    });

    app.get("/admin_orders", checkAuthentication, (req, res) => {
      res.sendFile(path.join(__dirname, "public/admin_orders.html"));
    });



    // app.post("/login", (req, res) => {
    //   const { username, password } = req.body;
    //   if (username === adminUsername && password === adminPassword) {
    //     req.session.authenticated = true;
    //     res.redirect("/admin");
    //   } else {
    //     res.redirect("/login");
    //   }
    // });

    app.get("/logout", (req, res) => {
        if (req.session.admin?.username) {
            logAkcija(req.session.admin.username, 'Odjava sa admin panela');
        }
        req.session.destroy();
    });
    app.get("/categories", (req, res) => {
      const categories = JSON.parse(fs.readFileSync(categoriesFile));
      res.json(categories);
    });

    app.post("/add-category", checkAuthentication, (req, res) => {
      const newCategory = req.body.category;
      let categories = JSON.parse(fs.readFileSync(categoriesFile));
      if (!categories.includes(newCategory)) {
        categories.push(newCategory);
        fs.writeFileSync(categoriesFile, JSON.stringify(categories));
        const newCategoryPath = path.join(imagesFolder, newCategory);
        if (!fs.existsSync(newCategoryPath)) {
          fs.mkdirSync(newCategoryPath);
        }
      }
      res.json(categories);
    });

    app.post("/delete-category", checkAuthentication, (req, res) => {
      const category = req.body.category;
      let categories = JSON.parse(fs.readFileSync(categoriesFile));
      if (categories.includes(category)) {
        categories = categories.filter((cat) => cat !== category);
        fs.writeFileSync(categoriesFile, JSON.stringify(categories));
        const categoryPath = path.join(imagesFolder, category);
        if (fs.existsSync(categoryPath)) {
          fs.rmSync(categoryPath, { recursive: true, force: true });
        }
      }
      res.json(categories);
    });

    app.post(
      "/upload-image",
      checkAuthentication,
      upload.array("images", 12),
      (req, res) => {
        res.send("Images uploaded successfully");
      }
    );

    app.get("/images/:category", (req, res) => {
      const category = req.params.category;
      let imageDetails = [];

      const readImagesFromFolder = (folder) => {
        if (!fs.existsSync(folder)) return [];
        return fs
          .readdirSync(folder)
          .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file))
          .map((file) => {
            const filePath = path.join(folder, file);
            const buffer = fs.readFileSync(filePath);
            let takenDate = "Nepoznato";

            try {
              const parser = exifParser.create(buffer);
              const result = parser.parse();
              takenDate = result.tags.DateTimeOriginal || result.tags.CreateDate;
              takenDate = takenDate
                ? new Date(takenDate * 1000).toLocaleString()
                : "Unknown";
            } catch (error) {
              console.warn("Error parsing EXIF data:", error);
            }

            return {
              file: `${path.relative(imagesFolder, folder)}/${file}`,
              takenDate,
            };
          });
      };

      if (category === "Sve") {
        const subfolders = fs
          .readdirSync(imagesFolder)
          .filter((subfolder) =>
            fs.statSync(path.join(imagesFolder, subfolder)).isDirectory()
          );
        subfolders.forEach((subfolder) => {
          const subfolderPath = path.join(imagesFolder, subfolder);
          imageDetails = imageDetails.concat(readImagesFromFolder(subfolderPath));
        });
      } else {
        const categoryFolder = path.join(imagesFolder, category);
        imageDetails = readImagesFromFolder(categoryFolder);
      }

      imageDetails.sort((a, b) => new Date(b.takenDate) - new Date(a.takenDate)); // Sort by newest first
      res.json(imageDetails);
    });

    app.post("/order-images", (req, res) => {
      const { imeiprezime, brojtelefona, email, images } = req.body;

      if (!imeiprezime || !brojtelefona || !email || !images.length) {
        return res.status(400).send("Sva polja popuni");
      }

      const orderNumber = Math.floor(Math.random() * 1000000);

      const orderData = {
        imeiprezime,
        brojtelefona,
        email,
        images: JSON.stringify(images),
        orderNumber,
      };

      // Dodajte dva sata na trenutni datum
      const orderDate = new Date();
      orderDate.setHours(orderDate.getHours());

      const sql =
        "INSERT INTO orders (imeiprezime, brojtelefona, email, images, order_number, order_date) VALUES (?, ?, ?, ?, ?, ?)";

      db.query(
        sql,
        [
          orderData.imeiprezime,
          orderData.brojtelefona,
          orderData.email,
          orderData.images,
          orderData.orderNumber,
          orderDate,
        ],
        (err, result) => {
          if (err) {
            console.error("Failed to save order:", err); // Log error
            return res.status(500).send("Failed to save order");
          }

          req.session.order = {
            orderNumber,
            imeiprezime,
            brojtelefona,
            email,
            images,
          };
          console.log("Nova narudzbina", req.session.order);
          res.send(orderNumber.toString());
        }
      );
        // 📧 Konfigurisanje transporta (možeš koristiti Gmail, Outlook...)
        const adminemail = 'ognjenbogicevicbogi@gmail.com';
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'lukanoob744@gmail.com',
                pass: 'glnqhynzpqzwxqdq' // Koristi "App Password" ako koristiš Gmail
            }
        });

        const mailOptions = {
            from: 'Foto Bogićević <fotobogicevic@outlook.com>',
            to: adminemail,
            subject: `📸 Nova porudžbina G${orderNumber}`,
            html: `
            <h2>Nova porudžbina</h2>
            <p><strong>Broj porudžbine:</strong> G${orderNumber}</p>
            <p><strong>Ime i prezime:</strong> ${imeiprezime}</p>
            <p><strong>Kontakt telefon:</strong> ${brojtelefona}</p>
            <p><strong>Broj slika:</strong> ${images.length}</p>
            <p><strong>Email:</strong> ${email}</p>
          
            
        `
        };

        // 📤 Slanje mejla
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Greška prilikom slanja mejla:', error);
                res.status(500).send('Greška prilikom slanja mejla.');
            } else {
                console.log('Email poslat: ' + info.response);
                res.status(200).send(orderNumber.toString());
            }
        });

    });
    app.get("/orders", checkAuthentication, (req, res) => {
        const sql = `
    SELECT o.*
    FROM orders o
    INNER JOIN uplate u ON u.broj_porudzbine = o.order_number
    WHERE u.status = 'odobreno'
    ORDER BY o.order_date DESC
  `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error("Failed to retrieve orders:", err);
                return res.status(500).send("Failed to retrieve orders");
            }

            try {
                const formattedResults = results.map((order) => {
                    const images = JSON.parse(order.images)
                        .map((image) => {
                            const filePath = path.join(imagesFolder, image);
                            if (!fs.existsSync(filePath)) return null;
                            const buffer = fs.readFileSync(filePath);
                            let takenDate = "Nepoznato";

                            try {
                                const parser = exifParser.create(buffer);
                                const result = parser.parse();
                                takenDate =
                                    result.tags.DateTimeOriginal || result.tags.CreateDate;
                                takenDate = takenDate
                                    ? new Date(takenDate * 1000).toLocaleString()
                                    : "Unknown";
                            } catch (error) {
                                console.warn("Error parsing EXIF data:", error);
                            }

                            return {
                                file: image,
                                takenDate,
                            };
                        })
                        .filter((image) => image !== null);

                    return {
                        order_number: order.order_number,
                        imeiprezime: order.imeiprezime,
                        brojtelefona: order.brojtelefona,
                        email: order.email,
                        order_date: new Date(order.order_date).toLocaleString(),
                        images,
                    };
                });

                res.json(formattedResults);
            } catch (parseError) {
                console.error("Failed to parse order images:", parseError);
                res.status(500).send("Failed to parse order images");
            }
        });


    });


    app.get("/cart", (req, res) => {
      res.sendFile(path.join(__dirname, "public/cart.html"));
    });

    // Multer storage za slider
    const sliderStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, sliderFolder);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + path.extname(file.originalname));
        },
    });
    const sliderUpload = multer({ storage: sliderStorage });

    // API za slider slike
    app.get("/api/slider-images", (req, res) => {
        const sql = "SELECT * FROM slider_images";
        db.query(sql, (err, results) => {
            if (err) {
                console.error("Error fetching slider images:", err);
                return res.status(500).send("Failed to fetch slider images");
            }
            res.json(results);
        });
    });

    // Upload slike u slider
    app.post("/upload-slider", checkAuthentication, sliderUpload.single("image"), (req, res) => {
        const filename = req.file.filename;
        const filepath = `/Slider/${filename}`; // javni put
        const sql = "INSERT INTO slider_images (filename, path) VALUES (?, ?)";
        db.query(sql, [filename, filepath], (err) => {
            if (err) {
                console.error("Failed to save image in DB:", err);
                return res.status(500).send("Failed to save image");
            }
            res.send("Image uploaded and saved successfully");
        });
    });

    // Brisanje slider slike
    app.post("/delete-slider", checkAuthentication, (req, res) => {
        const { id } = req.body;
        const sqlSelect = "SELECT * FROM slider_images WHERE id = ?";
        db.query(sqlSelect, [id], (err, results) => {
            if (err || results.length === 0) return res.status(404).send("Image not found");
            const filepath = path.join(sliderFolder, results[0].filename);
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            const sqlDelete = "DELETE FROM slider_images WHERE id = ?";
            db.query(sqlDelete, [id], (err) => {
                if (err) return res.status(500).send("Failed to delete image");
                res.send("Image deleted successfully");
            });
        });
    });

    app.get("/api/sva-zakazivanja", (req, res) => {
        db.query("SELECT * FROM zakazivanja ORDER BY zakazano_vreme DESC", (err, results) => {
            if (err) {
                console.error("Greška pri dohvatu zakazivanja:", err);
                return res.status(500).send("Greška servera");
            }
            res.json(results);
        });
    });
    const photoUpload = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadPath = path.join(__dirname, 'uploads/photos');
            if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname);
        }
    });
    const uploadPhotos = multer({ storage: photoUpload });

    app.post("/api/porudzbina-slike", uploadPhotos.any(), (req, res) => {
        const photoCount = parseInt(req.body.photoCount);
        const {ime, prezime, telefon, email, napomena} = req.body;

        // 🔢 Generiši broj porudžbine (6 cifara)
        const orderNumber = Math.floor(100000 + Math.random() * 900000);
        if (!ime || !prezime || !telefon || !email || isNaN(photoCount)) {
            return res.status(400).json({message: "Nedostaju podaci"});
        }

        function getCena(format, kolicina) {
            kolicina = parseInt(kolicina);
            if (format === '10x15') {
                if (kolicina <= 50) return 55;
                if (kolicina <= 100) return 50;
                if (kolicina <= 200) return 45;
                return 40;
            } else if (format === '13x18') {
                if (kolicina <= 50) return 67;
                if (kolicina <= 100) return 62;
                if (kolicina <= 200) return 57;
                return 50;
            }
            return 0;
        }

        const sql = `
            INSERT INTO porudzbine (ime, prezime, telefon, slika_path, kolicina, format, cena, email, napomena,
                                    broj_porudzbine, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'na čekanju')
        `;

        const photoInsertPromises = [];

        for (let i = 0; i <= photoCount; i++) {
            const file = req.files.find(f => f.fieldname === `photo${i}`);
            const format = req.body[`format${i}`];
            const quantity = req.body[`quantity${i}`];

            if (!file || !format || !quantity) continue;

            const cenaPoKomadu = getCena(format, quantity);
            const ukupnaCena = parseInt(quantity) * cenaPoKomadu;

            photoInsertPromises.push(
                new Promise((resolve, reject) => {
                    db.query(sql, [
                        ime,
                        prezime,
                        telefon,
                        file.filename,
                        quantity,
                        format,
                        ukupnaCena,
                        email,
                        napomena,
                        orderNumber
                    ], (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                })
            );
        }

        Promise.all(photoInsertPromises)
            .then(() => {
                console.log(`
    📸 NOVA PORUDŽBINA SLIKA
    ━━━━━━━━━━━━━━━━━━━━━━━
    🧑 ${ime} ${prezime}
    📧 ${email}
    📱 ${telefon}
    📝 Napomena: ${napomena || 'Nema'}
    🔢 Broj porudžbine: ${orderNumber}
    🖼️ Ukupno slika: ${photoCount}
    ━━━━━━━━━━━━━━━━━━━━━━━
            `);
                io.emit('nova_porudzbina', {
                    broj_porudzbine: orderNumber,
                    ime,
                    prezime
                });
                const nodemailer = require('nodemailer');
                const adminEmail = 'ognjenbogicevicbogi@gmail.com';

// 📧 Pošalji adminu obaveštenje o novoj porudžbini
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'lukanoob744@gmail.com',
                        pass: 'glnqhynzpqzwxqdq' // ili koristi process.env ako koristiš .env fajl
                    }
                });

                    const mailOptions = {
                        from: 'Foto Bogićević <fotobogicevic@outlook.com>',
                        to: adminEmail,
                        subject: `📸 Nova porudžbina #${orderNumber}`,
                        html: `
            <h2>Nova porudžbina</h2>
            <p><strong>Broj porudžbine:</strong> #${orderNumber}</p>
            <p><strong>Ime i prezime:</strong> ${ime} ${prezime}</p>
            <p><strong>Telefon:</strong> ${telefon}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Adresa (napomena):</strong> ${napomena || 'Nema'}</p>
            <p><strong>Ukupno naručenih fotografija:</strong> ${photoCount}</p>
    `
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('❌ Greška pri slanju emaila adminu:', error);
                    } else {
                        console.log('✅ Email o porudžbini poslat adminu:', info.response);
                    }
                });
                res.json({message: "Porudžbina uspešno poslata!", orderNumber});
            })
            .catch(err => {
                console.error("Greška pri upisu u bazu:", err);
                res.status(500).json({message: "Greška pri slanju porudžbine."});
            });
    });
        app.get('/api/admin/porudzbine', checkAdmin, (req, res) => {
            const strana = parseInt(req.query.strana) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status || null;
            const offset = (strana - 1) * limit;

            const whereClause = status ? 'WHERE status = ?' : '';
            const params = status ? [status, limit, offset] : [limit, offset];

            const sql = `
                SELECT * FROM porudzbine
                ${whereClause}
                ORDER BY broj_porudzbine DESC
                LIMIT ? OFFSET ?
            `;

            db.query(sql, params, (err, rows) => {
                if (err) return res.status(500).json({ message: 'Greška u bazi' });

                if (req.session.admin?.username) {
                    logAkcija(req.session.admin.username, 'Otvorio pregled svih porudžbina');
                }

                const grouped = {};
                rows.forEach(row => {
                    const broj = row.broj_porudzbine;
                    if (!grouped[broj]) {
                        grouped[broj] = {
                            broj_porudzbine: broj,
                            ime: row.ime,
                            prezime: row.prezime,
                            telefon: row.telefon,
                            email: row.email,
                            napomena: row.napomena,
                            status: row.status,
                            status_izrade: row.status_izrade, // ✅ OVO DODAJ!
                            datum:row.datum.toLocaleString('sr-RS'),
                            slike: []
                        };
                    }
                    grouped[broj].slike.push({
                        filename: row.slika_path,
                        format: row.format,
                        kolicina: row.kolicina,
                        cena: row.cena
                    });
                });

                // Poseban upit za broj ukupnih porudžbina (za frontend paginaciju)
                const countSql = status
                    ? 'SELECT COUNT(DISTINCT broj_porudzbine) AS total FROM porudzbine WHERE status = ?'
                    : 'SELECT COUNT(DISTINCT broj_porudzbine) AS total FROM porudzbine';

                db.query(countSql, status ? [status] : [], (err2, result) => {
                    if (err2) return res.status(500).json({ message: 'Greška pri brojanju' });

                    const total = result[0].total;
                    const ukupnoStrana = Math.ceil(total / limit);

                    res.json({
                        porudzbine: Object.values(grouped),
                        ukupnoStrana,
                        trenutnaStrana: strana
                    });
                });
            });
        });

    app.delete('/api/admin/porudzbine/:broj', checkAdmin, (req, res) => {
        const brojPorudzbine = req.params.broj;

        // 1. Dohvati sve slike povezane sa ovom porudžbinom
        db.query('SELECT slika_path FROM porudzbine WHERE broj_porudzbine = ?', [brojPorudzbine], (err, rows) => {
            if (err) {
                console.error("Greška pri čitanju iz baze:", err);
                return res.status(500).send("Greška u bazi.");
            }

            if (!rows.length) {
                return res.status(404).send("Porudžbina nije pronađena.");
            }

            // 2. Obriši sve slike sa diska
            rows.forEach(row => {
                const imgPath = path.join(__dirname, 'uploads', 'photos', row.slika_path);
                fs.access(imgPath, fs.constants.F_OK, (err) => {
                    if (!err) {
                        fs.unlink(imgPath, err => {
                            if (err) {
                                console.warn("⚠️ Ne može da obriše fajl:", imgPath, err);
                            } else {
                                console.log("🗑️ Fajl obrisan:", imgPath);
                            }
                        });
                    } else {
                        console.warn("⚠️ Fajl ne postoji:", imgPath);
                    }
                });
            });

            // 3. Obriši sve redove iz baze
            db.query('DELETE FROM porudzbine WHERE broj_porudzbine = ?', [brojPorudzbine], (err2) => {
                if (err2) {
                    console.error("Greška pri brisanju iz baze:", err2);
                    return res.status(500).send("Greška prilikom brisanja.");
                }

                // Loguj akciju ako je admin ulogovan
                if (req.session.admin?.username) {
                    logAkcija(req.session.admin.username, `Obrisao porudžbinu #${brojPorudzbine}`);
                }

                res.sendStatus(200);
            });
        });
    });
        app.put('/api/admin/potvrdi/:broj', (req, res) => {
            const broj = req.params.broj;
            db.query('UPDATE porudzbine SET status = ? WHERE broj_porudzbine = ?', ['potvrđena', broj], (err) => {
                if (err) return res.status(500).json({ message: 'Greška u bazi' });

                // ✅ Ispravno pozivanje logAkcija bez db
                logAkcija(req.session.admin.username, `Potvrđena porudžbina #${broj}`);

                res.sendStatus(200);
            });
        });

        // Preuzimanje slika
        app.get('/api/admin/download/:broj_porudzbine', (req, res) => {
            const broj = req.params.broj_porudzbine;
            const sql = 'SELECT slika_path FROM porudzbine WHERE broj_porudzbine = ?';

            db.query(sql, [broj], (err, results) => {
                if (err || results.length === 0) return res.status(404).send('Nema slika');

                res.setHeader('Content-Type', 'application/zip');
                res.setHeader('Content-Disposition', `attachment; filename=porudzbina_${broj}.zip`);

                const archive = archiver('zip', { zlib: { level: 9 } });
                archive.pipe(res);

                results.forEach(row => {
                    const filePath = path.join(__dirname, 'uploads/photos', row.slika_path);
                    if (fs.existsSync(filePath)) {
                        archive.file(filePath, { name: row.slika_path });
                    }
                });

                archive.finalize();

                // ✅ Loguj tek kada je sve pokrenuto
                if (req.session.admin?.username) {
                    logAkcija(req.session.admin.username, `Preuzeo ZIP fajl za porudžbinu #${broj}`);
                }
            });
        });

    // ✅ PUT ruta za odbacivanje porudžbine
    app.put('/api/admin/odbij/:broj', (req, res) => {
        const broj = req.params.broj;
        db.query('UPDATE porudzbine SET status = ? WHERE broj_porudzbine = ?', ['odbijena', broj], (err) => {
            if (err) return res.status(500).json({ message: 'Greška u bazi prilikom odbijanja' });

            if (req.session.admin?.username) {
                logAkcija(req.session.admin.username, `Odbijena porudžbina #${broj}`);
            }

            res.sendStatus(200);
        });
    });

    // ✅ PDF prikaz porudžbine

    app.get('/api/admin/pdf/:broj', async (req, res) => {
        const broj = req.params.broj;
        const sql = 'SELECT * FROM porudzbine WHERE broj_porudzbine = ?';

        db.query(sql, [broj], async (err, rows) => {
            if (err || !rows.length) return res.status(404).send('Porudžbina nije pronađena');

            const p = rows[0];

            const PDFDocument = require('pdfkit');
            const fs = require('fs');
            const path = require('path');
            const QRCode = require('qrcode');

            const doc = new PDFDocument({ margin: 50 });
            const filePath = path.join(__dirname, `/pdf/porudzbina_${broj}.pdf`);
            doc.pipe(fs.createWriteStream(filePath));
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=porudzbina_${broj}.pdf`);
            doc.pipe(res);

            // Pozadina
            doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF');
            doc.fillColor('black');

            // Font
            doc.registerFont('DejaVu', path.join(__dirname, 'fonts', 'DejaVuSans.ttf'));
            doc.registerFont('DejaVuBold', path.join(__dirname, 'fonts', 'DejaVuSans-Bold.ttf'));
            doc.registerFont('DejaVuItalic', path.join(__dirname, 'fonts', 'DejaVuSans-Oblique.ttf'));
            doc.font('DejaVu');

            const logoPath = 'public//logo/logo2-crni.png'; // npr. './public/logo.png'
            const logoWidth = 120; // širina loga u pikselima
            const logoHeight = 40; // visina loga (možeš ostaviti prazno da se automatski izračuna)

// Prikaz loga u gornjem desnom uglu
            doc.image(logoPath, doc.page.width - logoWidth - 33, 5, { width: logoWidth }); // 50 je desna margina, 40 je gornja

            doc.moveDown(3); // Pomeranje ispod loga
            doc.fontSize(11).text(`Datum: ${new Date().toLocaleDateString('sr-RS')}`, { align: 'right' });
            doc.moveDown(0.5);
            doc.text(`Broj porudžbine: #${broj}`, { align: 'right' });
            doc.moveDown(1.5);

            // Podaci o kupcu
            doc.font('DejaVuBold').fontSize(12).text('Podaci o kupcu:');

            doc.moveDown(0.5);
            doc.font('DejaVu').fontSize(11);
            doc.text(`Ime: ${p.ime} ${p.prezime}`);
            doc.moveDown(0.3);
            doc.text(`Telefon: ${p.telefon}`);
            doc.moveDown(0.3);
            doc.text(`E-mail: ${p.email}`);
            doc.moveDown(0.3);
            // if (p.status) doc.text(`Status: ${p.status}`);
            // doc.moveDown(0.5);
            if (p.napomena) doc.text(`Adresa i napomena: ${p.napomena}`);
            doc.moveDown(3.5);
            doc.font('DejaVu');
            // Grupisanje po formatu
            const grouped = {};
            rows.forEach(r => {
                if (!grouped[r.format]) grouped[r.format] = 0;
                grouped[r.format] += r.kolicina;
            });

            // Priprema tabele
            const startX = 50;
            const startY = doc.y;
            const rowHeight = 25;

            const colWidths = [200, 100, 100, 100];
            const headers = ['Opis', 'Količina', 'Cena/kom', 'Ukupno'];
            let tableRows = [];
            let ukupnaCena = 0;

            for (const format in grouped) {
                const kolicina = grouped[format];
                const cenaKom = izracunajCenu(format, kolicina);
                const ukupno = kolicina * cenaKom;
                ukupnaCena += ukupno;

                tableRows.push([
                    `Fotografija ${format}`,
                    `${kolicina}`,
                    `${cenaKom} RSD`,
                    `${ukupno} RSD`,
                ]);
            }

            const rowCount = tableRows.length + 1;
            const colX = [
                startX,
                startX + colWidths[0],
                startX + colWidths[0] + colWidths[1],
                startX + colWidths[0] + colWidths[1] + colWidths[2],
                startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
            ];

            // Horizontalne linije
            for (let i = 0; i <= rowCount; i++) {
                const y = startY + i * rowHeight;
                doc.moveTo(startX, y).lineTo(colX[4], y).stroke();
            }

            // Vertikalne linije
            for (let i = 0; i < colX.length; i++) {
                doc.moveTo(colX[i], startY).lineTo(colX[i], startY + rowCount * rowHeight).stroke();
            }

            // Header
            // Postavljanje bold fonta za zaglavlje
            doc.font('DejaVuBold').fontSize(11);
            headers.forEach((h, i) => {
                doc.text(h, colX[i] + 5, startY + 7);
            });

// Vraćanje na običan font za redove tabele
            doc.font('DejaVu').fontSize(11);
            tableRows.forEach((row, rowIndex) => {
                const y = startY + (rowIndex + 1) * rowHeight + 7;

                row.forEach((cell, i) => {
                    doc.text(cell, colX[i] + 5, y, {
                        width: colWidths[i] - 10,
                        align: i === 0 ? 'left' : 'center' // prva kolona levo, ostale centrirane
                    });
                });
            });


            // Novi red za "Ukupno" — sa ivicama kao deo tabele
            const ukupnoY = startY + rowCount * rowHeight;

// Linije oko "Ukupno" reda
            doc.moveTo(startX, ukupnoY).lineTo(colX[4], ukupnoY).stroke(); // gornja linija
            doc.moveTo(startX, ukupnoY + rowHeight).lineTo(colX[4], ukupnoY + rowHeight).stroke(); // donja linija
            doc.moveTo(startX, ukupnoY).lineTo(startX, ukupnoY + rowHeight).stroke(); // leva
            doc.moveTo(colX[3], ukupnoY).lineTo(colX[3], ukupnoY + rowHeight).stroke(); // četvrta kolona
            doc.moveTo(colX[4], ukupnoY).lineTo(colX[4], ukupnoY + rowHeight).stroke(); // desna

// Tekst u "Ukupno" redu
            doc.font('DejaVuBold').fontSize(11).font('DejaVuBold').font('DejaVuBold').font('DejaVuBold').font('DejaVuBold'); // Bold za "Ukupno"
            doc.text('Ukupno:', startX + 5, ukupnoY + 7, {
                width: colX[3] - startX - 10,
                align: 'left'
            });
            doc.text(`${ukupnaCena} RSD`, colX[3] + 5, ukupnoY + 7, {
                width: colWidths[3] - 10,
                align: 'center'
            });

// Iznos
            doc.text(`${ukupnaCena} RSD`, colX[3] + 5, ukupnoY + 7, {
                width: colWidths[3] - 10,
                align: 'center'
            });

// Horizontalna linija ispod
            doc.moveTo(startX, ukupnoY + rowHeight).lineTo(colX[4], ukupnoY + rowHeight).stroke();

            // Potpis
            const yPotpis = ukupnoY + 100;
            doc.font('DejaVuItalic').fontSize(11).text('Potpis: ____________________', startX, yPotpis);

            // QR kod
            const url = `http://localhost:3000/pracenje/${broj}`;
            const qrDataUrl = await QRCode.toDataURL(url);
            const qrImg = qrDataUrl.replace(/^data:image\/png;base64,/, '');
            doc.font('DejaVuItalic').text('QR kod za praćenje porudžbine:', startX, yPotpis + 30);
            doc.image(Buffer.from(qrImg, 'base64'), startX, yPotpis + 50, { width: 100 });

            doc.end();

            if (req.session.admin?.username) {
                logAkcija(req.session.admin.username, `Pregled PDF-a porudžbine #${broj}`);
            }
        });
    });

    // Automatsko određivanje cene po količini
    function izracunajCenu(format, kolicina) {
        if (format === '10x15') {
            if (kolicina <= 50) return 55;
            if (kolicina <= 100) return 50;
            if (kolicina <= 200) return 45;
            return 40;
        }
        if (format === '13x18') {
            if (kolicina <= 50) return 67;
            if (kolicina <= 100) return 62;
            if (kolicina <= 200) return 57;
            return 50;
        }
        return 0; // default
    }
    // 📧 Nodemailer setup
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'lukanoob744@gmail.com',
            pass: 'glnqhynzpqzwxqdq '
        }
    });
    // ✅ Slanje email potvrde kad admin potvrdi porudžbinu
    app.post('/api/admin/potvrdi/:broj', async (req, res) => {
        const broj = req.params.broj;
        console.log('📥 PUT potvrda za broj:', broj);
        db.query('UPDATE porudzbine SET status = ? WHERE broj_porudzbine = ?', ['potvrđena', broj], (err) => {
            if (err) return res.status(500).json({ message: 'Greška u bazi' });

            db.query('SELECT * FROM porudzbine WHERE broj_porudzbine = ?', [broj], async (err2, rows) => {
                if (err2) {
                    console.error('❌ Greška u SELECT upitu:', err2);
                    return res.sendStatus(500);
                }

                if (!rows.length) {
                    console.warn(`⚠️ Nema porudžbina sa brojem ${broj}`);
                    return res.sendStatus(404);
                }

                console.log(`✅ Pronađeno ${rows.length} redova za #${broj}`);
                const p = rows[0];


                const PDFDocument = require('pdfkit');
                const QRCode = require('qrcode');
                const nodemailer = require('nodemailer');
                const pdfPath = path.join(__dirname, `pdf/porudzbina_${broj}.pdf`);

                const url = `http://localhost:3000/pracenje/${broj}`;
                const qrDataUrl = await QRCode.toDataURL(url); // OVO je sada validno
                const qrImg = qrDataUrl.replace(/^data:image\/png;base64,/, '');

                const doc = new PDFDocument({ margin: 50 });
                const writeStream = fs.createWriteStream(pdfPath);
                doc.pipe(writeStream);

                doc.registerFont('DejaVu', path.join(__dirname, 'fonts/DejaVuSans.ttf'));
                doc.registerFont('DejaVuBold', path.join(__dirname, 'fonts/DejaVuSans-Bold.ttf'));
                doc.registerFont('DejaVuItalic', path.join(__dirname, 'fonts/DejaVuSans-Oblique.ttf'));
                doc.font('DejaVu');

                doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF');
                doc.fillColor('black');

                const logoPath = path.join(__dirname, 'public/logo/logo2-crni.png');
                const logoWidth = 120;
                doc.image(logoPath, doc.page.width - logoWidth - 33, 5, { width: logoWidth });

                doc.moveDown(3);
                doc.fontSize(11).text(`Datum: ${new Date().toLocaleDateString('sr-RS')}`, { align: 'right' });
                doc.moveDown(0.5);
                doc.text(`Broj porudžbine: #${broj}`, { align: 'right' });
                doc.moveDown(1.5);

                doc.font('DejaVuBold').fontSize(12).text('Podaci o kupcu:');
                doc.moveDown(0.5);
                doc.font('DejaVu').fontSize(11);
                doc.text(`Ime: ${p.ime} ${p.prezime}`);
                doc.text(`Telefon: ${p.telefon}`);
                doc.text(`E-mail: ${p.email}`);
                if (p.napomena) doc.text(`Adresa i napomena: ${p.napomena}`);
                doc.moveDown(3.5);

                // ✅ Podaci o kupcu (uzimamo iz prvog reda)


// ✅ Grupisanje po formatu
                const grouped = {};
                rows.forEach(r => {
                    if (!r.format || !r.kolicina) return;
                    if (!grouped[r.format]) grouped[r.format] = 0;
                    grouped[r.format] += r.kolicina;
                });

                const izracunajCenu = (format, kolicina) => {
                    if (format === '10x15') {
                        if (kolicina <= 50) return 55;
                        if (kolicina <= 100) return 50;
                        if (kolicina <= 200) return 45;
                        return 40;
                    }
                    if (format === '13x18') {
                        if (kolicina <= 50) return 67;
                        if (kolicina <= 100) return 62;
                        if (kolicina <= 200) return 57;
                        return 50;
                    }
                    return 0;
                };

                const startX = 50;
                const startY = doc.y;
                const rowHeight = 25;
                const colWidths = [200, 100, 100, 100];
                const colX = [
                    startX,
                    startX + colWidths[0],
                    startX + colWidths[0] + colWidths[1],
                    startX + colWidths[0] + colWidths[1] + colWidths[2],
                    startX + colWidths.reduce((a, b) => a + b, 0)
                ];

                const headers = ['Opis', 'Količina', 'Cena/kom', 'Ukupno'];
                let tableRows = [];
                let ukupnaCena = 0;

                for (const format in grouped) {
                    const kolicina = grouped[format];
                    const cenaKom = izracunajCenu(format, kolicina);
                    const ukupno = kolicina * cenaKom;
                    ukupnaCena += ukupno;

                    tableRows.push([
                        `Fotografija ${format}`,
                        `${kolicina}`,
                        `${cenaKom} RSD`,
                        `${ukupno} RSD`,
                    ]);
                }

                const rowCount = tableRows.length + 1;
                for (let i = 0; i <= rowCount; i++) {
                    const y = startY + i * rowHeight;
                    doc.moveTo(startX, y).lineTo(colX[4], y).stroke();
                }
                for (let i = 0; i < colX.length; i++) {
                    doc.moveTo(colX[i], startY).lineTo(colX[i], startY + rowCount * rowHeight).stroke();
                }

                doc.font('DejaVuBold').fontSize(11);
                headers.forEach((h, i) => {
                    doc.text(h, colX[i] + 5, startY + 7);
                });

                doc.font('DejaVu').fontSize(11);
                tableRows.forEach((row, rowIndex) => {
                    const y = startY + (rowIndex + 1) * rowHeight + 7;
                    row.forEach((cell, i) => {
                        doc.text(cell, colX[i] + 5, y, {
                            width: colWidths[i] - 10,
                            align: i === 0 ? 'left' : 'center'
                        });
                    });
                });

                const ukupnoY = startY + rowCount * rowHeight;
                doc.moveTo(startX, ukupnoY).lineTo(colX[4], ukupnoY).stroke();
                doc.moveTo(startX, ukupnoY + rowHeight).lineTo(colX[4], ukupnoY + rowHeight).stroke();
                doc.moveTo(startX, ukupnoY).lineTo(startX, ukupnoY + rowHeight).stroke();
                doc.moveTo(colX[3], ukupnoY).lineTo(colX[3], ukupnoY + rowHeight).stroke();
                doc.moveTo(colX[4], ukupnoY).lineTo(colX[4], ukupnoY + rowHeight).stroke();

                doc.font('DejaVuBold').text('Ukupno:', startX + 5, ukupnoY + 7, {
                    width: colX[3] - startX - 10,
                    align: 'left'
                });
                doc.text(`${ukupnaCena} RSD`, colX[3] + 5, ukupnoY + 7, {
                    width: colWidths[3] - 10,
                    align: 'center'
                });

                const yPotpis = ukupnoY + 100;
                doc.font('DejaVuItalic').fontSize(11).text('Potpis: ____________________', startX, yPotpis);


                doc.font('DejaVuItalic').text('QR kod za praćenje porudžbine:', startX, yPotpis + 30);
                doc.image(Buffer.from(qrImg, 'base64'), startX, yPotpis + 50, { width: 100 });
                console.log('📄 Zatvaram PDF...');
                doc.end();

                writeStream.on('finish', () => {
                    console.log(`✅ PDF za porudžbinu #${broj} generisan.`);

                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: 'lukanoob744@gmail.com',
                            pass: 'glnqhynzpqzwxqdq'
                        }
                    });

                    const mailOptions = {
                        from: 'Foto Bogićević <fotobogicevic@outlook.com>',
                        to: p.email,
                        subject: `Vaša porudžbina #${broj} je potvrđena`,
                        html: `
            <h2>Poštovani ${p.ime} ${p.prezime},</h2>
            <p>Vaša porudžbina broj <strong>#${broj}</strong> je uspešno potvrđena.</p>
            <p>U prilogu se nalazi vaš račun. Uskoro ćemo vas kontaktirati kada slike budu spremne za preuzimanje.</p>
            <br>
            <p>Srdačno,<br>Foto Studio Bogićević</p>
          `,
                        attachments: [{
                            filename: `porudzbina_${broj}.pdf`,
                            path: pdfPath
                        }]
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error('❌ Greška pri slanju emaila:', error);
                        } else {
                            console.log('✅ Email sa PDF-om poslat:', info.response);
                        }
                    });

                    res.sendStatus(200);
                });
            });
        });
    });
    //SLANJE ADMINU NA MAIL


    // app.put('/api/admin/potvrdi/:broj', (req, res) => {
    //     const broj = req.params.broj;
    //     db.query('UPDATE porudzbine SET status = ? WHERE broj_porudzbine = ?', ['potvrđena', broj], (err) => {
    //         if (err) return res.status(500).json({ message: 'Greška u bazi' });
    //
    //         // Dohvati podatke za mejl
    //         db.query('SELECT DISTINCT ime, prezime, email FROM porudzbine WHERE broj_porudzbine = ?', [broj], (err2, result) => {
    //             if (err2 || !result.length) return res.sendStatus(200);
    //
    //             const korisnik = result[0];
    //             const mailOptions = {
    //                 from: 'Foto Studio Bogićević <fotobogicevic@outlook.com>',
    //                 to: korisnik.email,
    //                 subject: `Vaša porudžbina #${broj} je potvrđena`,
    //                 html: `
    //           <h2>Poštovani ${korisnik.ime} ${korisnik.prezime},</h2>
    //           <p>Vaša porudžbina broj <strong>#${broj}</strong> je uspešno potvrđena.</p>
    //           <p>Uskoro ćemo vas kontaktirati kada slike budu spremne za preuzimanje.</p>
    //           <br>
    //           <p>Srdačno,<br>Foto Studio Bogićević</p>
    //         `
    //             };
    //
    //             transporter.sendMail(mailOptions, (error, info) => {
    //                 if (error) console.error('Greška pri slanju emaila:', error);
    //                 else console.log('📧 Email poslat:', info.response);
    //             });
    //
    //             res.sendStatus(200);
    //         });
    //     });
    // });
    app.post('/api/admin/uplate/:id/status', (req, res) => {
        const { status } = req.body;
        const { id } = req.params;

        if (!['odobreno', 'odbijeno'].includes(status)) {
            return res.status(400).send('Nevalidan status.');
        }

        db.query('UPDATE uplate SET status = ? WHERE id = ?', [status, id], (err) => {
            if (err) return res.status(500).send('Greška u bazi.');

            if (status !== 'odobreno') return res.sendStatus(200); // ne šalji PDF ako nije odobreno

            // PDF i email logika
            const sql = `
            SELECT o.*, u.slika
            FROM orders o
            LEFT JOIN uplate u ON o.order_number = u.broj_porudzbine
            WHERE u.id = ?
        `;

            db.query(sql, [id], async (err2, rows) => {
                if (err2 || !rows.length) return res.sendStatus(500);

                const p = rows[0];
                const images = JSON.parse(p.images || '[]');
                const broj = p.order_number;
                const brojSlika = images.length;
                const cenaPoKom = 200;
                const ukupno = brojSlika * cenaPoKom;

                const pdfPath = path.join(__dirname, `pdf/porudzbinagalerija_${broj}.pdf`);
                const doc = new PDFDocument({ margin: 50 });
                const writeStream = fs.createWriteStream(pdfPath);
                doc.pipe(writeStream);

                doc.registerFont('DejaVu', path.join(__dirname, 'fonts/DejaVuSans.ttf'));
                doc.registerFont('DejaVuBold', path.join(__dirname, 'fonts/DejaVuSans-Bold.ttf'));
                doc.registerFont('DejaVuItalic', path.join(__dirname, 'fonts/DejaVuSans-Oblique.ttf'));
                doc.font('DejaVu');

                doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF');
                doc.fillColor('black');
                doc.image(path.join(__dirname, 'public/logo/logo2-crni.png'), doc.page.width - 150, 5, { width: 120 });

                doc.moveDown(3);
                doc.fontSize(11).text(`Datum: ${new Date().toLocaleDateString('sr-RS')}`, { align: 'right' });
                doc.moveDown(0.5);
                doc.text(`Broj porudžbine: G${broj}`, { align: 'right' });

                doc.moveDown(1.5);
                doc.font('DejaVuBold').fontSize(12).text('Podaci o kupcu:');
                doc.font('DejaVu').fontSize(11);
                doc.text(`Ime i prezime: ${p.imeiprezime}`);
                doc.text(`Telefon: ${p.brojtelefona}`);
                doc.text(`Email: ${p.email}`);
                doc.moveDown(3.5);

                const startX = 50;
                const startY = doc.y;
                const rowHeight = 25;
                const colWidths = [200, 100, 100, 100];
                const colX = colWidths.reduce((acc, w, i) => {
                    acc.push((acc[i - 1] || startX) + (i === 0 ? 0 : colWidths[i - 1]));
                    return acc;
                }, []);
                colX.push(startX + colWidths.reduce((a, b) => a + b, 0));

                for (let i = 0; i <= 2; i++) {
                    const y = startY + i * rowHeight;
                    doc.moveTo(startX, y).lineTo(colX[4], y).stroke();
                }
                for (let i = 0; i < colX.length; i++) {
                    doc.moveTo(colX[i], startY).lineTo(colX[i], startY + 2 * rowHeight).stroke();
                }

                const headers = ['Opis', 'Količina', 'Cena/kom', 'Ukupno'];
                doc.font('DejaVuBold').fontSize(11);
                headers.forEach((h, i) => {
                    doc.text(h, colX[i] + 5, startY + 7);
                });

                doc.font('DejaVu').fontSize(11);
                const yRed = startY + rowHeight + 7;
                const red = ['Fotografija (GALERIJA)', brojSlika, `${cenaPoKom} RSD`, `${ukupno} RSD`];
                red.forEach((cell, i) => {
                    doc.text(cell.toString(), colX[i] + 5, yRed, {
                        width: colWidths[i] - 10,
                        align: i === 0 ? 'left' : 'center'
                    });
                });

                const ukupnoY = startY + 2 * rowHeight;
                doc.moveTo(startX, ukupnoY).lineTo(colX[4], ukupnoY).stroke();
                doc.moveTo(startX, ukupnoY + rowHeight).lineTo(colX[4], ukupnoY + rowHeight).stroke();
                doc.moveTo(startX, ukupnoY).lineTo(startX, ukupnoY + rowHeight).stroke();
                doc.moveTo(colX[3], ukupnoY).lineTo(colX[3], ukupnoY + rowHeight).stroke();
                doc.moveTo(colX[4], ukupnoY).lineTo(colX[4], ukupnoY + rowHeight).stroke();

                doc.font('DejaVuBold').text('Ukupno:', colX[0] + 5, ukupnoY + 7);
                doc.text(`${ukupno} RSD`, colX[3] + 5, ukupnoY + 7, {
                    width: colWidths[3] - 10,
                    align: 'center'
                });

                const yPotpis = ukupnoY + rowHeight + 50;
                doc.font('DejaVuItalic').fontSize(11).text('Potpis: ____________________', startX, yPotpis);

                doc.end();
                console.log('>>> PDF dokument završen.');

                writeStream.on('finish', () => {
                    console.log('>>> PDF završen, slanje mejla na:', p.email);
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: 'lukanoob744@gmail.com',
                            pass: 'glnqhynzpqzwxqdq'
                        }
                    });

                    const mailOptions = {
                        from: 'Foto Studio Bogićević <fotobogicevic@outlook.com>',
                        to: p.email,
                        subject: `Vaša porudžbina G${broj} je potvrđena`,
                        html: `
                        <h2>Poštovani ${p.imeiprezime},</h2>
                        <p>Vaša porudžbina iz galerije broj <strong>G${broj}</strong> je uspešno potvrđena.</p>
                        <p>Račun sa detaljima je u prilogu ovog mejla.</p>
                        <p>Uskoro ćete biti obavešteni kada slike budu spremne za preuzimanje.</p>
                        <br>
                        <p>Srdačno,<br>Foto Bogićević</p>
                    `,
                        attachments: [{
                            filename: `porudzbinagalerija_${broj}.pdf`,
                            path: pdfPath
                        }]
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error('❌ Greška pri slanju emaila:', error);
                        } else {
                            console.log('✅ Email sa PDF-om poslat:', info.response);
                        }
                    });
                });

                res.sendStatus(200);
            });
        });
    });

    app.get('/api/admin/uplate/:id/status', (req, res) => {
        const id = req.params.id;

        db.query('SELECT status FROM uplate WHERE id = ?', [id], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Greška na serveru' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'Uplata nije pronađena' });
            }
            res.json({ status: results[0].status });
        });
    });
    app.put('/api/admin/faza/:broj', (req, res) => {
        const broj = req.params.broj;
        const { faza } = req.body;

        if (!faza || !broj) {
            return res.status(400).json({ message: "Nedostaje faza ili broj porudžbine" });
        }

        const sql = `UPDATE porudzbine SET status_izrade = ? WHERE broj_porudzbine = ?`;

        db.query(sql, [faza, broj], (err, result) => {
            if (err) {
                console.error("Greška pri ažuriranju faze:", err);
                return res.status(500).json({ message: "Greška pri ažuriranju faze" });
            }

            res.status(200).json({ message: "Faza ažurirana" });
        });
    });
    app.put('/api/admin/finalizuj/:broj', (req, res) => {
        const broj = req.params.broj;

        const sql = `UPDATE porudzbine SET status_izrade = 'finalizovano' WHERE broj_porudzbine = ?`;

        db.query(sql, [broj], (err, result) => {
            if (err) {
                console.error("❌ Greška pri finalizaciji porudžbine:", err);
                return res.status(500).json({ message: "Greška pri finalizaciji" });
            }

            res.status(200).json({ message: "Porudžbina finalizovana" });
        });
    });

    // ✅ Dodaj bcrypt za šifrovanje
    const bcrypt = require('bcrypt');
    bcrypt.hash('admin123', 10).then(hash => console.log(hash));
    // ✅ Registrovanje admina (možeš koristiti samo jednom da ubaciš početne naloge)
    app.post('/api/admin/registruj', async (req, res) => {
        const { username, password, ime } = req.body;
        const hash = await bcrypt.hash(password, 10);
        db.query('INSERT INTO admini (username, password_hash, ime) VALUES (?, ?, ?)', [username, hash, ime], (err) => {
            if (err) return res.status(500).json({ message: 'Greška prilikom registracije' });
            res.sendStatus(200);
        });
    });

    // ✅ Prijava admina
    app.post('/login', (req, res) => {
        const { username, password } = req.body;
        db.query('SELECT * FROM admini WHERE username = ?', [username], async (err, results) => {
            if (err || results.length === 0) return res.redirect('/login');
            const admin = results[0];

            const match = await bcrypt.compare(password, admin.password_hash);
            if (!match) return res.redirect('/login');

            req.session.authenticated = true;
            req.session.admin = { id: admin.id, username: admin.username };
            logAkcija(admin.username, 'Prijava na admin panel');
            res.redirect('/adminizbor.html');

        });
    });

    // ✅ Middleware za proveru admin sesije
    function checkAdmin(req, res, next) {
        if (!req.session.admin) return res.redirect('/login');
        next();
    }

    // ✅ Prilog logovanja akcija, npr. potvrda porudžbine
    app.put('/api/admin/potvrdi/:broj', checkAdmin, (req, res) => {
        const broj = req.params.broj;
        db.query('UPDATE porudzbine SET status = ? WHERE broj_porudzbine = ?', ['potvrđena', broj], (err) => {
            if (err) return res.status(500).json({ message: 'Greška u bazi' });
            logAkcija(req.session.admin.username, `Potvrđena porudžbina #${broj}`);
            res.sendStatus(200);
        });
    });
    //AUDIT LOG
        app.get('/api/admin/audit-log', checkAdmin, (req, res) => {
            db.query('SELECT * FROM audit_log ORDER BY vreme DESC LIMIT 100', (err, results) => {
                if (err) return res.status(500).send('Greška u logovima');
                res.json(results);
            });
    });
    app.post('/api/admini', async (req, res) => {
        const { username, ime, password } = req.body;
        if (!req.session.admin || req.session.admin.username !== 'lukicheli') {
            return res.status(403).send('Zabranjeno');
        }

        const hash = await bcrypt.hash(password, 10);
        db.query('INSERT INTO admini (username, ime, password_hash) VALUES (?, ?, ?)', [username, ime, hash], (err) => {
            if (err) return res.status(500).send('Greška pri upisu');

            // ✅ Loguj ko je dodao koga
            logAkcija(req.session.admin.username, `Dodat novi admin: ${username}`);
            res.sendStatus(201);
        });
    });

    //DODAVANJE ADMINA

    //BRISANJE ADMINA
    app.delete('/api/admini/:id', (req, res) => {
        if (!req.session.admin || req.session.admin.username !== 'lukicheli') {
            return res.status(403).send('Zabranjeno');
        }

        const id = req.params.id;

        // Prvo dohvati username admina koji brišeš
        db.query('SELECT username FROM admini WHERE id = ?', [id], (err, results) => {
            if (err) return res.status(500).send('Greška pri pristupu bazi');
            if (results.length === 0) return res.status(404).send('Admin nije pronađen');

            const deletedUsername = results[0].username;

            // Sada obriši admina
            db.query('DELETE FROM admini WHERE id = ?', [id], (err2) => {
                if (err2) return res.status(500).send('Greška pri brisanju');

                logAkcija(req.session.admin.username, `Obrisan admin: ${deletedUsername}`);
                res.sendStatus(200);
            });
        });
    });

    //SAMO ADMIN LUKICHELI MOZE PRISTUPITI OVOJ STRANICI
    function checkSuperadmin(req, res, next) {
        if (req.session.authenticated && req.session.admin?.username === "lukicheli") {
            return next();
        }
        return res.status(403).send("⛔ Pristup dozvoljen samo superadminu.");
    }

    function checkAdmin(req, res, next) {
        if (req.session?.authenticated && req.session?.admin) {
            return next();
        }
        return res.status(403).send("⛔ Pristup dozvoljen samo administratorima.");
    }
    app.get("/api/korisnik", (req, res) => {
        if (req.session && req.session.admin) {
            return res.json({
                username: req.session.admin.username,
                email: req.session.admin.email || null
            });
        } else {
            return res.status(401).json({ message: "Niste ulogovani" });
        }
    });
    app.get('/admin', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'adminizbor.html'));
    });
    app.get("/admin_admini", checkAdmin, checkSuperadmin, (req, res) => {
        res.sendFile(path.join(__dirname, "public", "admin_admini.html"));
    });
    app.get('/api/admini', checkAdmin, (req, res) => {
        if (req.session.admin.username !== 'lukicheli') {
            return res.status(403).send('Zabranjeno');
        }

        db.query('SELECT id, username, ime FROM admini ORDER BY id ASC', (err, results) => {
            if (err) return res.status(500).send('Greška pri učitavanju admina');
            res.json(results);
        });
    });
    app.get('/api/admin/info', (req, res) => {
        if (!req.session.admin) return res.status(401).json({ error: 'Niste prijavljeni' });
        res.json(req.session.admin); // { username, ime }
    });

    app.post('/api/admin/login', (req, res) => {
        const { username, password } = req.body;

        const sql = 'SELECT * FROM admini WHERE username = ?';
        db.query(sql, [username], async (err, results) => {
            if (err || results.length === 0) {
                return res.status(401).json({ message: 'Pogrešno korisničko ime' });
            }

            const admin = results[0];
            const match = await bcrypt.compare(password, admin.password_hash);

            if (!match) {
                return res.status(401).json({ message: 'Pogrešna lozinka' });
            }

            // Snimi sesiju
            req.session.authenticated = true;
            req.session.admin = {
                id: admin.id,
                username: admin.username,
            };

            res.json({ message: 'Uspesna prijava' });
        });
    });
    // 📂 server.js (proširenje za admin statistiku i autentifikaciju)

    // Dodajemo sesiju za autentifikaciju
    app.use(session({
        secret: 'tajna123',
        resave: false,
        saveUninitialized: false
    }));

    // Login ruta
    app.post('/api/admin/login', (req, res) => {
        const { username, password } = req.body;
        if (username === adminUsername && password === adminPassword) {
            req.session.admin = true;
            res.status(200).json({ message: 'Ulogovani ste kao admin.' });
        } else {
            res.status(401).json({ message: 'Neispravni podaci.' });
        }
    });

    // Middleware za proveru admina
    function authAdmin(req, res, next) {
        if (req.session.admin) {
            next();
        } else {
            res.status(403).json({ message: 'Pristup odbijen.' });
        }
    }
    app.get('/pracenje/:broj', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'pracenje.html'));
    });

    app.get('/api/pracenje/:broj', (req, res) => {
        const broj = req.params.broj;

        db.query(
            'SELECT broj_porudzbine, status, status_izrade FROM porudzbine WHERE broj_porudzbine = ?',
            [broj],
            (err, results) => {
                if (err) {
                    console.error('Greška u bazi:', err);
                    return res.sendStatus(500);
                }

                if (!results.length) {
                    return res.sendStatus(404); // nema porudžbine
                }

                res.json(results[0]); // vrati jedan rezultat kao JSON
            }
        );
    });

    module.exports = router;
    //GALERIJA PDF
        app.get('/api/admin/racun-pdf/:broj', (req, res) => {
            const broj = req.params.broj;

            const sql = 'SELECT * FROM orders WHERE order_number = ?';

            db.query(sql, [broj], (err, rows) => {
                if (err || !rows.length) return res.status(404).send('Porudžbina nije pronađena');

                const p = rows[0];
                const images = JSON.parse(p.images || '[]');
                const brojSlika = images.length;
                const cenaPoKom = 200;
                const ukupno = brojSlika * cenaPoKom;

                const PDFDocument = require('pdfkit');
                const fs = require('fs');
                const path = require('path');

                const doc = new PDFDocument({ margin: 50 });
                const filePath = path.join(__dirname, `pdf/porudzbina_${broj}.pdf`);
                doc.pipe(fs.createWriteStream(filePath));

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename=porudzbinagalerija_${broj}.pdf`);
                doc.pipe(res);

                // Pozadina
                doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF');
                doc.fillColor('black');

                // Fontovi
                doc.registerFont('DejaVu', path.join(__dirname, 'fonts/DejaVuSans.ttf'));
                doc.registerFont('DejaVuBold', path.join(__dirname, 'fonts/DejaVuSans-Bold.ttf'));
                doc.registerFont('DejaVuItalic', path.join(__dirname, 'fonts/DejaVuSans-Oblique.ttf'));
                doc.font('DejaVu');

                // Logo
                const logoPath = path.join(__dirname, 'public/logo/logo2-crni.png');
                const logoWidth = 120;
                doc.image(logoPath, doc.page.width - logoWidth - 33, 5, { width: logoWidth });

                // Desna strana: datum i broj
                doc.moveDown(3);
                doc.fontSize(11).text(`Datum: ${new Date().toLocaleDateString('sr-RS')}`, { align: 'right' });
                doc.moveDown(0.5);
                doc.text(`Broj porudžbine: G${broj}`, { align: 'right' });

                // Podaci o kupcu
                doc.moveDown(1.5);
                doc.font('DejaVuBold').fontSize(12).text('Podaci o kupcu:');
                doc.moveDown(0.5);
                doc.font('DejaVu').fontSize(11);
                doc.text(`Ime i prezime: ${p.imeiprezime}`);
                doc.moveDown(0.3);
                doc.text(`Telefon: ${p.brojtelefona}`);
                doc.moveDown(0.3);
                doc.text(`Email: ${p.email}`);
                doc.moveDown(3.5);

                // Tabela
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

                for (let i = 0; i <= 2; i++) {
                    const y = startY + i * rowHeight;
                    doc.moveTo(startX, y).lineTo(colX[4], y).stroke();
                }
                for (let i = 0; i < colX.length; i++) {
                    doc.moveTo(colX[i], startY).lineTo(colX[i], startY + 2 * rowHeight).stroke();
                }

                doc.font('DejaVuBold').fontSize(11);
                headers.forEach((h, i) => {
                    doc.text(h, colX[i] + 5, startY + 7);
                });

                doc.font('DejaVu').fontSize(11);
                const yRed = startY + rowHeight + 7;
                const red = ['Fotografija (GALERIJA)', brojSlika, `${cenaPoKom} RSD`, `${ukupno} RSD`];
                red.forEach((cell, i) => {
                    doc.text(cell.toString(), colX[i] + 5, yRed, {
                        width: colWidths[i] - 10,
                        align: i === 0 ? 'left' : 'center'
                    });
                });

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
            });
    });

    const uplataStorage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => {
            const uniqueName = `uplata_${Date.now()}${path.extname(file.originalname)}`;
            cb(null, uniqueName);
        }
    });
    const uploadUplata = multer({ storage: uplataStorage });
    app.post('/upload-proof', uploadUplata.single('proof'), (req, res) => {
        const orderNumber = req.body.orderNumber;

        if (!req.file) {
            return res.status(400).json({ message: 'Nije poslata slika.' });
        }

        const filename = req.file.filename;

        db.query(
            'INSERT INTO uplate (broj_porudzbine, slika) VALUES (?, ?)',
            [orderNumber, filename],
            (err) => {
                if (err) {
                    console.error('Greška u bazi:', err);
                    return res.status(500).send('Greška u bazi.');
                }
                res.sendStatus(200);
            }
        );
    });
    app.get('/api/admin/uplate', (req, res) => {
        const sql = `
            SELECT
                u.id,
                u.broj_porudzbine,
                u.slika,
                u.status,
                u.datum,
                o.images,
                o.imeiprezime,
                o.brojtelefona,
                o.email,
                o.order_date
            FROM uplate u
                     LEFT JOIN orders o ON o.order_number = u.broj_porudzbine
            ORDER BY u.datum DESC
        `;

        db.query(sql, (err, results) => {
            if (err) return res.status(500).send('Greška u bazi.');

            const withCena = results.map(row => {
                let cena = 0;
                let brojSlika = 0;
                try {
                    const imgs = JSON.parse(row.images || '[]');
                    brojSlika = imgs.length;
                    cena = brojSlika * 200;
                } catch (e) {
                    console.warn('Greška u parsiranju slika:', e);
                }

                return {
                    ...row,
                    ukupna_cena: cena,
                    broj_slika: brojSlika,
                    order_date: row.order_date
                        ? new Date(row.order_date).toLocaleString()
                        : '-',
                };
            });

            res.json(withCena);
        });
    });

    app.post('/api/admin/uplate/:id/status', (req, res) => {
        const { status } = req.body;
        const { id } = req.params;

        if (!['odobreno', 'odbijeno'].includes(status)) {
            return res.status(400).send('Nevalidan status.');
        }

        db.query('UPDATE uplate SET status = ? WHERE id = ?', [status, id], (err) => {
            if (err) return res.status(500).send('Greška u bazi.');
            res.sendStatus(200);
        });
    });


    const fs = require('fs');
    const path = require('path');

    app.delete('/api/admin/uplate/:id', (req, res) => {
        const id = req.params.id;

        // 1. Pronađi sliku povezanu sa uplatom
        db.query('SELECT slika FROM uplate WHERE id = ?', [id], (err, rows) => {
            if (err) {
                console.error("Greška pri čitanju iz baze:", err);
                return res.status(500).send('Greška u bazi.');
            }

            if (!rows.length) {
                return res.status(404).send('Uplata nije pronađena.');
            }

            const slika = rows[0].slika;
            const imgPath = path.join(__dirname, 'uploads', slika);

            // 2. Obriši zapis iz baze
            db.query('DELETE FROM uplate WHERE id = ?', [id], (err) => {
                if (err) {
                    console.error("Greška pri brisanju iz baze:", err);
                    return res.status(500).send('Greška u bazi.');
                }

                // 3. Obriši fajl (ako postoji)
                fs.access(imgPath, fs.constants.F_OK, (err) => {
                    if (!err) {
                        fs.unlink(imgPath, (err) => {
                            if (err) {
                                console.warn("Fajl nije mogao da se obriše:", err);
                            } else {
                                console.log("Fajl uspešno obrisan:", imgPath);
                            }
                        });
                    } else {
                        console.warn("Fajl ne postoji:", imgPath);
                    }
                });

                res.sendStatus(200);
            });
        });
    });

    // Multer za edit upload
    const editUpload = multer({ dest: 'uploads/temp/' });

    // ✏️ RUTA za izmenu slike (kategorija i/ili nova slika)
    app.post('/images/edit/*', editUpload.single('newImage'), checkAdmin, (req, res) => {
        const filename = decodeURIComponent(req.params[0]);
        const { category } = req.body;
        const newFile = req.file;

        const allCategories = JSON.parse(fs.readFileSync(categoriesFile));
        if (!allCategories.includes(category)) {
            return res.status(400).send('Kategorija ne postoji.');
        }

        const [oldCategory] = filename.split('/');
        const imageName = path.basename(filename);
        const oldFullPath = path.join(imagesFolder, oldCategory, imageName);
        const newCategoryPath = path.join(imagesFolder, category);
        const newFullPath = path.join(newCategoryPath, imageName);

        try {
            if (!fs.existsSync(newCategoryPath)) {
                fs.mkdirSync(newCategoryPath);
            }

            // Ako je promenjena kategorija, premesti fajl
            if (oldCategory !== category) {
                fs.renameSync(oldFullPath, newFullPath);
            }

            // Ako postoji novi fajl, zameni sadržaj
            if (newFile) {
                fs.writeFileSync(newFullPath, fs.readFileSync(newFile.path));
                fs.unlinkSync(newFile.path);
            }

            return res.sendStatus(200);
        } catch (err) {
            console.error('Greška pri izmeni slike:', err);
            return res.status(500).send('Greška pri izmeni slike');
        }
    });

    // 🗑️ RUTA za brisanje slike (samo iz foldera)
    app.delete('/images/delete/*', checkAdmin, (req, res) => {
        const filename = decodeURIComponent(req.params[0]);
        const filePath = path.join(imagesFolder, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).send('Fajl ne postoji');
        }

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Greška pri brisanju slike:', err);
                return res.status(500).send('Brisanje nije uspelo');
            }

            return res.sendStatus(200);
        });
    });
    // 🔥 Brisanje porudžbine iz tabele 'orders' po 'order_number'
    app.delete("/api/admin/orders/:orderNumber", (req, res) => {
        const orderNumber = req.params.orderNumber;

        db.query("DELETE FROM orders WHERE order_number = ?", [orderNumber], (err, result) => {
            if (err) {
                console.error("Greška prilikom brisanja porudžbine:", err);
                return res.status(500).send("Greška na serveru.");
            }

            if (result.affectedRows === 0) {
                return res.status(404).send("Porudžbina nije pronađena.");
            }

            res.sendStatus(200); // uspešno
        });
    });

