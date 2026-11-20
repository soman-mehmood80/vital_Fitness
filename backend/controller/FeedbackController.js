const Feedback = require("../model/Feedback");

// POST /api/feedback
const submitFeedback = async (req, res) => {
    try {
        const { type, message } = req.body;
        if (!message) return res.status(400).json({ success: false, message: "Message required" });

        const feedback = await Feedback.create({
            userId: req.user.userId,
            type: type || "Feedback",
            message
        });
        res.status(201).json({ success: true, message: "Feedback submitted", feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to submit feedback" });
    }
};

// GET /api/feedback/admin/all
const getAllFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find()
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({ success: true, feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch feedback" });
    }
};

// PUT /api/feedback/:id/status
const updateFeedbackStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["Pending", "Reviewed", "Resolved"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }
        await Feedback.findByIdAndUpdate(req.params.id, { status });
        res.status(200).json({ success: true, message: "Status updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update" });
    }
};

module.exports = { submitFeedback, getAllFeedback, updateFeedbackStatus };