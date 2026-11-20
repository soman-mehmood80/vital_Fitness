const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const isVideo = file.mimetype.startsWith("video/");
        return {
            folder: isVideo ? "VitalFit/WorkoutVideos" : "VitalFit/WorkoutThumbnails",
            resource_type: isVideo ? "video" : "image",
            allowed_formats: isVideo ? ["mp4", "mov", "webm"] : ["jpg", "jpeg", "png", "webp"]
        };
    }
});

const workoutUpload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = [
            "video/mp4", "video/quicktime", "video/webm",
            "image/jpeg", "image/png", "image/webp"
        ];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error("Unsupported file type"));
        }
        cb(null, true);
    }
});

module.exports = workoutUpload;