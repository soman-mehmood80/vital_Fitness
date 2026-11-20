const mongoose = require("mongoose");
const Nutrition = require("../model/Nutrition");
const FoodItem = require("../model/FoodItem");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Normalize date to start of day (UTC)
const normalizeDate = (d) => {
    const date = new Date(d);
    date.setUTCHours(0, 0, 0, 0);
    return date;
};

// POST /api/nutrition/log
const logMeal = async (req, res) => {
    try {
        const {
            foodItemId,
            customFood,
            mealType,
            quantity,
            date,
            notes
        } = req.body;

        if (!mealType) {
            return res.status(400).json({ success: false, message: "Meal type is required" });
        }

        if (!quantity || Number(quantity) <= 0) {
            return res.status(400).json({ success: false, message: "Quantity must be greater than 0" });
        }

        const logDate = normalizeDate(date || new Date());

        let entry = {
            userId: req.user.userId,
            date: logDate,
            mealType,
            quantity: Number(quantity),
            notes: (notes || "").slice(0, 200)
        };

        // Option A — From catalog
        if (foodItemId) {
            if (!isValidId(foodItemId)) {
                return res.status(400).json({ success: false, message: "Invalid food item id" });
            }

            const food = await FoodItem.findOne({ _id: foodItemId, isActive: true });
            if (!food) {
                return res.status(404).json({ success: false, message: "Food item not found" });
            }

            // Each catalog serving = servingSize units; quantity is in same unit
            const multiplier = Number(quantity) / food.servingSize;

            entry.foodItemId = food._id;
            entry.foodName = food.name;
            entry.calories = +(food.calories * multiplier).toFixed(1);
            entry.protein = +(food.protein * multiplier).toFixed(1);
            entry.carbs = +(food.carbs * multiplier).toFixed(1);
            entry.fats = +(food.fats * multiplier).toFixed(1);
        }
        // Option B — Custom food
        else if (customFood) {
            const { name, calories, protein, carbs, fats } = customFood;

            if (!name || calories === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Custom food needs name and calories"
                });
            }

            entry.foodName = name.trim();
            entry.calories = Number(calories) || 0;
            entry.protein = Number(protein) || 0;
            entry.carbs = Number(carbs) || 0;
            entry.fats = Number(fats) || 0;
        } else {
            return res.status(400).json({
                success: false,
                message: "Either foodItemId or customFood is required"
            });
        }

        const log = await Nutrition.create(entry);

        res.status(201).json({
            success: true,
            message: "Meal logged",
            log
        });
    } catch (error) {
        console.error("logMeal error:", error);
        res.status(500).json({ success: false, message: "Failed to log meal" });
    }
};

// GET /api/nutrition/today
const getTodayNutrition = async (req, res) => {
    try {
        const { date } = req.query;
        const logDate = normalizeDate(date || new Date());

        const logs = await Nutrition.find({
            userId: req.user.userId,
            date: logDate
        })
            .sort({ createdAt: -1 })
            .lean();

        // Totals
        const totals = logs.reduce(
            (acc, log) => {
                acc.calories += log.calories;
                acc.protein += log.protein;
                acc.carbs += log.carbs;
                acc.fats += log.fats;
                return acc;
            },
            { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );

        Object.keys(totals).forEach((k) => {
            totals[k] = +totals[k].toFixed(1);
        });

        // Group by meal
        const meals = {
            Breakfast: [],
            Lunch: [],
            Dinner: [],
            Snack: []
        };
        logs.forEach((log) => {
            if (meals[log.mealType]) meals[log.mealType].push(log);
        });

        res.status(200).json({
            success: true,
            date: logDate,
            totals,
            meals,
            logs
        });
    } catch (error) {
        console.error("getTodayNutrition error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch nutrition data" });
    }
};

// GET /api/nutrition/history?start=...&end=...
const getNutritionHistory = async (req, res) => {
    try {
        const { start, end } = req.query;

        const filter = { userId: req.user.userId };
        if (start || end) {
            filter.date = {};
            if (start) filter.date.$gte = normalizeDate(start);
            if (end) filter.date.$lte = normalizeDate(end);
        }

        // Aggregate daily totals
        const dailyTotals = await Nutrition.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$date",
                    calories: { $sum: "$calories" },
                    protein: { $sum: "$protein" },
                    carbs: { $sum: "$carbs" },
                    fats: { $sum: "$fats" }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 30 }
        ]);

        res.status(200).json({
            success: true,
            days: dailyTotals.map((d) => ({
                date: d._id,
                calories: +d.calories.toFixed(1),
                protein: +d.protein.toFixed(1),
                carbs: +d.carbs.toFixed(1),
                fats: +d.fats.toFixed(1)
            }))
        });
    } catch (error) {
        console.error("getNutritionHistory error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch history" });
    }
};

// DELETE /api/nutrition/:id
const deleteNutritionLog = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid log id" });
        }

        const log = await Nutrition.findById(id);
        if (!log) {
            return res.status(404).json({ success: false, message: "Log not found" });
        }

        if (log.userId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ success: false, message: "Not allowed" });
        }

        await Nutrition.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Log deleted" });
    } catch (error) {
        console.error("deleteNutritionLog error:", error);
        res.status(500).json({ success: false, message: "Failed to delete log" });
    }
};

module.exports = {
    logMeal,
    getTodayNutrition,
    getNutritionHistory,
    deleteNutritionLog
};