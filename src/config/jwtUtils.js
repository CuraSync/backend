const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const privateKey = fs.readFileSync(
  path.resolve(process.env.JWT_PRIVATE_KEY_PATH),
  "utf8"
);
const publicKey = fs.readFileSync(
  path.join(process.env.JWT_PUBLIC_KEY_PATH),
  "utf8"
);

const generateAccessToken = (user) => {
  return jwt.sign(user, privateKey, {
    algorithm: "RS256",
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

const generateRefreshToken = async (user, deviceId, redisClient) => {
  const refreshToken = jwt.sign(user, privateKey, {
    algorithm: "RS256",
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
  await redisClient.setex(
    `refresh:${user.id}:${deviceId}`,
    7 * 24 * 60 * 60, // 7 days expiry
    refreshToken
  );
  return refreshToken;
};

const verifyToken = (token, req, res, next) => {
  jwt.verify(token, publicKey, { algorithms: ["RS256"] }, (err, user) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    req.user = user;
    next();
  });
};

// New method for WebSocket token verification
const verifyWebSocketToken = (token, callback) => {
  jwt.verify(token, publicKey, { algorithms: ["RS256"] }, (err, user) => {
    if (err) return callback(new Error("Invalid Token"));
    callback(null, user);
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyWebSocketToken,
};
