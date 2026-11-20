const express = require("express");
const router = express.Router();

const controller = require("../controller/DashboardController");
const authMiddleware = require("../Middleware/authMiddleware");

router.use(authMiddleware);

router.get("/summary", controller.getDashboardSummary);
router.post("/quick-workout", controller.logQuickWorkout);
router.put("/habits", controller.saveDailyHabits);

module.exports = router;