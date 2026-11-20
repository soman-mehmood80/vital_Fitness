const express = require("express");
const router = express.Router();

const controller = require("../controller/workoutController");
const authMiddleware = require("../Middleware/authMiddleware");
const adminMiddleware = require("../Middleware/adminMiddleware");
const upload = require("../Middleware/WorkoutUploadMiddleware");
const {
    objectIdParam,
    createWorkoutValidation,
    workoutListQuery
} = require("../Middleware/WorkoutValidation");

router.use(authMiddleware);

// User
router.get("/", workoutListQuery, controller.getWorkouts);

// Admin Routes (Upload fields fix)
const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]);

router.get("/admin/all", adminMiddleware, controller.getAllWorkouts);
router.post("/", adminMiddleware, uploadFields, createWorkoutValidation, controller.createWorkout);
router.put("/:id", adminMiddleware, objectIdParam, uploadFields, controller.updateWorkout);
router.delete("/:id", adminMiddleware, objectIdParam, controller.deleteWorkout);

// Public (auth)
router.get("/:id", objectIdParam, controller.getWorkoutById);

module.exports = router;