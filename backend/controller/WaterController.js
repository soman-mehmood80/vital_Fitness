const WaterLog = require("../model/WaterLog");
const User = require("../model/User");
const Notification = require("../model/Notification"); // ✅ Notification Model Import kiya
const { getTodayUTC } = require("../utils/dateUtils");

// POST /api/water
const logWater = async (req, res) => {
    try {
        const { amount } = req.body;
        const parsedAmount = Number(amount);

        if (!parsedAmount || parsedAmount < 10 || parsedAmount > 5000) {
            return res.status(400).json({
                success: false,
                message: "Amount must be between 10 and 5000 ml"
            });
        }

        const today = getTodayUTC(req.body.date || req.query.date);

        // ✅ Atomic upsert — single doc per day
        const log = await WaterLog.findOneAndUpdate(
            { userId: req.user.userId, date: today },
            {
                $inc: { amount: parsedAmount },
                $set: { time: new Date() }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // ==========================================
        // ✅ NEW: NOTIFICATION LOGIC (Water Logged)
        // ==========================================
        const user = await User.findById(req.user.userId).select("waterGoal");
        const goal = user?.waterGoal || 2500;

        // Agar user ne goal cross kar liya hai
        if (log.amount >= goal) {
            // Check karo ke aaj pehle se goal wali notification toh nahi hai
            const existingNotif = await Notification.findOne({
                userId: req.user.userId,
                type: "water",
                title: "Hydration Goal Achieved! 💧",
                createdAt: { $gte: today }
            });

            if (!existingNotif) {
                await Notification.create({
                    userId: req.user.userId,
                    title: "Hydration Goal Achieved! 💧",
                    message: `Awesome! You reached your daily goal of ${goal}ml.`,
                    type: "water"
                });
            }
        } else {
            // Agar goal nahi hua, toh har log par ek update bhejo
            await Notification.create({
                userId: req.user.userId,
                title: "Hydration Update! 🥤",
                message: `You just logged ${parsedAmount}ml of water. Keep it up!`,
                type: "water"
            });
        }
        // ==========================================

        // Streak update
        await updateStreak(req.user.userId, today);

        res.status(201).json({
            success: true,
            message: "Water logged",
            total: log.amount,
            log
        });
    } catch (error) {
        console.error("logWater error:", error);
        res.status(500).json({ success: false, message: "Failed to log water" });
    }
};

// GET /api/water/today
const getTodayWater = async (req, res) => {
    try {
        const today = getTodayUTC(req.query.date);

        const [log, user] = await Promise.all([
            WaterLog.findOne({ userId: req.user.userId, date: today }).lean(),
            User.findById(req.user.userId).select("waterGoal").lean()
        ]);

        const total = log?.amount || 0;
        const goal = user?.waterGoal || 2500;

        res.status(200).json({
            success: true,
            total,
            goal,
            percentage: Math.min(100, Math.round((total / goal) * 100)),
            remaining: Math.max(0, goal - total),
            log: log || null
        });
    } catch (error) {
        console.error("getTodayWater error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch water" });
    }
};

// DELETE /api/water/:id
const deleteWaterLog = async (req, res) => {
    try {
        const log = await WaterLog.findById(req.params.id);
        if (!log) return res.status(404).json({ success: false, message: "Log not found" });
        if (log.userId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ success: false, message: "Not allowed" });
        }

        await WaterLog.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (error) {
        console.error("deleteWaterLog error:", error);
        res.status(500).json({ success: false, message: "Failed to delete" });
    }
};

// ✅ Shared streak update (atomic)
const updateStreak = async (userId, today) => {
    try {
        const user = await User.findById(userId).select("lastActiveDate streak achievements");
        if (!user) return;

        const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;

        if (lastActive) {
            const lastActiveDay = new Date(lastActive);
            lastActiveDay.setUTCHours(0, 0, 0, 0);
            if (lastActiveDay.getTime() === today.getTime()) return;
        }

        const yesterday = new Date(today);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);

        let newStreak = 1;
        if (lastActive) {
            const lastActiveDay = new Date(lastActive);
            lastActiveDay.setUTCHours(0, 0, 0, 0);
            newStreak = (lastActiveDay.getTime() === yesterday.getTime())
                ? user.streak + 1
                : 1;
        }

        // Achievement badges
        const achievements = user.achievements || [];
        const newBadges = [];

        if (newStreak >= 3 && !achievements.includes("3_day_streak"))
            newBadges.push("3_day_streak");
        if (newStreak >= 7 && !achievements.includes("7_day_streak"))
            newBadges.push("7_day_streak");
        if (newStreak >= 30 && !achievements.includes("30_day_streak"))
            newBadges.push("30_day_streak");
        if (newStreak >= 100 && !achievements.includes("100_day_streak"))
            newBadges.push("100_day_streak");

        const updates = {
            $set: { streak: newStreak, lastActiveDate: today }
        };

        if (newBadges.length > 0) {
            updates.$addToSet = { achievements: { $each: newBadges } };
        }

        await User.findByIdAndUpdate(userId, updates);
    } catch (error) {
        console.error("updateStreak error:", error);
    }
};

module.exports = { logWater, getTodayWater, deleteWaterLog };