const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blogs",          // Cloudinary folder name
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [
      { width: 1200, height: 630, crop: "limit", quality: "auto" }
    ]
  }
});

const upload = multer({ storage });

module.exports = upload;
