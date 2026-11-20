const express = require("express");
const router = express.Router();
const controller = require("../controller/WaterController");
const authMiddleware = require("../Middleware/authMiddleware");

router.use(authMiddleware);
router.post("/", controller.logWater);
router.get("/today", controller.getTodayWater);
router.delete("/:id", controller.deleteWaterLog);

module.exports = router;