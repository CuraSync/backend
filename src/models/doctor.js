const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Doctor = mongoose.model("Doctor", userSchema, "doctor");

module.exports = Doctor;
