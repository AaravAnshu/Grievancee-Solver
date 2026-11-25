const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function list(req, res) {
  const users = await User.find({}).sort({ role: 1, name: 1 });
  res.json(users.map((u) => u.toSafeJSON()));
}

// Only staff (non-STUDENT) accounts can be created here - Admin uses this to
// onboard Coordinators, Technical Dept, Wardens, Library staff, HOD, etc.
async function create(req, res) {
  const { name, email, password, role, department, location } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password and role are required" });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(400).json({ error: "Email already registered" });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hash,
    role,
    department: department || null,
    location: location || null,
  });
  res.json(user.toSafeJSON());
}

// Lightweight list for populating "forward to" dropdowns, filtered by role.
async function byRole(req, res) {
  const users = await User.find({ role: req.params.role }).select("name email role location");
  res.json(users.map((u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, location: u.location })));
}

module.exports = { list, create, byRole };
