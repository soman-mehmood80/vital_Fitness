const mongoose = require("mongoose");
const Progress = require("../model/Progress");
const User = require("../model/User");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Normalize date to start of day (UTC)
const normalizeDate = (d) => {
    const date = new Date(d);
    date.setUTCHours(0, 0, 0, 0);
    return date;
};

// POST /api/progress
const addProgress = async (req, res) => {
    try {
        const { weight, bodyFat, muscleMass, measurements, notes, date } = req.body;

        if (!weight || Number(weight) < 20) {
            return res.status(400).json({ success: false, message: "Valid weight (kg) is required" });
        }

        const logDate = normalizeDate(date || new Date());

        // Upsert logic: agar aaj ki entry pehle se hai, to update karo
        const existing = await Progress.findOne({
            userId: req.user.userId,
            date: logDate
        });

        if (existing) {
            existing.weight = Number(weight);
            if (bodyFat !== undefined) existing.bodyFat = bodyFat ? Number(bodyFat) : null;
            if (muscleMass !== undefined) existing.muscleMass = muscleMass ? Number(muscleMass) : null;
            if (notes !== undefined) existing.notes = (notes || "").slice(0, 300);

            if (measurements) {
                existing.measurements = {
                    chest: measurements.chest ? Number(measurements.chest) : null,
                    waist: measurements.waist ? Number(measurements.waist) : null,
                    hips: measurements.hips ? Number(measurements.hips) : null,
                    arms: measurements.arms ? Number(measurements.arms) : null,
                    thighs: measurements.thighs ? Number(measurements.thighs) : null
                };
            }

            await existing.save();
            return res.status(200).json({ success: true, message: "Progress updated for this date", log: existing });
        }

        const log = await Progress.create({
            userId: req.user.userId,
            date: logDate,
            weight: Number(weight),
            bodyFat: bodyFat ? Number(bodyFat) : null,
            muscleMass: muscleMass ? Number(muscleMass) : null,
            measurements: {
                chest: measurements?.chest ? Number(measurements.chest) : null,
                waist: measurements?.waist ? Number(measurements.waist) : null,
                hips: measurements?.hips ? Number(measurements.hips) : null,
                arms: measurements?.arms ? Number(measurements.arms) : null,
                thighs: measurements?.thighs ? Number(measurements.thighs) : null
            },
            notes: (notes || "").slice(0, 300)
        });

        res.status(201).json({ success: true, message: "Progress saved", log });
    } catch (error) {
        console.error("addProgress error:", error);
        res.status(500).json({ success: false, message: "Failed to save progress" });
    }
};

// GET /api/progress
const getProgressHistory = async (req, res) => {
    try {
        const { days = 30 } = req.query;

        // Last X days ka data fetch karo
        const since = new Date();
        since.setDate(since.getDate() - Number(days));
        since.setUTCHours(0, 0, 0, 0);

        const logs = await Progress.find({
            userId: req.user.userId,
            date: { $gte: since }
        })
            .sort({ date: 1 }) // Chart ke liye ascending order (purana -> naya)
            .lean();

        // Chart ke liye data format karo
        const chartData = logs.map((log) => ({
            date: log.date.toISOString().split("T")[0], // YYYY-MM-DD
            weight: log.weight,
            bodyFat: log.bodyFat,
            waist: log.measurements?.waist || null
        }));

        // Latest and oldest stats calculate karo
        let stats = null;
        if (logs.length > 0) {
            const latest = logs[logs.length - 1];
            const oldest = logs[0];

            // BMI calculate (agar user ki height set hai)
            const user = await User.findById(req.user.userId).select("height");
            let bmi = null;
            if (user?.height) {
                const heightM = user.height / 100;
                bmi = +(latest.weight / (heightM * heightM)).toFixed(1);
            }

            stats = {
                currentWeight: latest.weight,
                startWeight: oldest.weight,
                change: +(latest.weight - oldest.weight).toFixed(1),
                bmi,
                latestDate: latest.date
            };
        }

        // History list (reverse order - latest first)
        const history = [...logs].reverse();

        res.status(200).json({
            success: true,
            chartData,
            stats,
            history
        });
    } catch (error) {
        console.error("getProgressHistory error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch progress" });
    }
};

// DELETE /api/progress/:id
const deleteProgressLog = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid id" });
        }

        const log = await Progress.findById(id);
        if (!log) {
            return res.status(404).json({ success: false, message: "Log not found" });
        }

        if (log.userId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ success: false, message: "Not allowed" });
        }

        await Progress.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Log deleted" });
    } catch (error) {
        console.error("deleteProgressLog error:", error);
        res.status(500).json({ success: false, message: "Failed to delete log" });
    }
};

module.exports = { addProgress, getProgressHistory, deleteProgressLog };