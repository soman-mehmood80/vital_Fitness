const express = require("express");
const router = express.Router();
const controller = require("../controller/FeedbackController");
const authMiddleware = require("../Middleware/authMiddleware");
const adminMiddleware = require("../Middleware/adminMiddleware");

router.use(authMiddleware);
router.post("/", controller.submitFeedback);

// Admin routes
router.get("/admin/all", adminMiddleware, controller.getAllFeedback);
router.put("/:id/status", adminMiddleware, controller.updateFeedbackStatus);

module.exports = router;