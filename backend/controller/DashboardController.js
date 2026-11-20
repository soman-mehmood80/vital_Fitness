const Nutrition = require("../model/Nutrition");
const WorkoutLog = require("../model/WorkoutLog");
const Progress = require("../model/Progress");
const WaterLog = require("../model/WaterLog");
const SleepLog = require("../model/SleepLog");
const User = require("../model/User");

const getDayBounds = (dateStr) => {
    let base = new Date();
    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [y, m, d] = dateStr.split("-").map(Number);
        base = new Date(y, m - 1, d);
    }
    const startOfDay = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
        0, 0, 0, 0
    );
    const endOfDay = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
        23, 59, 59, 999
    );
    const dateKey = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
    return { startOfDay, endOfDay, dateKey };
};

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

const getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { startOfDay, endOfDay, dateKey } = getDayBounds(req.query.date);

        const [
            nutritionLogs,
            workoutLogs,
            waterLogs,
            sleepLog,
            user
        ] = await Promise.all([
            Nutrition.find({
                userId,
                date: { $gte: startOfDay, $lte: endOfDay }
            }).lean(),

            WorkoutLog.find({
                userId,
                completedAt: { $gte: startOfDay, $lte: endOfDay }
            }).lean(),

            WaterLog.find({
                userId,
                date: { $gte: startOfDay, $lte: endOfDay }
            }).lean(),

            SleepLog.findOne({
                userId,
                date: { $gte: startOfDay, $lte: endOfDay }
            }).lean(),

            User.findById(userId)
                .select("streak achievements waterGoal sleepGoal dailyHabits")
                .lean()
        ]);

        const nutritionTotals = nutritionLogs.reduce(
            (acc, log) => {
                acc.calories += log.calories || 0;
                acc.protein += log.protein || 0;
                acc.carbs += log.carbs || 0;
                acc.fats += log.fats || 0;
                return acc;
            },
            { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );

        const workoutTotals = workoutLogs.reduce(
            (acc, log) => {
                acc.caloriesBurned += log.caloriesBurned || 0;
                acc.duration += log.duration || 0;
                acc.count += 1;
                return acc;
            },
            { caloriesBurned: 0, duration: 0, count: 0 }
        );

        const waterTotal = waterLogs.reduce(
            (sum, l) => sum + (l.amount || 0),
            0
        );

        const sleepHours = sleepLog ? sleepLog.durationHours || 0 : 0;

        const habitsForDay =
            user?.dailyHabits?.date === dateKey &&
                Array.isArray(user?.dailyHabits?.items)
                ? user.dailyHabits.items
                : null;

        return res.status(200).json({
            success: true,
            nutrition: {
                calories: nutritionTotals.calories,
                protein: nutritionTotals.protein,
                carbs: nutritionTotals.carbs,
                fats: nutritionTotals.fats
            },
            workouts: {
                caloriesBurned: workoutTotals.caloriesBurned,
                duration: workoutTotals.duration,
                count: workoutTotals.count
            },
            water: {
                total: waterTotal,
                goal: user?.waterGoal || 2500
            },
            sleep: {
                hours: sleepHours,
                goal: user?.sleepGoal || 8
            },
            achievements: {
                streak: user?.streak || 0,
                badges: user?.achievements || []
            },
            habits: habitsForDay
        });

    } catch (error) {
        console.error("getDashboardSummary error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load summary"
        });
    }
};

// POST /api/dashboard/quick-workout
const logQuickWorkout = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            title,
            muscleGroup = "General",
            exercises = [],
            mode = "strength",
            source = "dashboard",
            duration,
            caloriesBurned,
            completedAt,
            notes = ""
        } = req.body || {};

        const numericDuration = Math.max(1, Math.round(Number(duration) || 1));
        const numericCalories = Math.max(0, Math.round(Number(caloriesBurned) || 0));
        const cleanTitle = (title || "Quick Workout Session").trim();
        const completedDate = completedAt ? new Date(completedAt) : new Date();
        const cleanExercises = Array.isArray(exercises) ? exercises.map(String) : [];

        const log = await WorkoutLog.create({
            userId,
            workoutId: null,
            workoutTitleSnapshot: cleanTitle,
            workoutCategorySnapshot: muscleGroup,
            title: cleanTitle,
            muscleGroup,
            exercises: cleanExercises,
            mode,
            source,
            duration: numericDuration,
            caloriesBurned: numericCalories,
            completedSets: cleanExercises.length,
            notes: notes || (cleanExercises.length ? `Exercises: ${cleanExercises.join(", ")}`.slice(0, 500) : ""),
            completedAt: completedDate
        });

        await updateUserWorkoutStreak(userId, completedDate);

        return res.status(201).json({
            success: true,
            message: "Workout saved to database",
            log
        });
    } catch (error) {
        console.error("logQuickWorkout error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to save workout"
        });
    }
};

// PUT /api/dashboard/habits
const saveDailyHabits = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { date, habits } = req.body || {};

        if (!Array.isArray(habits)) {
            return res.status(400).json({
                success: false,
                message: "Habits array is required"
            });
        }

        const { dateKey } = getDayBounds(date);
        const sanitized = habits.map((h) => ({
            id: String(h.id || ""),
            label: String(h.label || ""),
            done: Boolean(h.done)
        }));

        await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    dailyHabits: {
                        date: dateKey,
                        items: sanitized
                    }
                }
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            habits: sanitized
        });
    } catch (error) {
        console.error("saveDailyHabits error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save habits"
        });
    }
};

module.exports = {
    getDashboardSummary,
    logQuickWorkout,
    saveDailyHabits
};