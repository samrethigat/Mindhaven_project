import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf", "audio/webm", "audio/mp4", "audio/mpeg"];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error("File type not allowed"));
  },
});

export function uploadMiddleware(field) {
  return upload.single(field);
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
