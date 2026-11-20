const mongoose = require("mongoose");

const waterLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        date: { type: Date, required: true, index: true },
        amount: { type: Number, required: true, min: 10, max: 10000 },
        time: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

// ✅ CRITICAL: Unique — 1 doc per user per day (upsert safety)
waterLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("WaterLog", waterLogSchema);