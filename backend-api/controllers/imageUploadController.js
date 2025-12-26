const path = require('path');
const { createResponse } = require('../jsend.js');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

const imageUploadController = {
    uploadImage: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json(createResponse(false, null, 'No file uploaded'));
            }

            // Multer diskStorage sets req.file.filename
            const filename = req.file.filename || req.file.originalname;
            const relativePath = `/uploads/${filename}`;
            const fullUrl = `${BASE_URL}${relativePath}`;

            return res.status(200).json(createResponse(true, { url: fullUrl }, 'File uploaded successfully'));
        } catch (err) {
            console.error('Error uploading image (local):', err);
            return res.status(500).json(createResponse(false, null, 'Error uploading image'));
        }
    }
};

module.exports = imageUploadController;