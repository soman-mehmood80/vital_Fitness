const mongoose = require("mongoose");

const sleepLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        date: { type: Date, required: true, index: true }, // The day you woke up
        sleepTime: { type: Date, required: true },         // e.g., 11:00 PM yesterday
        wakeTime: { type: Date, required: true },          // e.g., 7:00 AM today
        durationHours: { type: Number, required: true },   // calculated
        quality: { type: String, enum: ["Poor", "Fair", "Good", "Excellent"], default: "Good" }
    },
    { timestamps: true }
);

sleepLogSchema.index({ userId: 1, date: -1 }, { unique: true }); // 1 log per day

module.exports = mongoose.model("SleepLog", sleepLogSchema);