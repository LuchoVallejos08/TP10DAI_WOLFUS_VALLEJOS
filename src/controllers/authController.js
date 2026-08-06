const bcrypt = require("bcryptjs");
const { users } = require("../data/db");
const { signToken } = require("../utils/token");

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // BUG: faltaba el return al responder 400 (seguia ejecutando).
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    const exists = users.find((u) => u.email === email);
    // BUG: registrar un email ya existente respondia 200 en vez de 400.
    if (exists) {
      return res.status(400).json({ message: "Usuario ya registrado" });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = {
      id: String(users.length + 1),
      name,
      email,
      password: hash,
      role: "user"
    };

    users.push(newUser);

    const token = signToken(newUser);

    // BUG: la respuesta incluia el hash de password del usuario.
    const { password: _pwd, ...safeUser } = newUser;
    return res.status(201).json({
      message: "Usuario creado",
      token,
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = users.find((u) => u.email === email);

    // BUG: usuario inexistente respondia 200 y sin return (crasheaba en el compare).
    if (!user) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    // BUG: los argumentos de bcrypt.compare estaban invertidos.
    const match = await bcrypt.compare(password, user.password);

    // BUG: faltaba el return al responder 401 (firmaba y mandaba token igual).
    if (!match) {
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    const token = signToken(user);

    // BUG: la respuesta incluia el hash de password del usuario.
    const { password: _pwd, ...safeUser } = user;
    return res.status(200).json({
      message: "Login correcto",
      token,
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login
};
