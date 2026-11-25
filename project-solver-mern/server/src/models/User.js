const mongoose = require("mongoose");

// "location" is what scopes a staff member's responsibility, e.g. a
// TECHNICAL_DEPT user might have location "BRANCH-CSE", a CLASS_COORDINATOR
// might have location "SECTION-A". The routing engine matches a complaint's
// location against this field when picking a specific person for a role.
const ROLES = ["STUDENT", "CLASS_COORDINATOR", "TECHNICAL_DEPT", "HOSTEL_WARDEN", "LIBRARY_STAFF", "MAINTENANCE", "HOD", "ADMIN"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "STUDENT" },
    department: { type: String, default: null },
    location: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    location: this.location,
  };
};

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
