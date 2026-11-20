const mongoose = require("mongoose");
const FoodItem = require("../model/FoodItem");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/food-items
const getFoodItems = async (req, res) => {
    try {
        const { search, category, page = 1, limit = 20, all } = req.query;

        const filter = {};
        if (all !== "true") {
            filter.isActive = true;
        }

        if (category) filter.category = category;
        if (search && search.trim()) {
            filter.name = { $regex: search.trim(), $options: "i" };
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(1000, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const [items, total] = await Promise.all([
            FoodItem.find(filter)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            FoodItem.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
            items
        });
    } catch (error) {
        console.error("getFoodItems error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch food items" });
    }
};

// POST /api/food-items (admin)
const createFoodItem = async (req, res) => {
    try {
        const {
            name, category, servingSize, servingUnit,
            calories, protein, carbs, fats
        } = req.body;

        if (!name || !servingSize || calories === undefined) {
            return res.status(400).json({
                success: false,
                message: "Name, servingSize and calories are required"
            });
        }

        const item = await FoodItem.create({
            name: name.trim(),
            category: category || "Other",
            servingSize: Number(servingSize),
            servingUnit: servingUnit || "g",
            calories: Number(calories),
            protein: Number(protein) || 0,
            carbs: Number(carbs) || 0,
            fats: Number(fats) || 0,
            createdBy: req.user.userId
        });

        res.status(201).json({ success: true, message: "Food item created", item });
    } catch (error) {
        console.error("createFoodItem error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to create food item" });
    }
};

// PUT /api/food-items/:id (admin)
const updateFoodItem = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid id" });

        const item = await FoodItem.findById(id);
        if (!item) return res.status(404).json({ success: false, message: "Food item not found" });

        const allowed = [
            "name", "category", "servingSize", "servingUnit",
            "calories", "protein", "carbs", "fats", "isActive"
        ];

        allowed.forEach((key) => {
            if (req.body[key] !== undefined) item[key] = req.body[key];
        });

        await item.save();
        res.status(200).json({ success: true, message: "Food item updated", item });
    } catch (error) {
        console.error("updateFoodItem error:", error);
        res.status(500).json({ success: false, message: "Failed to update food item" });
    }
};

// PUT /api/food-items/:id/restore (admin)
const restoreFoodItem = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid id" });

        const item = await FoodItem.findById(id);
        if (!item) return res.status(404).json({ success: false, message: "Food item not found" });

        item.isActive = true;
        await item.save();

        res.status(200).json({ success: true, message: "Food item restored", item });
    } catch (error) {
        console.error("restoreFoodItem error:", error);
        res.status(500).json({ success: false, message: "Failed to restore food item" });
    }
};

// DELETE /api/food-items/:id (admin — soft delete)
const deleteFoodItem = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid id" });

        const item = await FoodItem.findById(id);
        if (!item) return res.status(404).json({ success: false, message: "Food item not found" });

        item.isActive = false;
        await item.save();

        res.status(200).json({ success: true, message: "Food item deleted" });
    } catch (error) {
        console.error("deleteFoodItem error:", error);
        res.status(500).json({ success: false, message: "Failed to delete food item" });
    }
};

module.exports = {
    getFoodItems,
    createFoodItem,
    updateFoodItem,
    restoreFoodItem,
    deleteFoodItem
};