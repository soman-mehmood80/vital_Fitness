const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        category: {
            type: String,
            enum: [
                "Protein",
                "Carbohydrate",
                "Carbs",
                "Fat",
                "Fats",
                "Vegetable",
                "Fruit",
                "Dairy",
                "Beverage",
                "Snack",
                "Other"
            ],
            default: "Other"
        },

        servingSize: {
            type: Number,
            required: true,
            min: 1
        },

        servingUnit: {
            type: String,
            default: "g", 
            trim: true
        },

        // Per serving
        calories: { type: Number, required: true, min: 0 },
        protein: { type: Number, default: 0, min: 0 },
        carbs: { type: Number, default: 0, min: 0 },
        fats: { type: Number, default: 0, min: 0 },

        isActive: { type: Boolean, default: true },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);

foodItemSchema.index({ name: "text", category: 1 });

module.exports = mongoose.model("FoodItem", foodItemSchema);