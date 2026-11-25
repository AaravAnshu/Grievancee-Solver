const RoutingRule = require("../models/RoutingRule");

async function list(req, res) {
  const rules = await RoutingRule.find({}).sort({ createdAt: 1 });
  res.json(rules);
}

async function create(req, res) {
  const { category, subCategory, locationPattern, assignedRole } = req.body;
  if (!category || !assignedRole) return res.status(400).json({ error: "category and assignedRole are required" });
  const rule = await RoutingRule.create({
    category,
    subCategory: subCategory || null,
    locationPattern: locationPattern || null,
    assignedRole,
    active: true,
  });
  res.json(rule);
}

async function update(req, res) {
  const rule = await RoutingRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!rule) return res.status(404).json({ error: "Rule not found" });
  res.json(rule);
}

async function remove(req, res) {
  await RoutingRule.findByIdAndDelete(req.params.id);
  res.json({ message: "Removed" });
}

module.exports = { list, create, update, remove };
