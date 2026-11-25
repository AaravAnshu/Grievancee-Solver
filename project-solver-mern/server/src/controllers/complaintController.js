const Complaint = require("../models/Complaint");
const ComplaintLog = require("../models/ComplaintLog");
const User = require("../models/User");
const { routeComplaint } = require("../services/routingService");

async function addLog(complaintId, action, actorName, remarks) {
  await ComplaintLog.create({ complaint: complaintId, action, actorName, remarks });
}

function shape(c) {
  return {
    id: c._id,
    title: c.title,
    description: c.description,
    category: c.category,
    subCategory: c.subCategory,
    location: c.location,
    status: c.status,
    submittedBy: c.submittedBy ? { id: c.submittedBy._id, name: c.submittedBy.name } : null,
    assignedTo: c.assignedTo ? { id: c.assignedTo._id, name: c.assignedTo.name } : null,
    assignedRole: c.assignedRole,
    confidential: c.confidential,
    routingReason: c.routingReason,
    forwardHistory: c.forwardHistory,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    resolvedAt: c.resolvedAt,
  };
}

async function submit(req, res) {
  const { title, description, category, subCategory, location } = req.body;
  if (!title || !description || !category) {
    return res.status(400).json({ error: "title, description and category are required" });
  }

  let complaint = await Complaint.create({
    title,
    description,
    category,
    subCategory: subCategory || null,
    location: location || null,
    submittedBy: req.user._id,
    status: "SUBMITTED",
  });
  await addLog(complaint._id, "SUBMITTED", req.user.name, `Complaint filed by ${req.user.name}`);

  const decision = await routeComplaint(complaint);
  complaint.assignedRole = decision.role;
  complaint.assignedTo = decision.user ? decision.user._id : null;
  complaint.confidential = decision.confidential;
  complaint.routingReason = decision.reason;
  complaint.status = "ASSIGNED";
  await complaint.save();

  await addLog(
    complaint._id,
    "ROUTED",
    "system",
    decision.reason + (decision.user ? ` (assigned to ${decision.user.name})` : " (unassigned - no staff on file yet)")
  );

  complaint = await complaint.populate(["submittedBy", "assignedTo"]);
  res.json(shape(complaint));
}

async function my(req, res) {
  const list = await Complaint.find({ submittedBy: req.user._id }).populate(["submittedBy", "assignedTo"]).sort({ createdAt: -1 });
  res.json(list.map(shape));
}

async function queue(req, res) {
  const list = await Complaint.find({ assignedTo: req.user._id }).populate(["submittedBy", "assignedTo"]).sort({ createdAt: -1 });
  res.json(list.map(shape));
}

async function all(req, res) {
  if (!["ADMIN", "HOD"].includes(req.user.role)) {
    return res.status(403).json({ error: "Admin/HOD only" });
  }
  const list = await Complaint.find({}).populate(["submittedBy", "assignedTo"]).sort({ createdAt: -1 });
  res.json(list.map(shape));
}

async function timeline(req, res) {
  const logs = await ComplaintLog.find({ complaint: req.params.id }).sort({ timestamp: 1 });
  res.json(logs.map((l) => ({ action: l.action, actor: l.actorName, remarks: l.remarks, timestamp: l.timestamp })));
}

async function updateStatus(req, res) {
  const { status, remarks } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ error: "Complaint not found" });

  complaint.status = status;
  if (["RESOLVED", "CLOSED"].includes(status)) complaint.resolvedAt = new Date();
  await complaint.save();
  await addLog(complaint._id, status, req.user.name, remarks || `Marked ${status} by ${req.user.name}`);

  const populated = await complaint.populate(["submittedBy", "assignedTo"]);
  res.json(shape(populated));
}

// Admin-only: manually re-route a complaint to a different role/person,
// overriding whatever the routing engine originally decided.
async function forward(req, res) {
  const { role, userId, remarks } = req.body;
  if (!role) return res.status(400).json({ error: "role is required" });

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ error: "Complaint not found" });

  let targetUser = null;
  if (userId) {
    targetUser = await User.findById(userId);
    if (!targetUser || targetUser.role !== role) {
      return res.status(400).json({ error: "Selected user does not hold the chosen role" });
    }
  } else {
    targetUser = await User.findOne({ role });
  }

  const fromRole = complaint.assignedRole;
  complaint.forwardHistory.push({
    fromRole,
    toRole: role,
    toUser: targetUser ? targetUser._id : null,
    remarks: remarks || "",
    by: req.user.name,
  });
  complaint.assignedRole = role;
  complaint.assignedTo = targetUser ? targetUser._id : null;
  if (complaint.status === "SUBMITTED") complaint.status = "ASSIGNED";
  await complaint.save();

  await addLog(
    complaint._id,
    "FORWARDED",
    req.user.name,
    `Forwarded from ${fromRole || "unassigned"} to ${role}${targetUser ? " (" + targetUser.name + ")" : ""}${remarks ? " - " + remarks : ""}`
  );

  const populated = await complaint.populate(["submittedBy", "assignedTo"]);
  res.json(shape(populated));
}

module.exports = { submit, my, queue, all, timeline, updateStatus, forward };
