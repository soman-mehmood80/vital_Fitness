const express = require("express");
const router = express.Router();

const controller = require("../controller/NutritionController");
const authMiddleware = require("../Middleware/authMiddleware");
const { objectIdParam, logMealValidation, historyQuery } = require("../Middleware/nutritionValidation");

router.use(authMiddleware);

router.post("/log", logMealValidation, controller.logMeal);
router.get("/today", controller.getTodayNutrition);
router.get("/history", historyQuery, controller.getNutritionHistory);
router.delete("/:id", objectIdParam, controller.deleteNutritionLog);

module.exports = router;