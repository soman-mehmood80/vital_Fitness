const express = require("express");
const router = express.Router();

const controller = require("../controller/notificationController");
const authMiddleware = require("../Middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", controller.getMyNotifications);
router.put("/read-all", controller.markAllAsRead);
router.delete("/:id", controller.deleteNotification);

module.exports = router;