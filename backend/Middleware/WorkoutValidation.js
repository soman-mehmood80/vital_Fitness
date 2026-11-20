const { body, param, query, validationResult } = require("express-validator");

const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }
    next();
};

const objectIdParam = [
    param("id").isMongoId().withMessage("Invalid id"),
    handleValidation
];

const createWorkoutValidation = [
    body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 120 }),
    body("description").notEmpty().withMessage("Description is required"),
    body("category").isIn(["Cardio", "Strength", "Yoga", "Flexibility", "Other"]).withMessage("Invalid category"),
    body("difficulty").optional().isIn(["Beginner", "Intermediate", "Advanced"]),
    body("duration").isInt({ min: 1, max: 600 }).withMessage("Duration must be between 1 and 600 minutes"),
    body("videoType").optional().isIn(["cloudinary", "youtube", "none"]),
    handleValidation
];

const completeWorkoutValidation = [
    body("workoutId").isMongoId().withMessage("Invalid workout id"),
    body("duration").isInt({ min: 1 }).withMessage("Duration must be at least 1"),
    body("caloriesBurned").optional().isInt({ min: 0 }),
    body("completedSets").optional().isInt({ min: 0 }),
    body("completedReps").optional().isInt({ min: 0 }),
    body("notes").optional().isLength({ max: 500 }),
    handleValidation
];

const workoutListQuery = [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
    query("category").optional().isIn(["Cardio", "Strength", "Yoga", "Flexibility", "Other"]),
    query("difficulty").optional().isIn(["Beginner", "Intermediate", "Advanced"]),
    handleValidation
];

module.exports = { objectIdParam, createWorkoutValidation, completeWorkoutValidation, workoutListQuery };