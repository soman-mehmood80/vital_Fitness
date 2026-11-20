const mongoose = require("mongoose");

const stepLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true, index: true },
    steps: { type: Number, default: 0 }
}, { timestamps: true });

// Ek din mein ek hi entry (Upsert ke liye)
stepLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("StepLog", stepLogSchema);