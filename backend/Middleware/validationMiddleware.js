const { body, validationResult } = require("express-validator");

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

const strongPassword = (field) =>
    body(field)
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/[a-z]/)
        .withMessage("Password must contain a lowercase letter")
        .matches(/[A-Z]/)
        .withMessage("Password must contain an uppercase letter")
        .matches(/[0-9]/)
        .withMessage("Password must contain a number")
        .matches(/[^A-Za-z0-9]/)
        .withMessage("Password must contain a special character");

const signupValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 2, max: 60 })
        .withMessage("Name must be between 2 and 60 characters"),

    body("email")
        .trim()
        .isEmail()
        .withMessage("Enter a valid email"),

    strongPassword("password"),

    handleValidation
];

const loginValidation = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Enter a valid email"),

    body("password")
        .notEmpty()
        .withMessage("Password is required"),

    handleValidation
];

const emailValidation = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Enter a valid email"),

    handleValidation
];

const resetPasswordValidation = [
    body("token")
        .notEmpty()
        .withMessage("Reset token is required"),

    strongPassword("password"),

    handleValidation
];

const changePasswordValidation = [
    body("currentPassword")
        .notEmpty()
        .withMessage("Current password is required"),

    strongPassword("newPassword"),

    body("newPassword")
        .custom((value, { req }) => value !== req.body.currentPassword)
        .withMessage("New password must be different"),

    handleValidation
];

const verificationValidation = [
    body("token")
        .notEmpty()
        .withMessage("Verification token is required"),

    handleValidation
];

// NEW — used by PUT /profile
const updateProfileValidation = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 60 })
        .withMessage("Name must be between 2 and 60 characters"),

    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Enter a valid email"),

    body("dateOfBirth")
        .optional({ nullable: true })
        .custom((value) => {
            if (value === "" || value === null) return true;
            const d = new Date(value);
            if (isNaN(d.getTime())) throw new Error("Invalid date of birth");
            return true;
        }),

    body("height")
        .optional({ nullable: true })
        .custom((value) => {
            if (value === "" || value === null) return true;
            const n = Number(value);
            if (Number.isNaN(n) || n < 50 || n > 300) {
                throw new Error("Height must be a number between 50 and 300");
            }
            return true;
        }),

    body("gender")
        .optional()
        .isString()
        .withMessage("Gender must be a string"),

    body("fitnessGoal")
        .optional()
        .isString()
        .withMessage("Fitness goal must be a string"),

    body("activityLevel")
        .optional()
        .isString()
        .withMessage("Activity level must be a string"),

    body("preferences")
        .optional()
        .isObject()
        .withMessage("Preferences must be an object"),

    body("preferences.theme")
        .optional()
        .isString()
        .withMessage("Theme must be a string"),

    body("preferences.notifications")
        .optional()
        .isBoolean()
        .withMessage("Notifications must be a boolean"),

    handleValidation
];

module.exports = {
    signupValidation,
    loginValidation,
    emailValidation,
    resetPasswordValidation,
    changePasswordValidation,
    verificationValidation,
    updateProfileValidation
};