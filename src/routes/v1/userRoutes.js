const express = require('express');
const router = express.Router();

const { 
    addStudent, 
    addEducation, 
    getAllStudents, 
    updateStudent, 
    updateEducation,
    deleteEducation,
    getMarksheetByStudent,
    deleteStudent
} = require('../../controllers/userController');


const { addContactUsDetails, verifyUserDetails } = require('../../controllers/contactusController');

// ADD STUDENT (CONSULTANT API)
router.post("/api/v1/addStudent/:consultantId/:sessionToken", addStudent);

// ADD EDUCATION (CONSULTANT API)
router.post("/api/v1/addEducation/:userId/:consultantId/:sessionToken", addEducation);

// GET ALL STUDENTS OF A CONSULTANT (CONSULTANT API)
router.get("/api/v1/getAllStudents/:consultantId/:sessionToken", getAllStudents);

// UPDATE STUDENT DATA (CONSULTANT API)
router.put("/api/v1/updateStudent/:consultantId/:sessionToken/:userId", updateStudent);

// UPDATE STUDENT EDUCATION DATA (CONSULTANT API)
router.put("/api/v1/updateEducation/:consultantId/:sessionToken/:userId/:eduId", updateEducation);
// Delete Students Data Api
router.delete("/api/v1/deleteStudent/:consultantId/:sessionToken/:userId", deleteStudent);

// DELETE STUDENT EDUCATION DATA (CONSULTANT API)
router.delete("/api/v1/deleteEducation/:consultantId/:sessionToken/:userId/:eduId", deleteEducation);

// GET MARKSHEET BY STUDENT (STUDENT API)
router.get("/api/v1/getMarksheetByStudent/:rollNo/:regNo", getMarksheetByStudent);

// CONTACT US
router.post("/api/v1/contactUs", addContactUsDetails);

// VERIFY STUDENT DETAILS
router.post("/api/v1/verifyUser", verifyUserDetails);



module.exports = router;