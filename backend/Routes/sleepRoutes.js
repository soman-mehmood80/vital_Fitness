const express = require("express");
const router = express.Router();
const controller = require("../controller/SleepController");
const authMiddleware = require("../Middleware/authMiddleware");

router.use(authMiddleware);

router.get("/today", controller.getTodaySleep);
router.get("/history", controller.getSleepHistory); // 🚨 Naya Route
router.post("/", controller.logSleep);

module.exports = router;