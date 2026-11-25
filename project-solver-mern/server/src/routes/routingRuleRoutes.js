const router = require("express").Router();
const ctrl = require("../controllers/routingRuleController");
const { requireAuth, requireRole } = require("../middleware/auth");

router.use(requireAuth);

// Any signed-in user can read the rules (the student-facing UI uses this for
// a live "this will route to..." preview while filling out the form).
router.get("/", ctrl.list);

// Only Admins can change how the registry routes complaints.
router.post("/", requireRole("ADMIN"), ctrl.create);
router.put("/:id", requireRole("ADMIN"), ctrl.update);
router.delete("/:id", requireRole("ADMIN"), ctrl.remove);

module.exports = router;
