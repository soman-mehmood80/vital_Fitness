const mongoose = require("mongoose");
const Workout = require("../model/Workout");
const WorkoutLog = require("../model/WorkoutLog");
const User = require("../model/User");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const updateUserWorkoutStreak = async (userId, activityDate = new Date()) => {
    const user = await User.findById(userId).select("streak lastActiveDate");
    if (!user) return;

    const today = new Date(
        activityDate.getFullYear(),
        activityDate.getMonth(),
        activityDate.getDate()
    );

    if (user.lastActiveDate) {
        const last = new Date(
            user.lastActiveDate.getFullYear(),
            user.lastActiveDate.getMonth(),
            user.lastActiveDate.getDate()
        );
        const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return;
        user.streak = diffDays === 1 ? (user.streak || 0) + 1 : 1;
    } else {
        user.streak = 1;
    }

    user.lastActiveDate = activityDate;
    await user.save();
};

// POST /api/workout-logs/complete
const completeWorkout = async (req, res) => {
    try {
        const { workoutId, duration, caloriesBurned, completedSets, completedReps, notes } = req.body;

        if (!isValidId(workoutId)) {
            return res.status(400).json({ success: false, message: "Invalid workout id" });
        }

        if (!duration || Number(duration) < 1) {
            return res.status(400).json({
                success: false,
                message: "Duration is required and must be at least 1 minute"
            });
        }

        const workout = await Workout.findOne({ _id: workoutId, isPublished: true });
        if (!workout) {
            return res.status(404).json({
                success: false, message: "Workout not found or not published"
            });
        }

        const log = await WorkoutLog.create({
            userId: req.user.userId,
            workoutId: workout._id,
            workoutTitleSnapshot: workout.title,
            workoutCategorySnapshot: workout.category,
            title: workout.title,
            muscleGroup: workout.category,
            source: "workouts",
            duration: Number(duration),
            caloriesBurned: Number(caloriesBurned) || 0,
            completedSets: Number(completedSets) || 0,
            completedReps: Number(completedReps) || 0,
            notes: (notes || "").slice(0, 500)
        });

        await updateUserWorkoutStreak(req.user.userId, log.completedAt);

        res.status(201).json({ success: true, message: "Workout completed", log });
    } catch (error) {
        console.error("completeWorkout error:", error);
        res.status(500).json({ success: false, message: "Failed to save workout log" });
    }
};

// GET /api/workout-logs/my-history
const getMyWorkoutHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const filter = { userId: req.user.userId };

        const [logs, total] = await Promise.all([
            WorkoutLog.find(filter)
                .populate("workoutId", "title category thumbnail")
                .sort({ completedAt: -1 })
                .skip(skip).limit(limitNum).lean(),
            WorkoutLog.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true, page: pageNum, limit: limitNum, total,
            totalPages: Math.ceil(total / limitNum), logs
        });
    } catch (error) {
        console.error("getMyWorkoutHistory error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch workout history" });
    }
};

// DELETE /api/workout-logs/:id
const deleteWorkoutLog = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid log id" });
        }

        const log = await WorkoutLog.findById(id);
        if (!log) {
            return res.status(404).json({ success: false, message: "Log not found" });
        }

        if (log.userId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ success: false, message: "Not allowed to delete this log" });
        }

        await WorkoutLog.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Log deleted" });
    } catch (error) {
        console.error("deleteWorkoutLog error:", error);
        res.status(500).json({ success: false, message: "Failed to delete log" });
    }
};

module.exports = { completeWorkout, getMyWorkoutHistory, deleteWorkoutLog };