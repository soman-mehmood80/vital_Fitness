const mongoose = require("mongoose");

const nutritionSchema = new mongoose.Schema(
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

        mealType: {
            type: String,
            enum: ["Breakfast", "Lunch", "Dinner", "Snack"],
            required: true
        },

        // Either reference to FoodItem OR custom food
        foodItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodItem",
            default: null
        },

        // Snapshot — survives FoodItem deletion
        foodName: { type: String, required: true, trim: true },

        quantity: {
            type: Number,
            required: true,
            min: 0.1
        },

        // Per-entry totals (already multiplied)
        calories: { type: Number, required: true, min: 0 },
        protein: { type: Number, default: 0, min: 0 },
        carbs: { type: Number, default: 0, min: 0 },
        fats: { type: Number, default: 0, min: 0 },

        notes: { type: String, default: "", maxlength: 200 }
    },
    { timestamps: true }
);

nutritionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Nutrition", nutritionSchema);