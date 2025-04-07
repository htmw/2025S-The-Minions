const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images and DICOM files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|dcm)$/i)) {
        return cb(new Error('Only image files (jpg, jpeg, png, gif) and DICOM files (dcm) are allowed!'), false);
    }
    cb(null, true);
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

module.exports = upload; 