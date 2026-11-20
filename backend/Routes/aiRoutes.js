const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const controller = require("../controller/AiController");
const authMiddleware = require("../Middleware/authMiddleware");

router.use(authMiddleware);

// Deep analysis limit — 5 calls/day per user
const aiLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    limit: 5,
    keyGenerator: (req) => req.user.userId.toString(),
    message: {
        success: false,
        message: "AI analysis limit reached (5/day). Try again tomorrow.",
    },
});

// Interactive chatbot & module limit — 30 messages/day per user
const chatLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    limit: 30,
    keyGenerator: (req) => req.user.userId.toString(),
    message: {
        success: false,
        message: "Daily AI chat limit reached (30/day). Try again tomorrow.",
    },
});

router.get("/analyze", aiLimiter, controller.analyzeProgress);
router.post("/chat", chatLimiter, controller.chatWithCoach);
router.post("/workout-plan", chatLimiter, controller.getWorkoutRecommendation);
router.post("/nutrition-advice", chatLimiter, controller.getNutritionRecommendation);

module.exports = router;