const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
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
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for safety
app.use(express.static(__dirname)); // Serve frontend files
app.use('/uploads', express.static(UPLOADS_DIR)); // Serve uploaded images

// --- STORAGE CONFIG (MULTER) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR)
    },
    filename: function (req, file, cb) {
        // Create unique filename: timestamp-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext)
    }
})
const upload = multer({ storage: storage });

// --- API ENDPOINTS ---

// 1. GET DATA
app.get('/api/data', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Veri okunamadı' });
        }
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.json({ articles: [], categories: [], announcement: {}, files: [] });
        }
    });
});

// 2. SAVE DATA
app.post('/api/data', (req, res) => {
    const newData = req.body;
    fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2), (err) => {
        if (err) {
            console.error(err);
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
    // Return the URL that the frontend can use
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
        success: true, 
        url: fileUrl, 
        filename: req.file.filename 
    });
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server çalışıyor: http://localhost:${PORT}`);
    console.log(`Admin paneli: http://localhost:${PORT}/admin.html`);
});