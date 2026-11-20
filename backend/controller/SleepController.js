const SleepLog = require("../model/SleepLog");
const User = require("../model/User");
const { getTodayUTC } = require("../utils/dateUtils");

const logSleep = async (req, res) => {
    try {
        const { sleepTime, wakeTime, quality, date } = req.body;

        if (!sleepTime || !wakeTime) {
            return res.status(400).json({ success: false, message: "Sleep and wake times required" });
        }

        const sleepD = new Date(sleepTime);
        const wakeD = new Date(wakeTime);

        if (isNaN(sleepD.getTime()) || isNaN(wakeD.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid sleep/wake times" });
        }

        let diffMs = wakeD - sleepD;
        if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;

        const diffHours = diffMs / (1000 * 60 * 60);

        // ✅ Realistic range
        if (diffHours < 1 || diffHours > 16) {
            return res.status(400).json({
                success: false,
                message: "Sleep duration must be 1-16 hours"
            });
        }

        // ✅ Quality validation
        const validQuality = ["Poor", "Fair", "Good", "Excellent"];
        if (quality && !validQuality.includes(quality)) {
            return res.status(400).json({
                success: false,
                message: "Quality must be: Poor, Fair, Good, or Excellent"
            });
        }

        const today = getTodayUTC(date);

        // ✅ Atomic upsert
        const log = await SleepLog.findOneAndUpdate(
            { userId: req.user.userId, date: today },
            {
                sleepTime: sleepD,
                wakeTime: wakeD,
                durationHours: +diffHours.toFixed(1),
                quality: quality || "Good"
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // 201 vs 200 based on new or update
        const isNew = log.createdAt.getTime() === log.updatedAt.getTime();

        res.status(isNew ? 201 : 200).json({
            success: true,
            message: isNew ? "Sleep logged" : "Sleep updated for today",
            log
        });
    } catch (error) {
        console.error("logSleep error:", error);
        res.status(500).json({ success: false, message: "Failed to log sleep" });
    }
};

const getTodaySleep = async (req, res) => {
    try {
        const today = getTodayUTC(req.query.date);
        const [log, user] = await Promise.all([
            SleepLog.findOne({ userId: req.user.userId, date: today }).lean(),
            User.findById(req.user.userId).select("sleepGoal").lean()
        ]);

        const goal = user?.sleepGoal || 8;
        const hours = log?.durationHours || 0;

        res.status(200).json({
            success: true,
            log: log || null,
            hours,
            goal,
            percentage: Math.min(100, Math.round((hours / goal) * 100))
        });
    } catch (error) {
        console.error("getTodaySleep error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch sleep" });
    }
};

const getSleepHistory = async (req, res) => {
    try {
        const days = Math.min(parseInt(req.query.days) || 30, 365);
        const since = new Date();
        since.setUTCDate(since.getUTCDate() - days);
        since.setUTCHours(0, 0, 0, 0);

        const history = await SleepLog.find({
            userId: req.user.userId,
            date: { $gte: since }
        })
            .sort({ date: -1 })
            .limit(days)
            .lean();

        const chartData = [...history].reverse().map(log => ({
            date: log.date.toISOString().split("T")[0],
            hours: log.durationHours,
            quality: log.quality
        }));

        const averageHours = history.length
            ? +(history.reduce((s, l) => s + l.durationHours, 0) / history.length).toFixed(1)
            : 0;

        res.status(200).json({
            success: true,
            history,
            chartData,
            averageHours
        });
    } catch (error) {
        console.error("getSleepHistory error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch sleep history" });
    }
};

module.exports = { logSleep, getTodaySleep, getSleepHistory };