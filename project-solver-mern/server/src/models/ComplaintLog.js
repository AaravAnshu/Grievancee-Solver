const mongoose = require("mongoose");

const complaintLogSchema = new mongoose.Schema(
  {
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", required: true },
    action: { type: String, required: true }, // SUBMITTED, ROUTED, FORWARDED, STATUS_CHANGED, ESCALATED...
    actorName: { type: String, default: "system" },
    remarks: { type: String, default: "" },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

module.exports = mongoose.model("ComplaintLog", complaintLogSchema);
