const mongoose = require("mongoose");

const routingRuleSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    subCategory: { type: String, default: null }, // null = matches any keyword
    locationPattern: { type: String, default: null }, // null = matches any location
    assignedRole: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoutingRule", routingRuleSchema);
