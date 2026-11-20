const StepLog = require("../model/StepLog");
const User = require("../model/User");
const { getTodayUTC } = require("../utils/dateUtils");

const addSteps = async (req, res) => {
    try {
        const { steps } = req.body;
        const parsedSteps = Number(steps);

        if (!Number.isFinite(parsedSteps) || parsedSteps < 1 || parsedSteps > 100000) {
            return res.status(400).json({
                success: false,
                message: "Steps must be between 1 and 100,000"
            });
        }

        const today = getTodayUTC(req.body.date || req.query.date);

        const log = await StepLog.findOneAndUpdate(
            { userId: req.user.userId, date: today },
            { $inc: { steps: parsedSteps } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ success: true, steps: log.steps });
    } catch (error) {
        console.error("addSteps error:", error);
        res.status(500).json({ success: false, message: "Failed to add steps" });
    }
};

const getTodaySteps = async (req, res) => {
    try {
        const today = getTodayUTC(req.query.date);

        const [log, user] = await Promise.all([
            StepLog.findOne({ userId: req.user.userId, date: today }).lean(),
            User.findById(req.user.userId).select("stepGoal").lean()
        ]);

        const steps = log?.steps || 0;
        const goal = user?.stepGoal || 10000;

        res.status(200).json({
            success: true,
            steps,
            goal,
            percentage: Math.min(100, Math.round((steps / goal) * 100)),
            remaining: Math.max(0, goal - steps)
        });
    } catch (error) {
        console.error("getTodaySteps error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch steps" });
    }
};

const getStepHistory = async (req, res) => {
    try {
        const days = Math.min(parseInt(req.query.days) || 30, 365);
        const since = new Date();
        since.setUTCDate(since.getUTCDate() - days);
        since.setUTCHours(0, 0, 0, 0);

        const logs = await StepLog.find({
            userId: req.user.userId,
            date: { $gte: since }
        }).sort({ date: 1 }).lean();

        const chartData = logs.map(l => ({
            date: l.date.toISOString().split("T")[0],
            steps: l.steps
        }));

        const total = logs.reduce((sum, l) => sum + l.steps, 0);
        const average = logs.length ? Math.round(total / logs.length) : 0;

        res.status(200).json({
            success: true,
            chartData,
            average,
            total,
            daysLogged: logs.length
        });
    } catch (error) {
        console.error("getStepHistory error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch history" });
    }
};

module.exports = { addSteps, getTodaySteps, getStepHistory };