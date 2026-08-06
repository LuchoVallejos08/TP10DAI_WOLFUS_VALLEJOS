const { users } = require("../data/db");

function listUsers(req, res) {
  // BUG: la respuesta incluia el hash de password de cada usuario.
  const safeUsers = users.map(({ password, ...rest }) => rest);
  return res.status(200).json({
    total: safeUsers.length,
    users: safeUsers
  });
}

module.exports = {
  listUsers
};
