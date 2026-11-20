const express = require("express");
const router = express.Router();
const controller = require("../controller/StepController");
const authMiddleware = require("../Middleware/authMiddleware");

router.use(authMiddleware);
router.post("/add", controller.addSteps);
router.get("/today", controller.getTodaySteps);
router.get("/history", controller.getStepHistory); // ✅ NEW

module.exports = router;