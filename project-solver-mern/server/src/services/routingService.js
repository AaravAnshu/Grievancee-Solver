const User = require("../models/User");
const RoutingRule = require("../models/RoutingRule");

// Who a complaint escalates UP to if its current holder doesn't act in time.
const ESCALATION_MAP = {
  CLASS_COORDINATOR: "HOD",
  TECHNICAL_DEPT: "HOD",
  HOSTEL_WARDEN: "HOD",
  LIBRARY_STAFF: "HOD",
  MAINTENANCE: "HOD",
  HOD: "ADMIN",
};

function specificity(rule) {
  let score = 0;
  if (rule.subCategory) score++;
  if (rule.locationPattern) score++;
  return score;
}

function matchesRule(rule, complaint) {
  const subOk =
    !rule.subCategory ||
    (complaint.subCategory && complaint.subCategory.toLowerCase().includes(rule.subCategory.toLowerCase()));
  const locOk =
    !rule.locationPattern ||
    (complaint.location && complaint.location.toUpperCase().startsWith(rule.locationPattern.toUpperCase()));
  return subOk && locOk;
}

// Picks a staff member holding the given role, preferring one who owns the given location.
async function firstAvailable(role, location) {
  if (location) {
    const scoped = await User.findOne({ role, location });
    if (scoped) return scoped;
  }
  return User.findOne({ role });
}

/**
 * Decides who a complaint goes to.
 *   1. HARASSMENT always bypasses the rule table -> straight to HOD, confidential.
 *   2. Otherwise, load every active rule for the complaint's category, keep
 *      the ones whose subCategory/locationPattern actually match (a null
 *      field on the rule means "matches anything"), and pick the most
 *      SPECIFIC match (most non-null fields) - so a generic "any TECHNICAL
 *      complaint -> IT desk" rule can coexist with a more specific
 *      "TECHNICAL complaints in a LAB- -> branch Technical Dept" rule.
 *   3. If nothing matches, it falls to the Admin inbox for manual triage.
 */
async function routeComplaint(complaint) {
  if (complaint.category === "HARASSMENT") {
    const hod = await firstAvailable("HOD", null);
    return {
      role: "HOD",
      user: hod,
      confidential: true,
      reason: "Sensitive complaint routed directly to HOD/Dean for confidential handling.",
    };
  }

  const candidates = await RoutingRule.find({ category: complaint.category, active: true });
  const matched = candidates.filter((r) => matchesRule(r, complaint));

  if (matched.length === 0) {
    const admin = await firstAvailable("ADMIN", null);
    return {
      role: "ADMIN",
      user: admin,
      confidential: false,
      reason: `No routing rule matched category=${complaint.category} subCategory=${complaint.subCategory || "-"} location=${complaint.location || "-"} - sent to Admin for manual triage.`,
    };
  }

  matched.sort((a, b) => specificity(b) - specificity(a));
  const best = matched[0];
  const user = await firstAvailable(best.assignedRole, complaint.location);

  return {
    role: best.assignedRole,
    user,
    confidential: false,
    reason: `Matched rule #${best._id} -> ${best.assignedRole}`,
  };
}

module.exports = { routeComplaint, firstAvailable, ESCALATION_MAP };
