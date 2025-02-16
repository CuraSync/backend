const { verifyToken } = require("../config/jwtUtils");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  verifyToken(token, req, res, next);
};

module.exports = authenticateToken;
