
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const connectDB = require("./config/db");

const authRoutes = require("./Routes/authRoutes");
const workoutRoutes = require("./Routes/workoutRoutes");
const workoutLogRoutes = require("./Routes/workoutLogRoutes");
const foodItemRoutes = require("./Routes/foodItemRoutes");
const nutritionRoutes = require("./Routes/nutritionRoutes");
const progressRoutes = require("./Routes/progressRoutes");
const dashboardRoutes = require("./Routes/dashboardRoutes");
const adminRoutes = require("./Routes/adminRoutes");
const aiRoutes = require("./Routes/aiRoutes");
const feedbackRoutes = require("./Routes/feedbackRoutes");
const supportRoutes = require("./Routes/supportRoutes");
const waterRoutes = require("./Routes/waterRoutes");
const sleepRoutes = require("./Routes/sleepRoutes");
const stepRoutes = require("./Routes/stepRoutes");
const notificationRoutes = require("./Routes/notificationRoutes");

// Environment validation
if (!process.env.SECRET_KEY || process.env.SECRET_KEY.length < 32) {
    console.error("SECRET_KEY missing or too short (min 32 chars)");
    process.exit(1);
}

if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing");
    process.exit(1);
}

const app = express();

app.set("trust proxy", 1);

// Allowed frontend origins
const allowedOrigins = [
    "http://localhost:5173",
    "https://vital-fitness-aio8.vercel.app",
    ...(process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(",").map(url => url.trim())
        : [])
];

// CORS Configuration
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.error("Blocked CORS Origin:", origin);
        return callback(new Error("Not allowed by CORS"));
    },
    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],
    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ],
    credentials: true,
    optionsSuccessStatus: 204
}));

// Security
app.use(helmet());

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Home Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to VitalFit Backend API"
    });
});

// API Routes
app.use("/auth", authRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/workout-logs", workoutLogRoutes);
app.use("/api/food-items", foodItemRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/water", waterRoutes);
app.use("/api/sleep", sleepRoutes);
app.use("/api/steps", stepRoutes);
app.use("/api/notifications", notificationRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

// Server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`VitalFit Server Running on Port ${PORT}`);
            console.log(`Allowed Origins:`, allowedOrigins);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
