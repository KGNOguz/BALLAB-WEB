const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
// ÖNEMLİ: Render'ın atadığı portu kullan, yoksa 3000'i varsay
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// --- SETUP DIRS ---
if (!fs.existsSync(UPLOADS_DIR)){
    fs.mkdirSync(UPLOADS_DIR);
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ articles: [], categories: [], announcement: {}, files: [] }));
}

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// --- STORAGE CONFIG (MULTER) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR)
    },
    filename: function (req, file, cb) {
        // Benzersiz dosya ismi oluştur
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Dosya uzantısını ve adını güvenli hale getir
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '');
        cb(null, name + '-' + uniqueSuffix + ext)
    }
})
const upload = multer({ storage: storage });

// --- API ENDPOINTS (Statik dosyalardan ÖNCE tanımlanmalı) ---

// 1. GET DATA
app.get('/api/data', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error("Data okuma hatası:", err);
            return res.status(500).json({ error: 'Veri okunamadı' });
        }
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            console.error("JSON Parse hatası:", e);
            res.json({ articles: [], categories: [], announcement: {}, files: [] });
        }
    });
});

// 2. SAVE DATA
app.post('/api/data', (req, res) => {
    const newData = req.body;
    fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2), (err) => {
        if (err) {
            console.error("Data yazma hatası:", err);
            return res.status(500).json({ error: 'Veri kaydedilemedi' });
        }
        res.json({ success: true, message: 'Veriler güncellendi' });
    });
});

// 3. UPLOAD FILE
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Dosya yüklenemedi' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
        success: true, 
        url: fileUrl, 
        filename: req.file.filename 
    });
});

// --- STATIC FILES (API'den SONRA tanımlanmalı) ---
app.use('/uploads', express.static(UPLOADS_DIR)); 
app.use(express.static(__dirname));

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server başlatıldı. Port: ${PORT}`);
});