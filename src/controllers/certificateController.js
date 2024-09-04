const adminModel = require('../models/adminModel');
const userModel = require('../models/userModel');
const marksheetModel = require('../models/marksheetModel');
const certificateModel = require('../models/certificateModel');
let QRModel = require('../models/QRModel');

const uuid = require('uuid');
const path = require('path');

const { getCurrentIPAddress } = require('../uitls/utils');
const { port } = require('../config/config');


// GENERATE DEGREE/DIPLOMA CERTIFICATE
const generateCertificate = async (req, res) => {
    try {
        const { adminId, sessionToken, consultantId, userId } = req.params;

        if (!adminId || !sessionToken || !consultantId || !userId) {
            return res.status(400).send({ status: false, message: "All fields are required"});
        };

        let admin = await adminModel.findOne({
            adminId,
            sessionToken,
            role: "SUPER_ADMIN",
            isSuperAdmin: true,
        });

        if (!admin) {
            return res.status(404).send({ status: false, message: "Admin Not found"});
        };

        if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
            let consultant = await adminModel.findOne({
                adminId: consultantId,
                role: "ADMIN",
                isSuperAdmin: false,
            });

            if (!consultant) {
                return res.status(404).send({ status: false, message: "Consultant not found"});
            };

            let user = await userModel.findOne({ userId });

            if (!user) {
                return res.status(404).send({ status: false, message: "Student not found"});
            };

            if (user.consultantId !== consultantId) {
                return res.status(400).send({ 
                    status: false, 
                    message: `This consultantId: ${consultantId} is different from student consultantId: ${student.consultantId}` 
                });
            };

            let paymentQRCode = await QRModel.findOne({ userId, consultantId });

            if (!paymentQRCode) {
                return res.status(400).send({
                    status: false,
                    message: "Student has not paid the course fee, first pay the fee and upload the payment screenshots",
                });
            }

            let marksheet = await marksheetModel.findOne({userId, consultantId});

            if (!marksheet) {
                return res.status(404).send({ 
                    status: false, 
                    message: "Student marksheet is not generated, first generate the marksheet"
                });
            };

            if (marksheet.subjects.length === 0) {
                return res.status(400).send({
                    status: false,
                    message: "There is no subject added in the marksheet, first add all the subjects"
                })
            };

            let certificate = await certificateModel.findOne({ userId, consultantId });

            if (certificate) {
                return res.status(200).send({
                    status: false,
                    message: "Certificate of this student is already generated and saved in database"
                });
            };

            let {
                passing_year,              
                division,
                borad_of_eduction,
                date_of_issue
            } = req.body;

            if (
                !passing_year || 
                !division ||
                !borad_of_eduction ||
                !date_of_issue
            ) {
                return res.status(400).send({ status: false, message: "All fields are required" });
            };

            let certificateObj = {
                userId,
                consultantId,
                university_name: marksheet.universityName,
                passing_year,
                st_number: marksheet.st_number,
                sr_number: marksheet.sr_number,
                student_name: user.name,          
                roll_number: marksheet.roll_number,
                student_pic: marksheet.student_pic,
                regregistration_number: marksheet.registration_number,
                date_of_birth: user.date_of_birth,
                division,
                course_name: marksheet.programme,
                borad_of_eduction,
                marksheet_code: marksheet.marksheet_code,
                date_of_issue
            };

            let newCertificate = await certificateModel.create(certificateObj);

            user.certificate = newCertificate._id.toString();

            await user.save();

            return res.status(201).send({
                status: true,
                message: "Success",
                data: newCertificate
            });
        } else {
            return res.status(400).send({ status: false, message: "Session Expired" });
        };
    } catch (error) {
        return res.status(400).send({ status: false, message: error.message });
    };
};


// GET STUDENT DEGREE / DIPLOMA CERTIFICATE (ADMIN API)
const getCertificate = async (req, res) => {
    try {
        let { adminId, sessionToken, consultantId, userId } = req.params;

        if (!adminId || !sessionToken || !consultantId || !userId) {
            return res.status(400).send({ status: false, message: "All fields are required"});
        };

        let admin = await adminModel.findOne({
            adminId,
            sessionToken,
            role: "SUPER_ADMIN",
            isSuperAdmin: true,
        });

        if (!admin) {
            return res.status(404).send({ status: false, message: "Admin not found"});
        };

        if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
            let student = await userModel.findOne({ userId });

            if (!student) {
                return res.status(404).send({ status: false, message: "Student not found"});
            };

            if (student.consultantId !== consultantId) {
                return res.status(400).send({ 
                    status: false, 
                    message: `This consultantId: ${consultantId} is different from student consultantId: ${student.consultantId}` 
                });
            };

            let certificate = await certificateModel.findOne({userId, consultantId});

            if (!certificate) {
                return res.status(404).send({ status: false, message: "Student certificate not found"});
            };

            return res.status(200).send({
                status: true,
                message: "Success",
                data: certificate
            });
        } else {
            return res.status(400).send({ status: false, message: "Session Expired" });
        }

    } catch (error) {
        return res.status(400).send({ status: false, message: error.message });
    }
};

// GET ALL CERTIFICATES
const getAllCertificates = async (req, res) => {
    try {
        let { adminId, sessionToken } = req.params;

        if (!adminId || !sessionToken) {
            return res.status(400).send({ status: false, message: "All fields are required" });
        }

        let admin = await adminModel.findOne({
            adminId,
            sessionToken,
            role: "SUPER_ADMIN",
            isSuperAdmin: true,
        });

        if (!admin) {
            return res.status(400).send({ status: false, message: "Admin not found" });
        };

        if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
            let allCertificates = await certificateModel.find({});

            return res.status(200).send({
                status: true,
                message: "Success",
                data: allCertificates,
            });
        } else {
            return res.status(403).send({ status: false, message: "Session Expired!!!" });
        }
    } catch (error) {
        return res.status(400).send({ status: false, message: error.message });
    }
};

// GET CERTIFICATE BY STUDENT (STUDENT API)
const getCertificateByStudent = async (req, res) => {
    try {
        let { name, roll_number, date_of_birth, phone, course_name } = req.body;

        let student = await userModel.findOne({ name,father_name, roll_number, date_of_birth, phone, course_name });

        if (!student) {
            return res.status(404).send({ status: false, message: "Student Not Found"});
        };

        let studentCertificate = await certificateModel.findOne({
            student_name: name,
            roll_number,
            date_of_birth,
            course_name
        });

        if (!studentCertificate) {
            return res.status(404).send({ status: false, message: "No certificate found"})
        };

        return res.status(200).send({
            status: true,
            message: "Success",
            data: studentCertificate
        });

    } catch (error) {
        return res.status(400).send({ status: false, message: error.message });
    };
};


module.exports = {
    generateCertificate,
    getCertificate,
    getCertificateByStudent,
    getAllCertificates
};