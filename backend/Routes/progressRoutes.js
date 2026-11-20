const express = require("express");
const router = express.Router();

const controller = require("../controller/ProgressController");
const authMiddleware = require("../Middleware/authMiddleware");
const { objectIdParam, addProgressValidation, progressQuery } = require("../Middleware/progressValidation");

router.use(authMiddleware);

router.post("/", addProgressValidation, controller.addProgress);
router.get("/", progressQuery, controller.getProgressHistory);
router.delete("/:id", objectIdParam, controller.deleteProgressLog);

module.exports = router;