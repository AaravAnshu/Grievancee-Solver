const mongoose = require("mongoose");

const CATEGORIES = ["ACADEMIC", "TECHNICAL", "INFRASTRUCTURE", "HOSTEL", "LIBRARY", "HARASSMENT", "OTHER"];
const STATUSES = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"];

const forwardEntrySchema = new mongoose.Schema(
  {
    fromRole: String,
    toRole: String,
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    remarks: String,
    by: String, // name of the admin who forwarded it
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    subCategory: { type: String, default: null },
    location: { type: String, default: null },
    status: { type: String, enum: STATUSES, default: "SUBMITTED" },

    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedRole: { type: String, default: null },

    confidential: { type: Boolean, default: false },
    routingReason: { type: String, default: null },
    forwardHistory: { type: [forwardEntrySchema], default: [] },

    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.STATUSES = STATUSES;
