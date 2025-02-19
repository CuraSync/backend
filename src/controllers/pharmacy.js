const Pharmacy = require("../models/pharmacy");
const bcrypt = require("bcryptjs");

const pharmacyRegister = async (req, res) => {
    if (!req.body.pharmacyName || 
        !req.body.email || 
        !req.body.licenceNumber || 
        !req.body.password || 
        !req.body.phoneNumber || 
        !req.body.location
    ) {
        return res.status(400).json({message: "Required fields are missing"});
    }

    const existingUserByLicenceNumber = await Pharmacy.findOne({licenceNumber: req.body.licenceNumber});
    if (existingUserByLicenceNumber) {
        return res
            .status(409)
            .json({message: "User with this Licence Number already exists"});
    }

    const existingUserByEmail = await Pharmacy.findOne({email: req.body.email});
    if (existingUserByEmail) {
        return res
            .status(409)
            .json({message: "User with this Email already exists"});
    }

    let pharmacyId = generatePharmacyId(req.body.licenceNumber);

    // Checking for the pharmacy ID uniqueness
    while (true) {
        let existingPharmacy = await Pharmacy.findOne({pharmacyId});
        if (!existingPharmacy) {
            break;
        }
        pharmacyId = generatePharmacyId(req.body.licenceNumber);
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    try{
        await Pharmacy.create({
            pharmacyId: pharmacyId,
            pharmacyName: req.body.pharmacyName,
            email: req.body.email,
            licenceNumber: req.body.licenceNumber,
            password: hashedPassword,
            phoneNumber: req.body.phoneNumber,
            location: req.body.location,
        });
        res
            .status(201)
            .json({message: "Pharmacy created successfully", pharmacyId: pharmacyId});
    }catch(err){
        res
            .status(500)
            .json({message: "Unexpected Error Occurred", error: error.message});
    }
};

const generatePharmacyId = (licenceNumber) => {
    const uniqueLicenceNumber = licenceNumber.slice(-4);
    const randomNum = Math.floor(Math.random() * 9) + 1;
    return `PH${randomNum}${uniqueLicenceNumber}`;
};

const pharmacyProfileUpdate = async (req, res) => {
    const pharmacyId = req.user.id;
    const updateData = req.body;

    //List of fields to be deleted
    const fieldsToRemove = [
        "pharmacyId",
        "email",
        "licenceNumber",
        "password"];

    //remove the fields from the data
    fieldsToRemove.forEach((field) => {
        if (updateData.hasOwnProperty(field)) {
            delete updateData[field];
        }

    });
    try{
        await Pharmacy.updateOne({pharmacyId}, {$set: updateData});
        res
            .status(200)
            .json({message: "Pharmacy updated successfully"});
    }catch{
        res
            .status(500)
            .json({message: "Unexpected error occurred", error: error.message});
    }
};


module.exports = {pharmacyRegister, pharmacyProfileUpdate};