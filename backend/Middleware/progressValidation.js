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

const addProgressValidation = [
    body("weight").isFloat({ min: 20, max: 500 }).withMessage("Weight must be between 20 and 500 kg"),
    body("bodyFat").optional({ checkFalsy: true }).isFloat({ min: 1, max: 70 }),
    body("muscleMass").optional({ checkFalsy: true }).isFloat({ min: 1, max: 200 }),
    body("notes").optional().isLength({ max: 300 }),
    handleValidation
];

const progressQuery = [
    query("days").optional().isInt({ min: 1, max: 365 }),
    handleValidation
];

module.exports = { objectIdParam, addProgressValidation, progressQuery };