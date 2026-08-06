const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getProfile, updateMe } = require("../controllers/userController");

const router = express.Router();

// BUG: el orden estaba invertido (getProfile antes que authMiddleware).
router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateMe);

// BUG: /orders devolvia datos de un usuario sin exigir autenticacion.
router.get("/orders", authMiddleware, (req, res) => {
  return res.status(200).json({
    orders: [
      { id: "A1", total: 1250 },
      { id: "A2", total: 4900 }
    ]
  });
});

module.exports = router;
