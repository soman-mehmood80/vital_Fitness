const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // Date-only (normalized to 00:00 UTC of that day)
        date: {
            type: Date,
            required: true,
            index: true
        },

        weight: {
            type: Number,
            required: true,
            min: 20,
            max: 500
        },

        bodyFat: { type: Number, default: null, min: 1, max: 70 },
        muscleMass: { type: Number, default: null, min: 1, max: 200 },

        // Optional body measurements (in cm)
        measurements: {
            chest: { type: Number, default: null },
            waist: { type: Number, default: null },
            hips: { type: Number, default: null },
            arms: { type: Number, default: null },
            thighs: { type: Number, default: null }
        },

        notes: { type: String, default: "", maxlength: 300 }
    },
    { timestamps: true }
);

// Ek user ki ek din mein sirf ek entry ho sakti hai
progressSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);