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

const foodItemValidation = [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
    body("servingSize").isFloat({ min: 1 }).withMessage("Serving size must be >= 1"),
    body("calories").isFloat({ min: 0 }).withMessage("Calories required"),
    body("protein").optional().isFloat({ min: 0 }),
    body("carbs").optional().isFloat({ min: 0 }),
    body("fats").optional().isFloat({ min: 0 }),
    body("category").optional().isIn([
        "Protein", "Carbohydrate", "Fat", "Vegetable",
        "Fruit", "Dairy", "Beverage", "Snack", "Other"
    ]),
    handleValidation
];

const logMealValidation = [
    body("mealType")
        .isIn(["Breakfast", "Lunch", "Dinner", "Snack"])
        .withMessage("Invalid meal type"),
    body("quantity").isFloat({ min: 0.1 }).withMessage("Quantity must be > 0"),
    body("foodItemId").optional().isMongoId(),
    body("notes").optional().isLength({ max: 200 }),
    handleValidation
];

const historyQuery = [
    query("start").optional().isISO8601(),
    query("end").optional().isISO8601(),
    handleValidation
];

module.exports = {
    objectIdParam,
    foodItemValidation,
    logMealValidation,
    historyQuery
};