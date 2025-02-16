const express = require("express");

const protectedRoute = (req, res) => {
  res.json({ message: "Protected data accessed", user: req.user });
};

module.exports = { protectedRoute };
