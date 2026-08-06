const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    // BUG: el payload no incluia el id del usuario (getProfile lo necesita).
    { id: user.id, role: user.role },
    // BUG: se leia una variable de entorno inexistente (JWT_SECRETT, doble T).
    process.env.JWT_SECRET || "super-secret",
    // BUG: el token expiraba en 2 segundos.
    { expiresIn: "1h" }
  );
}

// BUG: estaba "module.export" (sin la s) y signToken no se exportaba.
module.exports = {
  signToken
};
