const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },

        description: { type: String, required: true },

        category: {
            type: String,
            enum: ["Cardio", "Strength", "Yoga", "Flexibility", "Other"],
            required: true
        },

        difficulty: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced"],
            default: "Beginner"
        },

        duration: { type: Number, required: true, min: 1 },

        targetMuscles: { type: [String], default: [] },

        sets: { type: Number, default: 0, min: 0 },
        reps: { type: Number, default: 0, min: 0 },
        restSeconds: { type: Number, default: 30, min: 0 },

        instructions: { type: [String], default: [] },

        safetyGuidance: { type: String, default: "" },

        thumbnail: { type: String, default: "" },
        thumbnailPublicId: { type: String, default: "" },

        videoUrl: { type: String, default: "" },
        videoPublicId: { type: String, default: "" },
        videoType: {
            type: String,
            enum: ["cloudinary", "youtube", "none"],
            default: "none"
        },

        caloriesEstimate: { type: Number, default: 0, min: 0 },

        isPublished: { type: Boolean, default: true },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);

workoutSchema.index({ title: "text", description: "text" });
workoutSchema.index({ category: 1, difficulty: 1, isPublished: 1 });

module.exports = mongoose.model("Workout", workoutSchema);