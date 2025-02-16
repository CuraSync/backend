const mongoose = require("mongoose");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
