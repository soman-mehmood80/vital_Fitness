const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        profileImage: {
            type: String,
            default: ""
        },

        profileImagePublicId: {
            type: String,
            default: ""
        },

        dateOfBirth: {
            type: Date,
            default: null
        },

        gender: {
            type: String,
            default: "Prefer not to say"
        },

        height: {
            type: Number,
            default: null
        },

        fitnessGoal: {
            type: String,
            default: "General Fitness"
        },

        activityLevel: {
            type: String,
            default: "Beginner"
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        preferences: {
            theme: {
                type: String,
                default: "dark"
            },
            notifications: {
                type: Boolean,
                default: true
            }
        },

        // Authentication security fields
        emailVerified: {
            type: Boolean,
            default: false
        },

        emailVerificationTokenHash: {
            type: String,
            select: false
        },

        emailVerificationExpires: {
            type: Date,
            select: false
        },

        passwordResetTokenHash: {
            type: String,
            select: false
        },

        passwordResetExpires: {
            type: Date,
            select: false
        },

        loginAttempts: {
            type: Number,
            default: 0
        },

        lockUntil: {
            type: Date,
            default: null
        },

        tokenVersion: {
            type: Number,
            default: 0
        },

        lastLogin: {
            type: Date,
            default: null
        },
        stepGoal: { type: Number, default: 10000 },

        // --- Phase 8: Goals ---
        waterGoal: { type: Number, default: 2500 },
        sleepGoal: { type: Number, default: 8 },

        // --- Daily Dashboard Checklist ---
        dailyHabits: {
            date: { type: String, default: "" },
            items: [
                {
                    id: { type: String },
                    label: { type: String },
                    done: { type: Boolean, default: false }
                }
            ]
        },

        // --- Phase 10: Achievements ---
        streak: { type: Number, default: 0 },
        lastActiveDate: { type: Date, default: null },
        achievements: [{ type: String }]
    },
    {
        timestamps: true
    }
);

userSchema.index({ role: 1 });
userSchema.index({ lastLogin: -1 });

module.exports = mongoose.model("User", userSchema);