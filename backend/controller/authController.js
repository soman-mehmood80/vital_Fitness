const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../model/User");
const sendEmail = require("../utils/emailService");

const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            role: user.role,
            tokenVersion: user.tokenVersion
        },
        process.env.SECRET_KEY,
        { expiresIn: "1h" }
    );
};

const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

const makeToken = () => crypto.randomBytes(32).toString("hex");

// 🚨 FIX 2: Added missing fields required by Frontend
const safeUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    profileImage: user.profileImage,

    // Profile Fields
    gender: user.gender,
    height: user.height,
    dateOfBirth: user.dateOfBirth, // Added
    fitnessGoal: user.fitnessGoal,
    activityLevel: user.activityLevel,

    // App Preferences & Goals
    preferences: user.preferences, // Added (for Theme settings)
    waterGoal: user.waterGoal,     // Added (for Water Tracker)
    sleepGoal: user.sleepGoal,     // Added (for Sleep Tracker)
    streak: user.streak,           // Added (for Dashboard)
    achievements: user.achievements // Added (for Dashboard)
});


// 1. SIGNUP
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const verificationToken = makeToken();

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            emailVerified: false,
            emailVerificationTokenHash: hashToken(verificationToken),
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        const verificationLink =
            `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        let emailSent = true;

        try {
            await sendEmail({
                to: user.email,
                subject: "Verify your VitalFit account",
                html: `
                    <h2>Welcome to VitalFit!</h2>
                    <p>Hello ${user.name},</p>
                    <p>Please verify your email address using this link:</p>
                    <a href="${verificationLink}">Verify Email</a>
                    <p>This link expires in 24 hours.</p>
                `
            });
        } catch (emailError) {
            emailSent = false;
            console.error("Verification email failed:", emailError.message);
        }

        return res.status(201).json({
            success: true,
            message: emailSent
                ? "Account created. Please check your email to verify your account."
                : "Account created, but verification email could not be sent. Please use resend verification.",
            emailSent
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        console.error("signup error:", error);
        return res.status(500).json({
            success: false,
            message: "Signup failed"
        });
    }
};


// 2. LOGIN
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail })
            .select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(423).json({
                success: false,
                message: "Account temporarily locked. Try again later."
            });
        }

        if (user.lockUntil && user.lockUntil <= Date.now()) {
            user.loginAttempts = 0;
            user.lockUntil = null;
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            user.loginAttempts += 1;

            if (user.loginAttempts >= 5) {
                user.loginAttempts = 0;
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
            }

            await user.save();

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in."
            });
        }

        user.loginAttempts = 0;
        user.lockUntil = null;
        user.lastLogin = new Date();

        await user.save();

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: safeUser(user)
        });

    } catch (error) {
        console.error("login error:", error);
        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};


// 3. FORGOT PASSWORD
const forgotPassword = async (req, res) => {
    try {
        const email = req.body.email.trim().toLowerCase();

        const user = await User.findOne({ email });

        const responseMessage =
            "If an account exists for this email, a reset link will be sent.";

        if (!user) {
            return res.status(200).json({
                success: true,
                message: responseMessage
            });
        }

        const resetToken = makeToken();

        user.passwordResetTokenHash = hashToken(resetToken);
        user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

        await user.save();

        const resetLink =
            `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        try {
            await sendEmail({
                to: user.email,
                subject: "VitalFit Password Reset",
                html: `
                    <h2>Password Reset</h2>
                    <p>Hello ${user.name},</p>
                    <p>Use the link below to reset your password:</p>
                    <a href="${resetLink}">Reset Password</a>
                    <p>This link expires in 15 minutes.</p>
                    <p>If you did not request this, ignore this email.</p>
                `
            });
        } catch (emailError) {
            console.error("Reset email failed:", emailError.message);
        }

        return res.status(200).json({
            success: true,
            message: responseMessage
        });

    } catch (error) {
        console.error("forgotPassword error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to process password reset request"
        });
    }
};


// 4. RESET PASSWORD
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        const user = await User.findOne({
            passwordResetTokenHash: hashToken(token),
            passwordResetExpires: { $gt: new Date() }
        }).select("+passwordResetTokenHash +passwordResetExpires");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Reset link is invalid or expired"
            });
        }

        user.password = await bcrypt.hash(password, 12);

        user.passwordResetTokenHash = undefined;
        user.passwordResetExpires = undefined;

        // Important: Logout from all devices after password reset
        user.tokenVersion += 1;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. Please login again."
        });

    } catch (error) {
        console.error("resetPassword error:", error);
        return res.status(500).json({
            success: false,
            message: "Password reset failed"
        });
    }
};


// 5. VERIFY EMAIL
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        const user = await User.findOne({
            emailVerificationTokenHash: hashToken(token),
            emailVerificationExpires: { $gt: new Date() }
        }).select("+emailVerificationTokenHash +emailVerificationExpires");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Verification link is invalid or expired"
            });
        }

        user.emailVerified = true;
        user.emailVerificationTokenHash = undefined;
        user.emailVerificationExpires = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now login."
        });

    } catch (error) {
        console.error("verifyEmail error:", error);
        return res.status(500).json({
            success: false,
            message: "Email verification failed"
        });
    }
};


// 6. RESEND VERIFICATION EMAIL
const resendVerification = async (req, res) => {
    try {
        const email = req.body.email.trim().toLowerCase();
        const user = await User.findOne({ email });

        const responseMessage =
            "If verification is needed, a new email will be sent.";

        if (!user || user.emailVerified) {
            return res.status(200).json({
                success: true,
                message: responseMessage
            });
        }

        const token = makeToken();

        user.emailVerificationTokenHash = hashToken(token);
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await user.save();

        const link =
            `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

        try {
            await sendEmail({
                to: user.email,
                subject: "VitalFit Email Verification",
                html: `
                    <h2>Verify your VitalFit account</h2>
                    <a href="${link}">Verify Email</a>
                    <p>This link expires in 24 hours.</p>
                `
            });
        } catch (emailError) {
            console.error("Resend verification email failed:", emailError.message);
        }

        return res.status(200).json({
            success: true,
            message: responseMessage
        });

    } catch (error) {
        console.error("resendVerification error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to resend verification email"
        });
    }
};


// 7. CHANGE PASSWORD
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.userId).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const matches = await bcrypt.compare(currentPassword, user.password);

        if (!matches) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        user.tokenVersion += 1; // Logout from other devices

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed. Please login again."
        });

    } catch (error) {
        console.error("changePassword error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to change password"
        });
    }
};


// 8. LOGOUT ALL DEVICES
const logoutAll = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.userId, {
            $inc: { tokenVersion: 1 }
        });

        return res.status(200).json({
            success: true,
            message: "Logged out from all devices successfully"
        });

    } catch (error) {
        console.error("logoutAll error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to logout from all devices"
        });
    }
};


module.exports = {
    signup,
    login,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    changePassword,
    logoutAll
};