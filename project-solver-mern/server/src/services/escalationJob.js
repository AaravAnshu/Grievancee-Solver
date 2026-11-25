const Complaint = require("../models/Complaint");
const ComplaintLog = require("../models/ComplaintLog");
const User = require("../models/User");
const { ESCALATION_MAP } = require("./routingService");

const THRESHOLD_HOURS = Number(process.env.ESCALATION_THRESHOLD_HOURS || 48);

async function escalateStaleComplaints() {
  const cutoff = new Date(Date.now() - THRESHOLD_HOURS * 60 * 60 * 1000);
  const stale = await Complaint.find({
    status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
    updatedAt: { $lt: cutoff },
  });

  for (const complaint of stale) {
    const nextRole = ESCALATION_MAP[complaint.assignedRole];
    if (!nextRole) continue; // already at the top of the chain (e.g. ADMIN)

    let nextStaff = null;
    if (complaint.location) nextStaff = await User.findOne({ role: nextRole, location: complaint.location });
    if (!nextStaff) nextStaff = await User.findOne({ role: nextRole });

    const fromRole = complaint.assignedRole;
    complaint.assignedRole = nextRole;
    complaint.assignedTo = nextStaff ? nextStaff._id : null;
    complaint.status = "ESCALATED";
    await complaint.save();

    await ComplaintLog.create({
      complaint: complaint._id,
      action: "ESCALATED",
      actorName: "system",
      remarks: `No action within ${THRESHOLD_HOURS}h - escalated from ${fromRole} to ${nextRole}${nextStaff ? " (" + nextStaff.name + ")" : ""}`,
    });
  }

  if (stale.length) console.log(`Escalation job: bumped ${stale.length} stale complaint(s).`);
}

function startEscalationJob() {
  // Runs once an hour. Shrink ESCALATION_THRESHOLD_HOURS in .env to a few
  // minutes while demoing to watch it trigger quickly.
  setInterval(() => {
    escalateStaleComplaints().catch((err) => console.error("Escalation job failed:", err.message));
  }, 60 * 60 * 1000);
}

module.exports = { startEscalationJob, escalateStaleComplaints };
