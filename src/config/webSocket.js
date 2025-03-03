const { Server } = require("socket.io");
const authenticateSocket = require("../middleware/socketAuth");

const connectedUsers = new Map(); // Stores userId -> { dependId -> { sockets: Set } }
let chatNamespace;

const initializeWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust for security
      methods: ["GET", "POST"],
    },
  });

  chatNamespace = io.of("/chat");
  chatNamespace.use(authenticateSocket);

  chatNamespace.on("connection", (socket) => {
    const userId = socket.user?.id;
    const dependId = socket.additionalData?.id;

    if (!userId || !dependId) return socket.disconnect(true);

    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Map());
    }

    const userConnections = connectedUsers.get(userId);

    if (!userConnections.has(dependId)) {
      userConnections.set(dependId, { sockets: new Set() });
    }

    const dependConnections = userConnections.get(dependId);
    dependConnections.sockets.add(socket.id);

    console.log(
      `User ${userId} (DependId: ${dependId}) connected on socket: ${socket.id}`
    );

    socket.on("disconnect", () => {
      const userConnections = connectedUsers.get(userId);
      if (userConnections) {
        const dependConnections = userConnections.get(dependId);
        if (dependConnections) {
          dependConnections.sockets.delete(socket.id);
          if (dependConnections.sockets.size === 0) {
            userConnections.delete(dependId);
          }
        }
        if (userConnections.size === 0) {
          connectedUsers.delete(userId);
        }
      }
      console.log(
        `User ${userId} (DependId: ${dependId}) disconnected from socket: ${socket.id}`
      );
    });
  });

  return { io, chatNamespace, connectedUsers };
};

const getChatNamespace = () => chatNamespace;

module.exports = { initializeWebSocket, connectedUsers, getChatNamespace };
