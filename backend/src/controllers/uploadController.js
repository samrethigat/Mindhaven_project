import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter(req, file, cb) {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error("File type not allowed. Please upload an image, audio, or PDF file."));
  },
});

/**
 * Robust Upload Middleware supporting both specific field names and any field name.
 */
export function uploadMiddleware(field = "file") {
  return (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File size exceeds 10MB limit." });
        }
        return res.status(400).json({ error: err.message || "File upload error" });
      }

      if (req.files && req.files.length > 0) {
        req.file = req.files.find((f) => f.fieldname === field) || req.files[0];
      }

      next();
    });
  };
}

export async function uploadFile(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const mime = req.file.mimetype;
    let resourceType = "raw";
    if (mime.startsWith("image/")) resourceType = "image";
    else if (mime.startsWith("audio/")) resourceType = "video";

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      const base64Data = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
      return res.json({
        url: base64Data,
        publicId: `local_${Date.now()}`,
        fileName: req.file.originalname,
        mime,
      });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: resourceType, folder: "mindhaven" },
        (err, res2) => (err ? reject(err) : resolve(res2))
      );
      stream.end(req.file.buffer);
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      fileName: req.file.originalname,
      mime,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
