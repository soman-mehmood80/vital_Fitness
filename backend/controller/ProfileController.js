const User = require("../model/User");
const cloudinary = require("../config/cloudinary");

const safeUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    profileImage: user.profileImage,
    gender: user.gender,
    height: user.height,
    dateOfBirth: user.dateOfBirth,
    fitnessGoal: user.fitnessGoal,
    activityLevel: user.activityLevel,
    waterGoal: user.waterGoal,
    sleepGoal: user.sleepGoal,
    stepGoal: user.stepGoal,
    preferences: user.preferences,
    streak: user.streak,
    achievements: user.achievements,
});

// GET /auth/profile
const myProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.status(200).json({ success: true, user: safeUser(user) });
    } catch (error) {
        console.error("myProfile error:", error);
        return res.status(500).json({ success: false, message: "Unable to fetch profile" });
    }
};

// PUT /auth/profile
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const {
            name,
            email,
            dateOfBirth,
            gender,
            height,
            fitnessGoal,
            activityLevel,
            waterGoal,
            sleepGoal,
            stepGoal,
            preferences,
        } = req.body;

        let emailChanged = false;

        // --- Basic fields ---
        if (name !== undefined) {
            const trimmedName = String(name).trim();
            if (!trimmedName) {
                return res.status(400).json({ success: false, message: "Name cannot be empty" });
            }
            user.name = trimmedName;
        }

        // --- Email change: reset verification ---
        if (email !== undefined) {
            const normalizedEmail = String(email).trim().toLowerCase();
            if (normalizedEmail && normalizedEmail !== user.email) {
                const existingUser = await User.findOne({
                    email: normalizedEmail,
                    _id: { $ne: user._id },
                });
                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        message: "Email already exists",
                    });
                }
                user.email = normalizedEmail;
                user.emailVerified = false;
                emailChanged = true;
            }
        }

        // --- Date of birth validation ---
        if (dateOfBirth !== undefined && dateOfBirth !== "" && dateOfBirth !== null) {
            const parsedDob = new Date(dateOfBirth);
            if (Number.isNaN(parsedDob.getTime()) || parsedDob > new Date()) {
                return res.status(400).json({
                    success: false,
                    message: "Date of birth must be a valid past date",
                });
            }
            user.dateOfBirth = parsedDob;
        }

        if (gender !== undefined && gender !== "") user.gender = gender;

        // --- Height validation (NaN & empty-string safe) ---
        if (height !== undefined && height !== "" && height !== null) {
            const parsedHeight = Number(height);
            if (Number.isNaN(parsedHeight) || parsedHeight <= 0 || parsedHeight > 300) {
                return res.status(400).json({
                    success: false,
                    message: "Height must be a valid positive number",
                });
            }
            user.height = parsedHeight;
        }

        if (fitnessGoal !== undefined && fitnessGoal !== "") user.fitnessGoal = fitnessGoal;
        if (activityLevel !== undefined && activityLevel !== "") user.activityLevel = activityLevel;

        // --- Goals validation ---
        if (waterGoal !== undefined && waterGoal !== "" && waterGoal !== null) {
            const parsedWater = Number(waterGoal);
            if (Number.isNaN(parsedWater) || parsedWater <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Water goal must be a valid positive number",
                });
            }
            user.waterGoal = parsedWater;
        }

        if (sleepGoal !== undefined && sleepGoal !== "" && sleepGoal !== null) {
            const parsedSleep = Number(sleepGoal);
            if (Number.isNaN(parsedSleep) || parsedSleep <= 0 || parsedSleep > 24) {
                return res.status(400).json({
                    success: false,
                    message: "Sleep goal must be between 1 and 24 hours",
                });
            }
            user.sleepGoal = parsedSleep;
        }

        if (stepGoal !== undefined && stepGoal !== "" && stepGoal !== null) {
            const parsedSteps = Number(stepGoal);
            if (Number.isNaN(parsedSteps) || parsedSteps <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Step goal must be a valid positive number",
                });
            }
            user.stepGoal = parsedSteps;
        }

        // --- Preferences (theme + notifications) ---
        if (preferences !== undefined && typeof preferences === "object" && preferences !== null) {
            if (!user.preferences) user.preferences = {};

            if (preferences.theme !== undefined) {
                if (!["dark", "light"].includes(preferences.theme)) {
                    return res.status(400).json({
                        success: false,
                        message: "Theme must be 'dark' or 'light'",
                    });
                }
                user.preferences.theme = preferences.theme;
            }
            if (preferences.notifications !== undefined) {
                user.preferences.notifications = Boolean(preferences.notifications);
            }
        }

        // --- Profile Image (Cloudinary) ---
        if (req.file && req.file.path) {
            if (user.profileImagePublicId) {
                try {
                    await cloudinary.uploader.destroy(user.profileImagePublicId);
                } catch (err) {
                    console.error("Cloudinary delete failed:", err.message);
                }
            }
            user.profileImage = req.file.path;
            user.profileImagePublicId = req.file.filename;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: emailChanged
                ? "Profile updated. Please verify your new email address."
                : "Profile updated successfully",
            user: safeUser(user),
        });
    } catch (error) {
        console.error("updateProfile error:", error);
        return res.status(500).json({
            success: false,
            message: "Profile update failed",
        });
    }
};

// GET /auth/users (admin only)
const allUsers = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

        const [users, total] = await Promise.all([
            User.find()
                .select("_id name email role emailVerified createdAt")
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments(),
        ]);

        return res.status(200).json({
            success: true,
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("allUsers error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch users",
        });
    }
};

module.exports = { myProfile, updateProfile, allUsers };