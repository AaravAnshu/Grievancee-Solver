const router = require("express").Router();
const ctrl = require("../controllers/complaintController");
const { requireAuth, requireRole } = require("../middleware/auth");

router.use(requireAuth);

router.post("/", ctrl.submit);
router.get("/my", ctrl.my);
router.get("/queue", ctrl.queue);
router.get("/all", ctrl.all);
router.get("/:id/timeline", ctrl.timeline);
router.put("/:id/status", ctrl.updateStatus);
router.put("/:id/forward", requireRole("ADMIN", "HOD"), ctrl.forward);

module.exports = router;
