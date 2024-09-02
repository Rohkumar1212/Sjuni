const express = require('express');
const router = express.Router();
const { 
    generateMarksheet,
    addSubjects,
    getMarksheet,
    getAllStudentsOfAConsultant,
    updateSubjects,
    deleteSubject,
    getAllMarksheets,
} = require('../../controllers/marksheetController');
// GENERATE MARKSHEET (ADMIN API)
router.post("/api/v1/generateMarksheet/:adminId/:sessionToken/:consultantId/:userId", generateMarksheet);
// ADD SUBJECTS (ADMIN API)
router.post("/api/v1/addSubjects/:adminId/:sessionToken/:consultantId/:userId", addSubjects);
// GET MARKSHEET (ADMIN API)
router.get("/api/v1/getMarksheet/:adminId/:sessionToken/:consultantId/:userId", getMarksheet);
//  GET ALL STUDENTS OF A CONSULTANT (ADMIN)
router.get("/api/v1/getAllStudentsOfAConsultant/:adminId/:sessionToken/:consultantId", getAllStudentsOfAConsultant);

// GET ALL STUDENTS OF A CONSULTANT (ADMIN)
router.get("/api/v1/getAllMarksheets/:adminId/:sessionToken", getAllMarksheets);

// UPDATE SUBJECT OF A STUDENT (ADMIN API)
router.put("/api/v1/updateSubject/:adminId/:sessionToken/:consultantId/:userId/:subjectId", updateSubjects);
// DELETE SUBJECT OF A STUDENT (ADMIN API)
router.delete("/api/v1/updateSubject/:adminId/:sessionToken/:consultantId/:userId/:subjectId", deleteSubject);
module.exports = router;