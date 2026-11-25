const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken } = require("../middleware/auth");

// Public self-service signup always creates a STUDENT account. Staff
// accounts (Coordinator, Technical Dept, Warden, HOD...) are created by an
// Admin via POST /api/users so students can't grant themselves staff access.
async function register(req, res) {
  const { name, email, password, department, location } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(400).json({ error: "Email already registered" });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hash,
    role: "STUDENT",
    department: department || null,
    location: location || null,
  });
  res.json({ message: "Registered. You can now log in.", user: user.toSafeJSON() });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) return res.status(401).json({ error: "Incorrect email or password" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Incorrect email or password" });

  const token = signToken(user);
  res.json({ token, user: user.toSafeJSON() });
}

async function me(req, res) {
  res.json(req.user.toSafeJSON());
}

module.exports = { register, login, me };
