const router = require("express").Router();
const ctrl = require("../controllers/userController");
const { requireAuth, requireRole } = require("../middleware/auth");

router.use(requireAuth);

router.get("/", requireRole("ADMIN"), ctrl.list);
router.post("/", requireRole("ADMIN"), ctrl.create);
router.get("/by-role/:role", requireRole("ADMIN", "HOD"), ctrl.byRole);

module.exports = router;
