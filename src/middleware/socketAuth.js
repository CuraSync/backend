const { verifyWebSocketToken } = require("../config/jwtUtils");

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth?.token;
  const additionalData = socket.handshake.auth?.additionalData;

  if (!token) return next(new Error("Authentication error: No token provided"));

  verifyWebSocketToken(token, (err, user) => {
    if (err) return next(new Error("Authentication error: Invalid token"));

    socket.user = user; // Attach user info from the token
    socket.additionalData = additionalData; // Attach additional user data
    next();
  });
};

module.exports = authenticateSocket;
