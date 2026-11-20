const mongoose = require("mongoose");

const workoutLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        workoutId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workout",
            required: false,
            default: null
        },

        workoutTitleSnapshot: { type: String, default: "" },
        workoutCategorySnapshot: { type: String, default: "" },
        title: { type: String, default: "" },
        muscleGroup: { type: String, default: "" },
        exercises: [{ type: String }],
        mode: { type: String, default: "strength" },
        source: { type: String, default: "workouts" }, // "workouts" | "timer" | "skeleton"

        completedAt: { type: Date, default: Date.now },

        duration: { type: Number, required: true, min: 1 },
        caloriesBurned: { type: Number, default: 0, min: 0 },

        completedSets: { type: Number, default: 0, min: 0 },
        completedReps: { type: Number, default: 0, min: 0 },

        notes: { type: String, default: "", maxlength: 500 }
    },
    { timestamps: true }
);

workoutLogSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model("WorkoutLog", workoutLogSchema);