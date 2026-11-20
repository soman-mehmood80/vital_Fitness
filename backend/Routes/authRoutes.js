const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const {
    signup,
    login,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    changePassword,
    logoutAll
} = require("../controller/authController");

const {
    myProfile,
    updateProfile,
    allUsers
} = require("../controller/ProfileController");

const authMiddleware = require("../Middleware/authMiddleware");
const adminOnly = require("../Middleware/adminMiddleware");
const upload = require("../Middleware/uploadMiddleware");

const {
    signupValidation,
    loginValidation,
    emailValidation,
    resetPasswordValidation,
    changePasswordValidation,
    verificationValidation,
    updateProfileValidation
} = require("../Middleware/validationMiddleware");

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Try again later."
    }
});

const authActionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many signup attempts. Try again later."
    }
});

// Signup and login
router.post("/signup", signupLimiter, signupValidation, signup);

router.post("/login", loginLimiter, loginValidation, login);

// Password recovery
router.post("/forgot-password", authActionLimiter, emailValidation, forgotPassword);
router.post("/reset-password", authActionLimiter, resetPasswordValidation, resetPassword);

// Email verification
router.post("/verify-email", authActionLimiter, verificationValidation, verifyEmail);
router.post("/resend-verification", authActionLimiter, emailValidation, resendVerification);

// Protected account routes
router.post("/change-password", authMiddleware, changePasswordValidation, changePassword);
router.post("/logout-all", authMiddleware, logoutAll);

// Profile routes
router.get("/profile", authMiddleware, myProfile);
router.put(
    "/profile",
    authMiddleware,
    upload.single("profileImage"),
    updateProfileValidation,
    updateProfile
);

// Admin route
router.get("/users", authMiddleware, adminOnly, allUsers);

module.exports = router;