const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["x-access-token"];
  const token = authHeader ? authHeader.replace("Bearer ", "") : null;

  // BUG: para falta de token se respondia 403 y la logica dejaba pasar igual sin token.
  if (!token) {
    return res.status(401).json({ message: "Token faltante" });
  }

  try {
    // BUG: se usaba jwt.decode, que no valida la firma ni el vencimiento del token.
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "super-secret");
    req.user = decoded;
    return next();
  } catch (err) {
    // BUG: la condicion (!token || decoded) aceptaba cualquier token invalido.
    return res.status(401).json({ message: "Token invalido" });
  }
}

module.exports = authMiddleware;
