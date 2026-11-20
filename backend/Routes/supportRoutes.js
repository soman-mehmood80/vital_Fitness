const express = require("express");
const router = express.Router();
const controller = require("../controller/SupportController");
const authMiddleware = require("../Middleware/authMiddleware");
const adminMiddleware = require("../Middleware/adminMiddleware");

router.use(authMiddleware);
router.post("/", controller.createTicket);
router.get("/my", controller.getMyTickets);

// Admin routes
router.get("/admin/all", adminMiddleware, controller.getAllTickets);
router.put("/:id/reply", adminMiddleware, controller.replyToTicket);

module.exports = router;