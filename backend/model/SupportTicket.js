const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },
        status: {
            type: String,
            enum: ["Open", "In Progress", "Closed"],
            default: "Open"
        },
        adminReply: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);