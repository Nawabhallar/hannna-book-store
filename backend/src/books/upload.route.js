const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const router = express.Router();

// ensure uploads directory exists and is writable
const uploadDir = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true)
  else cb(new Error('Invalid file type'));
}

const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter });

// upload single cover image and process it with sharp
router.post('/upload-cover', upload.single('cover'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const originalPath = path.join(req.file.destination, req.file.filename);
    const processedName = path.parse(req.file.filename).name + '.webp';
    const processedPath = path.join(req.file.destination, processedName);

    // process: resize to max width 1200, convert to webp quality 80
    await sharp(originalPath)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(processedPath);

    // remove original uploaded file
    fs.unlink(originalPath, (err) => {
      if (err) console.warn('Failed to remove original file', err);
    });

    const url = `/uploads/${processedName}`; // served statically
    return res.status(200).json({ url });
  } catch (err) {
    console.error('Upload error', err);
    return res.status(500).json({ message: 'Upload failed' });
  }
});

module.exports = router;
