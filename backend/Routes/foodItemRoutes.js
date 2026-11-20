const express = require("express");
const router = express.Router();

const controller = require("../controller/FoodItemController");
const authMiddleware = require("../Middleware/authMiddleware");
const adminMiddleware = require("../Middleware/adminMiddleware");
const { objectIdParam, foodItemValidation } = require("../Middleware/nutritionValidation");

router.use(authMiddleware);

// Any logged-in user can browse the catalog
router.get("/", controller.getFoodItems);

// Admin only — create/update/restore/delete
router.post("/", adminMiddleware, foodItemValidation, controller.createFoodItem);
router.put("/:id/restore", adminMiddleware, objectIdParam, controller.restoreFoodItem);
router.put("/:id", adminMiddleware, objectIdParam, foodItemValidation, controller.updateFoodItem);
router.delete("/:id", adminMiddleware, objectIdParam, controller.deleteFoodItem);

module.exports = router;