const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { listUsers } = require("../controllers/adminController");

const router = express.Router();

// BUG: /all listaba todos los usuarios (con hash de password) sin exigir autenticacion.
router.get("/all", authMiddleware, listUsers);

module.exports = router;
