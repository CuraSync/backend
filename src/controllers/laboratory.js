const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Laboratory = require("../models/laboratory");

const Patient = require("../models/patient");
const PatientLabMessage = require("../models/patientLabMessage");
const PatientLab = require("../models/patientLab");
const { connectedUsers, getChatNamespace } = require("../config/webSocket");

// Add these constants for encryption/decryption
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const NONCE_LENGTH = parseInt(process.env.NONCE_LENGTH);

const laboratoryRegister = async (req, res) => {
  if (
    !req.body.labName ||
    !req.body.email ||
    !req.body.licenceNumber ||
    !req.body.password ||
    !req.body.phoneNumber ||
    !req.body.location
  ) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const existingUserByLicenceNumber = await Laboratory.findOne({
    licenceNumber: req.body.licenceNumber,
  });
  if (existingUserByLicenceNumber) {
    return res
      .status(409)
      .json({ message: "User with this Licence Number already exists" });
  }

  const existingUserByEmail = await Laboratory.findOne({
    email: req.body.email,
  });
  if (existingUserByEmail) {
    return res
      .status(409)
      .json({ message: "User with this Email already exists" });
  }

  let labId = generateLabId(req.body.licenceNumber);

  // Checking for the Lab ID uniqueness
  while (true) {
    let existingLab = await Laboratory.findOne({ labId });
    if (!existingLab) {
      break;
    }
    labId = generateLabId(req.body.licenceNumber);
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  try {
    await Laboratory.create({
      labId: labId,
      labName: req.body.labName,
      email: req.body.email,
      licenceNumber: req.body.licenceNumber,
      password: hashedPassword,
      phoneNumber: req.body.phoneNumber,
      location: req.body.location,
    });
    res
      .status(201)
      .json({ message: "Laboratory created successfully", labId: labId });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Unexpected Error Occurred", error: err.message });
  }
};

const generateLabId = (licenceNumber) => {
  const uniqueLicenceNumber = licenceNumber.slice(-4);
  const randomNum = Math.floor(Math.random() * 9) + 1;
  return `L${randomNum}${uniqueLicenceNumber}`;
};

const laboratoryProfileUpdate = async (req, res) => {
  const labId = req.user.id;
  const updateData = req.body;

  //List of fields to be deleted
  const fieldsToDelete = ["labId", "email", "licenceNumber", "password"];

  //Deleting the fields
  fieldsToDelete.forEach((field) => {
    if (updateData.hasOwnProperty(field)) {
      delete updateData[field];
    }
  });
  try {
    await Laboratory.updateOne({ labId }, { $set: updateData });
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Unexpected Error Occurred", error: err.message });
  }
};

const getLaboratoryProfile = async (req, res) => {
  const labId = req.user.id;
  const lab = await Laboratory.findOne({ labId }).select("-password -_id");
  if (!lab) {
    return res.status(404).json({ message: "Lab not found" });
  }
  res.status(200).json(lab);
};

const getLaboratoryHomepageData = async (req, res) => {
  const labId = req.user.id;

  const user = await Laboratory.findOne({ labId }).select("-password -_id");

  if (!user) {
    return res.status(404).json({ message: "Lab not found" });
  }

  res.status(200).json(user);
};

const getPatientList = async (req, res) => {
  const labId = req.user.id;

  try{
    const patientLabs = await PatientLab.find({labId}).select(
      "patientId -_id"
    );

    if (!patientLabs.length) {
      return res.status(404).json({ message: "No patients found" });
    }

    const patients = [];
    for (const patientLab of patientLabs) {
      const patientDetails = await Patient.findOne({
        patientId: patientLab.patientId
      }).select("firstName lastName profilePic");
      if (patientDetails) {
        const patient = {
          ...patientLab.toObject(),
          ...patientDetails.toObject()
      };
      patients.push(patient);
  }
}

res.status(200).json(patients);
}catch (error) {
  res
    .status(500)
    .json({ message: "Unexpected error occurred", error: error.message });
}
};

// Add encryption/decryption utilities
const encryptMessage = (message) => {
  const nonce = crypto.randomBytes(NONCE_LENGTH); // Generate a unique nonce
  const cipher = crypto.createCipheriv("chacha20", KEY, nonce);

  let encrypted = cipher.update(message, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return nonce.toString("hex") + encrypted.toString("hex"); // Store nonce + ciphertext
};

const decryptMessage = (hexCiphertext) => {
  const nonce = Buffer.from(hexCiphertext.slice(0, NONCE_LENGTH * 2), "hex");
  const encryptedText = Buffer.from(
    hexCiphertext.slice(NONCE_LENGTH * 2),
    "hex"
  );

  const decipher = crypto.createDecipheriv("chacha20", KEY, nonce);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
};

// Add laboratory messaging functions
const labSendMessageToPatient = async (req, res) => {
  const labId = req.user.id;
  const { patientId, type, message, addedDate, addedTime } = req.body;

  if (!patientId || !type || !addedDate || !addedTime || !message) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  let data;
  if (type == "message") {
    data = { message: message };
  } else if (type == "report") {
    const { reportId } = req.body;
    if (!reportId) {
      return res.status(400).json({ message: "ReportId fields are missing" });
    }

    data = { message: message, reportId: reportId };
  } else {
    return res.status(400).json({ message: "Invalid option in type field." });
  }

  // Verify that the patient exists
  const patient = await Patient.findOne({ patientId });
  if (!patient) {
    return res.status(404).json({ message: "Invalid patient" });
  }

  const encryptedData = encryptMessage(JSON.stringify(data));
  const sender = "laboratory";

  try {
    // Save message to database
    const savedMessage = await PatientLabMessage.create({
      labId,
      patientId,
      type,
      sender,
      data: encryptedData,
      addedDate,
      addedTime,
    });

    // Format message for socket
    const socketMessage = {
      labId: savedMessage.labId,
      patientId: savedMessage.patientId,
      type: savedMessage.type,
      sender: savedMessage.sender,
      data: data, // Send plaintext over socket
      addedDate: savedMessage.addedDate,
      addedTime: savedMessage.addedTime,
    };

    const chatNamespace = getChatNamespace();

    // Notify lab's active connections
    if (connectedUsers.has(labId) && connectedUsers.get(labId).has(patientId)) {
      const labSockets = connectedUsers.get(labId).get(patientId).sockets;
      labSockets.forEach((socketId) => {
        chatNamespace.to(socketId).emit("receive-message", socketMessage);
      });
    } else {
      console.log(
        `No active connection for lab ${labId} and patient ${patientId}`
      );
    }

    // Notify patient's active connections
    if (
      connectedUsers.has(patientId) &&
      connectedUsers.get(patientId).has(labId)
    ) {
      const patientSockets = connectedUsers.get(patientId).get(labId).sockets;
      patientSockets.forEach((socketId) => {
        chatNamespace.to(socketId).emit("receive-message", socketMessage);
      });
    } else {
      console.log(
        `No active connection for patient ${patientId} and lab ${labId}`
      );
    }

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

const getLabPatientMessages = async (req, res) => {
  const labId = req.user.id;
  const { patientId } = req.body;

  if (!patientId) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  // Verify that the patient exists
  const patient = await Patient.findOne({ patientId });
  if (!patient) {
    return res.status(404).json({ message: "Invalid patient" });
  }

  try {
    const messages = await PatientLabMessage.find({
      labId,
      patientId,
    }).select("-createdAt -updatedAt -__v");

    if (!messages.length) {
      return res.status(404).json({ message: "No messages found" });
    }

    // Decrypt all messages
    messages.forEach((message) => {
      message.data = JSON.parse(decryptMessage(message.data));
    });

    res.status(200).json(messages);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Unexpected error occurred", error: error.message });
  }
};

module.exports = {
  laboratoryRegister,
  laboratoryProfileUpdate,
  getLaboratoryProfile,
  getPatientList,
  getLaboratoryHomepageData,
  labSendMessageToPatient,
  getLabPatientMessages,
};
