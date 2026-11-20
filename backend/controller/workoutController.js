const mongoose = require("mongoose");
const Workout = require("../model/Workout");
const cloudinary = require("../config/cloudinary");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const extractYouTubeId = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

// GET /api/workouts
const getWorkouts = async (req, res) => {
    try {
        const { search, category, difficulty, page = 1, limit = 12 } = req.query;
        const filter = { isPublished: true };
        if (category) filter.category = category;
        if (difficulty) filter.difficulty = difficulty;
        if (search && search.trim()) {
            filter.$or = [
                { title: { $regex: search.trim(), $options: "i" } },
                { description: { $regex: search.trim(), $options: "i" } }
            ];
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
        const skip = (pageNum - 1) * limitNum;

        const [workouts, total] = await Promise.all([
            Workout.find(filter)
                .select("title description category difficulty duration targetMuscles thumbnail videoType caloriesEstimate")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Workout.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true, page: pageNum, limit: limitNum, total,
            totalPages: Math.ceil(total / limitNum), workouts
        });
    } catch (error) {
        console.error("getWorkouts error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch workouts" });
    }
};

// GET /api/workouts/:id
const getWorkoutById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid workout id" });

        const workout = await Workout.findById(id).lean();
        if (!workout || !workout.isPublished) return res.status(404).json({ success: false, message: "Workout not found" });

        res.status(200).json({ success: true, workout });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch workout" });
    }
};

// POST /api/workouts
const createWorkout = async (req, res) => {
    try {
        const {
            title, description, category, difficulty, duration,
            targetMuscles, sets, reps, restSeconds, instructions,
            safetyGuidance, videoUrl, videoType, caloriesEstimate, isPublished
        } = req.body;

        if (!title || !description || !category || !duration) {
            return res.status(400).json({ success: false, message: "Title, description, category and duration are required" });
        }

        let finalVideoUrl = "";
        let finalVideoType = "none";
        let finalVideoPublicId = "";
        let finalThumbnail = "";
        let finalThumbnailPublicId = "";

        // Video Logic
        if (videoType === "youtube" && videoUrl) {
            const ytId = extractYouTubeId(videoUrl);
            if (!ytId) return res.status(400).json({ success: false, message: "Invalid YouTube URL" });
            finalVideoUrl = `https://www.youtube.com/watch?v=${ytId}`;
            finalVideoType = "youtube";
        } else if (req.files && req.files['video']) {
            finalVideoUrl = req.files['video'][0].path;
            finalVideoPublicId = req.files['video'][0].filename;
            finalVideoType = "cloudinary";
        }

        // Thumbnail/Image Logic
        if (req.files && req.files['image']) {
            finalThumbnail = req.files['image'][0].path;
            finalThumbnailPublicId = req.files['image'][0].filename;
        }

        const workout = await Workout.create({
            title: title.trim(),
            description,
            category,
            difficulty: difficulty || "Beginner",
            duration: Number(duration),
            targetMuscles: Array.isArray(targetMuscles) ? targetMuscles : [],
            sets: Number(sets) || 0,
            reps: Number(reps) || 0,
            restSeconds: Number(restSeconds) || 30,
            instructions: Array.isArray(instructions) ? instructions : [],
            safetyGuidance: safetyGuidance || "",
            thumbnail: finalThumbnail,
            thumbnailPublicId: finalThumbnailPublicId,
            videoUrl: finalVideoUrl,
            videoPublicId: finalVideoPublicId,
            videoType: finalVideoType,
            caloriesEstimate: Number(caloriesEstimate) || 0,
            isPublished: isPublished !== false,
            createdBy: req.user.userId
        });

        res.status(201).json({ success: true, message: "Workout created", workout });
    } catch (error) {
        console.error("createWorkout error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to create workout" });
    }
};

// PUT /api/workouts/:id
const updateWorkout = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid id" });

        const workout = await Workout.findById(id);
        if (!workout) return res.status(404).json({ success: false, message: "Workout not found" });

        const allowed = ["title", "description", "category", "difficulty", "duration", "targetMuscles", "sets", "reps", "restSeconds", "instructions", "safetyGuidance", "caloriesEstimate", "isPublished"];
        allowed.forEach((key) => { if (req.body[key] !== undefined) workout[key] = req.body[key]; });

        // Handle Video updates
        if (req.body.videoType === "youtube" && req.body.videoUrl) {
            const ytId = extractYouTubeId(req.body.videoUrl);
            if (!ytId) return res.status(400).json({ success: false, message: "Invalid YouTube URL" });
            if (workout.videoType === "cloudinary" && workout.videoPublicId) {
                try { await cloudinary.uploader.destroy(workout.videoPublicId, { resource_type: "video" }); } catch (err) { }
            }
            workout.videoUrl = `https://www.youtube.com/watch?v=${ytId}`;
            workout.videoType = "youtube";
            workout.videoPublicId = "";
        } else if (req.files && req.files['video']) {
            if (workout.videoType === "cloudinary" && workout.videoPublicId) {
                try { await cloudinary.uploader.destroy(workout.videoPublicId, { resource_type: "video" }); } catch (err) { }
            }
            workout.videoUrl = req.files['video'][0].path;
            workout.videoPublicId = req.files['video'][0].filename;
            workout.videoType = "cloudinary";
        } else if (req.body.videoType === "none") {
            if (workout.videoType === "cloudinary" && workout.videoPublicId) {
                try { await cloudinary.uploader.destroy(workout.videoPublicId, { resource_type: "video" }); } catch (err) { }
            }
            workout.videoUrl = "";
            workout.videoPublicId = "";
            workout.videoType = "none";
        }

        // Handle Thumbnail update
        if (req.files && req.files['image']) {
            if (workout.thumbnailPublicId) {
                try { await cloudinary.uploader.destroy(workout.thumbnailPublicId); } catch (err) { }
            }
            workout.thumbnail = req.files['image'][0].path;
            workout.thumbnailPublicId = req.files['image'][0].filename;
        }

        await workout.save();
        res.status(200).json({ success: true, message: "Workout updated", workout });
    } catch (error) {
        console.error("updateWorkout error:", error);
        res.status(500).json({ success: false, message: "Failed to update workout" });
    }
};

// DELETE /api/workouts/:id
const deleteWorkout = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid workout id" });

        const workout = await Workout.findById(id);
        if (!workout) return res.status(404).json({ success: false, message: "Workout not found" });

        if (workout.videoType === "cloudinary" && workout.videoPublicId) {
            try { await cloudinary.uploader.destroy(workout.videoPublicId, { resource_type: "video" }); } catch (err) { }
        }
        if (workout.thumbnailPublicId) {
            try { await cloudinary.uploader.destroy(workout.thumbnailPublicId); } catch (err) { }
        }

        await Workout.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Workout deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete workout" });
    }
};

// GET /api/workouts/admin/all
const getAllWorkouts = async (req, res) => {
    try {
        const workouts = await Workout.find().sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, workouts });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch workouts" });
    }
};

module.exports = {
    getWorkouts, getWorkoutById, createWorkout,
    getAllWorkouts, updateWorkout, deleteWorkout
};