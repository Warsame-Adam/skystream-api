const multer = require("multer");
const fs = require("fs");
const path = require("path");

const upload = (uploadPath) => {
  const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      const fullPath = path.join(__dirname, "../public/files", uploadPath);

      // Ensure directory exists or create it
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }

      callback(null, fullPath);
    },
    filename: (req, file, callback) => {
      callback(null, `${Date.now()}-${file.originalname}`);
    },
  });

  const multerFilter = (req, file, cb) => {
    const allowedTypes = /\.(jpg|jpeg|png|webp)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format"), false);
    }
  };

  return multer({
    storage: storage,
    fileFilter: multerFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  });
};

module.exports = upload;
