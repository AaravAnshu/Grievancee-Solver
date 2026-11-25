require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const RoutingRule = require("./models/RoutingRule");
const Complaint = require("./models/Complaint");
const ComplaintLog = require("./models/ComplaintLog");

const PASSWORD = "password123";

const USERS = [
  { name: "System Admin", email: "admin@solver.edu", role: "ADMIN" },
  { name: "Professor Sammer Dev Sharma", email: "hod.cse@solver.edu", role: "HOD", department: "CSE" },
  { name: "Prof. Mehta (Coordinator, Section A)", email: "coordinator.a@solver.edu", role: "CLASS_COORDINATOR", department: "CSE", location: "SECTION-A" },
  { name: "Ravi (Technical Dept, CSE branch)", email: "tech.cse@solver.edu", role: "TECHNICAL_DEPT", department: "CSE", location: "BRANCH-CSE" },
  { name: "Warden Sharma (Block 2)", email: "warden.block2@solver.edu", role: "HOSTEL_WARDEN", location: "BLOCK-2" },
  { name: "Ms. Iyer (Library)", email: "library@solver.edu", role: "LIBRARY_STAFF" },
  { name: "Facilities Team", email: "maintenance@solver.edu", role: "MAINTENANCE" },
  { name: "Aarav Anshu", email: "student@solver.edu", role: "STUDENT", department: "CSE", location: "SECTION-A" },
];

const RULES = [
  { category: "TECHNICAL", locationPattern: "LAB-", assignedRole: "TECHNICAL_DEPT" },
  { category: "TECHNICAL", assignedRole: "TECHNICAL_DEPT" },
  { category: "ACADEMIC", locationPattern: "SECTION-", assignedRole: "CLASS_COORDINATOR" },
  { category: "ACADEMIC", assignedRole: "ADMIN" },
  { category: "HOSTEL", locationPattern: "BLOCK-", assignedRole: "HOSTEL_WARDEN" },
  { category: "HOSTEL", assignedRole: "HOSTEL_WARDEN" },
  { category: "LIBRARY", assignedRole: "LIBRARY_STAFF" },
  { category: "INFRASTRUCTURE", assignedRole: "MAINTENANCE" },
  { category: "OTHER", assignedRole: "ADMIN" },
];

async function run() {
  await connectDB();

  console.log("Clearing existing demo data...");
  await Promise.all([User.deleteMany({}), RoutingRule.deleteMany({}), Complaint.deleteMany({}), ComplaintLog.deleteMany({})]);

  const hash = await bcrypt.hash(PASSWORD, 10);
  const createdUsers = await User.insertMany(USERS.map((u) => ({ ...u, password: hash })));
  console.log(`Seeded ${createdUsers.length} users (password for all: ${PASSWORD})`);

  const createdRules = await RoutingRule.insertMany(RULES.map((r) => ({ ...r, active: true })));
  console.log(`Seeded ${createdRules.length} routing rules`);

  console.log("Done. Try logging in as student@solver.edu / tech.cse@solver.edu / admin@solver.edu");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
