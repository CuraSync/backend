const Patient = require("../models/patient");
const bcrypt = require("bcryptjs");

const patientRegister = async (req, res) => {
    if (!req.body.firstName || 
        !req.body.lastName || 
        !req.body.email || 
        !req.body.nic || 
        !req.body.password || 
        !req.body.phoneNumber || 
        !req.body.address || 
        !req.body.dateOfBirth
    ) {
        return res.status(400).json({message: "Required fields are missing"});
    }

    const existingUserByNic = await Patient.findOne({nic: req.body.nic});
    if (existingUserByNic) {
        return res
            .status(409)
            .json({message: "User with this NIC already exists"});
    }

    const existingUserByEmail = await Patient.findOne({email: req.body.email});
    if (existingUserByEmail) {
        return res
            .status(409)
            .json({message: "User with this Email already exists"});
    }

    let patientId = generatePatientId(req.body.nic);

    // Checking for the patient ID uniqueness
    while (true) {
        let existingPatient = await Patient.findOne({patientId});
        if (!existingPatient) {
            break;
        }
        patientId = generatePatientId(req.body.nic);
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    try {
        await Patient.create({
            patientId: patientId,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            fullName: req.body.fullName,
            email: req.body.email,
            nic: req.body.nic,
            password: hashedPassword,
            phoneNumber: req.body.phoneNumber,
            address: req.body.address,
            dateOfBirth: req.body.dateOfBirth,
        });   
        res
            .status(201)
            .json({message: "Patient created successfully",patientId: patientId});

    } catch (error) {
        res
            .status(500)
            .json({message: "Unexpected Error Occurred", error: error.message});
    }
};

const generatePatientId = (nic) => {
    const uniqueNic = nic.slice(-4);
    const randomNum = Math.floor(Math.random() * 9) + 1;
    return `PA${randomNum}${uniqueNic}`;
};

const patientProfileUpdate = async (req, res) => {
    const patientId = req.user.id;
    const updateData = req.body;

    // List of fields to remove if they exist
    const fieldsToRemove = ["email", "nic", "password", "id", "dateOfBirth"];

    // Remove the fields from the update data
    fieldsToRemove.forEach((field) => {
        if (updateData.hasOwnProperty(field)) {
            delete updateData[field];
        }
    });
    try{
        await Patient.updateOne({patientId}, {$set: updateData});
        res.status(200).json({message: "Patient profile updated successfully"});
    }catch(error){
        res
            .status(500)
            .json({message: "Unexpected error occurred", error: error.message});
    }
    
};



module.exports = {patientRegister, patientProfileUpdate};