const jwt = require("jsonwebtoken");
const User = require("../model/User");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Authentication token required" });
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY);
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }

        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({ success: false, message: "User not found" });

        // 🚨 FIX 1: Verify email before allowing access
        if (!user.emailVerified) {
            return res.status(403).json({ success: false, message: "Please verify your email address to continue." });
        }

        if (decoded.tokenVersion !== user.tokenVersion) {
            return res.status(401).json({ success: false, message: "Session expired. Please login again." });
        }

        req.user = { userId: user._id, role: user.role };
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Auth failed" });
    }
};

module.exports = authMiddleware;