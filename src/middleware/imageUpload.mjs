import "../utils/cloudinary.mjs";
import multer from "multer";
import {v2 as cloudinary} from "cloudinary";
import {CloudinaryStorage} from "multer-storage-cloudinary";



const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const folder = req.body.folder || "misc"; 

    return {
      folder,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{width: 800, height: 600, crop: "limit"}]
    };

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

// Multer config
const upload = multer({
  storage: storage,
  fileFilter: multerFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export default upload;



