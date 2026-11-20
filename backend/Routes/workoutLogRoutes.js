const express = require("express");
const router = express.Router();

const controller = require("../controller/WorkoutLogController");
const authMiddleware = require("../Middleware/authMiddleware");
const { objectIdParam, completeWorkoutValidation, workoutListQuery } = require("../Middleware/WorkoutValidation");

router.use(authMiddleware);

router.post("/complete", completeWorkoutValidation, controller.completeWorkout);
router.get("/my-history", workoutListQuery, controller.getMyWorkoutHistory);
router.delete("/:id", objectIdParam, controller.deleteWorkoutLog);

module.exports = router;