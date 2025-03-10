const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redisClient = require("../utils/redisClient");
const fs = require("fs");
const path = require("path");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../config/jwtUtils");

const Doctor = require("../models/doctor");
const Patient = require("../models/patient");
const Pharmacy = require("../models/pharmacy");
const Laboratory = require("../models/laboratory");

const publicKey = Buffer.from(process.env.JWT_PUBLIC_KEY, "base64").toString(
  "utf8"
);

const login = async (req, res) => {
  const { password, deviceId, credential_type, credential_data, role } =
    req.body;

  if (!deviceId || !password || !role || !credential_type || !credential_data)
    return res.status(400).json({ message: "Required fields are missing" });

  let user;
  let id;
  if (role === "doctor") {
    const usersCollection = Doctor;
    if (credential_type === "id") {
      user = await usersCollection.findOne({ doctorId: credential_data });
      if (user) {
        id = user.doctorId;
      }
    } else if (credential_type === "email") {
      user = await usersCollection.findOne({ email: credential_data });
      if (user) {
        id = user.doctorId;
      }
    }
  } else if (role === "patient") {
    const usersCollection = Patient;
    if (credential_type === "id") {
      user = await usersCollection.findOne({ patientId: credential_data });
      if (user) {
        id = user.patientId;
      }
    } else if (credential_type === "email") {
      user = await usersCollection.findOne({ email: credential_data });
      if (user) {
        id = user.patientId;
      }
    }
  } else if (role === "pharmacy") {
    const usersCollection = Pharmacy;
    if (credential_type === "id") {
      user = await usersCollection.findOne({ pharmacyId: credential_data });
      if (user) {
        id = user.pharmacyId;
      }
    } else if (credential_type === "email") {
      user = await usersCollection.findOne({ email: credential_data });
      if (user) {
        id = user.pharmacyId;
      }
    }
  } else if (role === "lab") {
    const usersCollection = Laboratory;
    if (credential_type === "id") {
      user = await usersCollection.findOne({ labId: credential_data });
      if (user) {
        id = user.labId;
      }
    } else if (credential_type === "email") {
      user = await usersCollection.findOne({ email: credential_data });
      if (user) {
        id = user.labId;
      }
    }
  } else {
    return res.status(400).send({ message: "Invalid role" });
  }

  if (!user) return res.status(400).json({ message: "User not found" });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return res.status(401).json({ message: "Invalid credentials" });

  const accessToken = generateAccessToken({ id: id, role: role });
  const refreshToken = await generateRefreshToken(
    { id: id, role: role },
    deviceId,
    redisClient
  );

  res.json({ accessToken, deviceId, refreshToken });
};

const refresh = async (req, res) => {
  const { deviceId, id, refreshToken } = req.body;
  if (!deviceId || !id)
    return res.status(400).json({ message: "Required fields are missing" });

  if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });

  const storedToken = await redisClient.get(`refresh:${id}:${deviceId}`);
  if (!storedToken || storedToken !== refreshToken)
    return res.status(403).json({ message: "Forbidden" });

  jwt.verify(
    refreshToken,
    publicKey,
    { algorithms: ["RS256"] },
    async (err, user) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      await redisClient.del(`refresh:${user.id}:${deviceId}`);
      const newAccessToken = generateAccessToken({
        id: user.id,
        role: user.role,
      });
      const newRefreshToken = await generateRefreshToken(
        { id: user.id, role: user.role },
        deviceId,
        redisClient
      );

      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    }
  );
};

const logout = async (req, res) => {
  const { id, deviceId } = req.body;
  if (!deviceId || !id)
    return res.status(400).json({ message: "Required fields are missing" });

  await redisClient.del(`refresh:${id}:${deviceId}`);
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out from this device" });
};

const logoutAll = async (req, res) => {
  const { id } = req.body;
  if (!id)
    return res.status(400).json({ message: "Required fields are missing" });
  const keys = await redisClient.keys(`refresh:${id}:*`);
  for (const key of keys) {
    await redisClient.del(key);
  }
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out from all devices" });
};

module.exports = { login, refresh, logout, logoutAll };
