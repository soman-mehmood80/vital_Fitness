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



if (!process.env.SECRET_KEY || process.env.SECRET_KEY.length < 32) {
    console.error("SECRET_KEY missing or too short (min 32 chars)");
    process.exit(1);
}
if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing");
    process.exit(1);
}

const app = express();

// If behind nginx / Render / Heroku, enable this so rate-limit uses real IP.
// Comment out if running directly without a proxy.
app.set("trust proxy", 1);

app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to VitalFit Backend API"
    });
});


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






// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Global error handler (multer / multer-storage-cloudinary errors land here)
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`VitalFit Server Running on Port ${PORT}`);
            console.log(`API URL: http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();