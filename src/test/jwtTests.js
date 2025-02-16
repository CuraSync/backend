const redisClient = require("../utils/redisClient");

const jwtRTokens = async (req, res) => {
  try {
    const keys = await redisClient.keys("refresh:*"); // Get all refresh token keys

    let tokens = {};
    for (const key of keys) {
      const value = await redisClient.get(key); // If using single tokens
      // const value = await redisClient.smembers(key); // If storing multiple tokens per user
      tokens[key] = value;
    }

    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: "Error fetching refresh tokens", error });
  }
};

module.exports = { jwtRTokens };
