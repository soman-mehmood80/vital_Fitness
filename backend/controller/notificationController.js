const Notification = require("../model/Notification");

// GET /api/notifications
const getMyNotifications = async (req, res) => {
    try {
        // Last 20 notifications fetch karein
        const notifications = await Notification.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        // Unread count nikalne ke liye
        const unreadCount = await Notification.countDocuments({
            userId: req.user.userId,
            isRead: false
        });

        res.status(200).json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error("getMyNotifications error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
};

// PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.userId, isRead: false },
            { $set: { isRead: true } }
        );
        res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
        console.error("markAllAsRead error:", error);
        res.status(500).json({ success: false, message: "Failed to update notifications" });
    }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        res.status(200).json({ success: true, message: "Notification deleted" });
    } catch (error) {
        console.error("deleteNotification error:", error);
        res.status(500).json({ success: false, message: "Failed to delete notification" });
    }
};

module.exports = { getMyNotifications, markAllAsRead, deleteNotification };