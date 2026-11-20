const User = require("../model/User");
const Workout = require("../model/Workout");
const WorkoutLog = require("../model/WorkoutLog");
const Nutrition = require("../model/Nutrition");
const Progress = require("../model/Progress");
const WaterLog = require("../model/WaterLog");
const SleepLog = require("../model/SleepLog");
const StepLog = require("../model/StepLog");
const cloudinary = require("../config/cloudinary");
const bcrypt = require("bcrypt");

// 1. GET PLATFORM STATS (unchanged - already good)
const getPlatformStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalWorkouts,
            totalWorkoutLogs,
            totalNutritionLogs,
            totalProgressLogs,
            activeUsers30d,
            adminCount
        ] = await Promise.all([
            User.countDocuments(),
            Workout.countDocuments(),
            WorkoutLog.countDocuments(),
            Nutrition.countDocuments(),
            Progress.countDocuments(),
            User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
            User.countDocuments({ role: "admin" })
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers, totalWorkouts, totalWorkoutLogs,
                totalNutritionLogs, totalProgressLogs,
                activeUsers30d, adminCount
            }
        });
    } catch (error) {
        console.error("getPlatformStats error:", error);
        res.status(500).json({ success: false, message: "Failed to load stats" });
    }
};

// 2. GET ALL USERS (unchanged - already good)
const getAllUsers = async (req, res) => {
    try {
        const { search, role, page = 1, limit = 100 } = req.query;
        
        const filter = {};
        if (role) filter.role = role;
        if (search && search.trim()) {
            filter.$or = [
                { name: { $regex: search.trim(), $options: "i" } },
                { email: { $regex: search.trim(), $options: "i" } }
            ];
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("name email role emailVerified profileImage lastLogin createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            User.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
            users
        });
    } catch (error) {
        console.error("getAllUsers error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
};

// 3. UPDATE USER — FIXED
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, name, email, emailVerified } = req.body;

        if (id === req.user.userId.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot change your own role or details here." 
            });
        }

        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const updateData = {};

        // Role — only if valid and actually changing
        const roleChanged = role && role !== existingUser.role;
        if (roleChanged) {
            if (!["user", "admin"].includes(role)) {
                return res.status(400).json({ success: false, message: "Invalid role" });
            }
            updateData.role = role;
        }

        if (name) updateData.name = name.trim();
        if (emailVerified !== undefined) updateData.emailVerified = emailVerified;

        if (email) {
            const normalizedEmail = email.trim().toLowerCase();
            if (normalizedEmail !== existingUser.email) {
                const emailTaken = await User.findOne({ 
                    email: normalizedEmail, 
                    _id: { $ne: id } 
                });
                if (emailTaken) {
                    return res.status(409).json({ 
                        success: false, 
                        message: "Email already in use by another user" 
                    });
                }
                updateData.email = normalizedEmail;
                updateData.emailVerified = false; 
            }
        }

       
        if (roleChanged) {
            updateData.$inc = { tokenVersion: 1 };
        }

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select("name email role emailVerified profileImage lastLogin createdAt");

        res.status(200).json({ 
            success: true, 
            message: "User updated successfully", 
            user 
        });
    } catch (error) {
        console.error("updateUser error:", error);
        res.status(500).json({ success: false, message: "Failed to update user" });
    }
};


const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Name, email, and password are required" 
            });
        }

        if (password.length < 8) {
            return res.status(400).json({ 
                success: false, 
                message: "Password must be at least 8 characters" 
            });
        }

        if (role && !["user", "admin"].includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid role" 
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(409).json({ 
                success: false, 
                message: "Email already registered" 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: role || "user",
            emailVerified: true
        });

        const safeUser = {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            emailVerified: newUser.emailVerified,
            createdAt: newUser.createdAt
        };

        res.status(201).json({ 
            success: true, 
            message: "User created successfully", 
            user: safeUser 
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ 
                success: false, 
                message: "Email already registered" 
            });
        }
        console.error("createUser error:", error);
        res.status(500).json({ success: false, message: "Failed to create user" });
    }
};

// 5. DELETE USER — FIXED (cascade + Cloudinary)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.user.userId.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: "You cannot delete your own account from here." 
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

       
        if (user.profileImagePublicId) {
            try {
                await cloudinary.uploader.destroy(user.profileImagePublicId);
            } catch (err) {
                console.error("Cloudinary delete failed:", err.message);
            }
        }

       
        await Promise.all([
            Workout.deleteMany({ createdBy: id }),
            WorkoutLog.deleteMany({ userId: id }),
            Nutrition.deleteMany({ userId: id }),
            Progress.deleteMany({ userId: id }),
            WaterLog.deleteMany({ userId: id }),
            SleepLog.deleteMany({ userId: id }),
            StepLog.deleteMany({ userId: id })
        ]);

        await User.findByIdAndDelete(id);

        res.status(200).json({ 
            success: true, 
            message: "User and all associated data deleted successfully" 
        });
    } catch (error) {
        console.error("deleteUser error:", error);
        res.status(500).json({ success: false, message: "Failed to delete user" });
    }
};

module.exports = { 
    getPlatformStats, 
    getAllUsers, 
    updateUserRole: updateUser,
    createUser,
    deleteUser
};