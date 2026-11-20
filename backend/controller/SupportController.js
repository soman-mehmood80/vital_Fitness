const SupportTicket = require("../model/SupportTicket");

// POST /api/support
const createTicket = async (req, res) => {
    try {
        const { subject, message } = req.body;
        if (!subject || !message) return res.status(400).json({ success: false, message: "Subject and message required" });

        const ticket = await SupportTicket.create({
            userId: req.user.userId,
            subject,
            message
        });
        res.status(201).json({ success: true, message: "Ticket created", ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create ticket" });
    }
};

// GET /api/support/my
const getMyTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ userId: req.user.userId }).sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch tickets" });
    }
};

// GET /api/support/admin/all
const getAllTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find()
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({ success: true, tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch tickets" });
    }
};

// PUT /api/support/:id/reply
const replyToTicket = async (req, res) => {
    try {
        const { status, adminReply } = req.body;
        const updateData = {};
        if (status) updateData.status = status;
        if (adminReply !== undefined) updateData.adminReply = adminReply;

        await SupportTicket.findByIdAndUpdate(req.params.id, updateData);
        res.status(200).json({ success: true, message: "Ticket updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update ticket" });
    }
};

module.exports = { createTicket, getMyTickets, getAllTickets, replyToTicket };