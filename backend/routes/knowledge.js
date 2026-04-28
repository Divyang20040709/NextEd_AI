const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Knowledge = require('../model/Knowledge');

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Knowledge Management
router.get('/', async (req, res) => {
    try {
        const items = await Knowledge.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', upload.array('files'), async (req, res) => {
    const { title, details } = req.body;
    let combinedContent = "";

    try {
        if (req.files) {
            for (const file of req.files) {
                if (file.mimetype === 'application/pdf') {
                    const dataBuffer = fs.readFileSync(file.path);
                    const data = await pdfParse(dataBuffer);
                    combinedContent += `\n--- Content from ${file.originalname} ---\n${data.text}\n`;
                } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    // DOCX handling
                    const result = await mammoth.extractRawText({ path: file.path });
                    combinedContent += `\n--- Content from ${file.originalname} ---\n${result.value}\n`;
                } else if (file.mimetype.startsWith('text/')) {
                    combinedContent += `\n--- Content from ${file.originalname} ---\n${fs.readFileSync(file.path, 'utf8')}\n`;
                }
            }
        }

        const newItem = new Knowledge({ 
            title, 
            details, 
            files: req.files.map(f => ({
                filename: f.filename,
                path: f.path,
                mimetype: f.mimetype
            })),
            content: combinedContent 
        });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) {
        console.error("Knowledge Upload Error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const item = await Knowledge.findById(req.params.id);
        if (item) {
            item.files.forEach(f => {
                const filePath = path.join(__dirname, '..', f.path);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            });
            await Knowledge.findByIdAndDelete(req.params.id);
        }
        res.json({ message: 'Knowledge item deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
