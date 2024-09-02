const express = require('express');
const router = express.Router();

const { generateCertificate, getCertificate, getCertificateByStudent, getAllCertificates } = require('../../controllers/certificateController');

// GENERATE STUDENT DEGREE / DIPLOMA CERTIFICATE (ADMIN API)
router.post("/api/v1/generateCertificate/:adminId/:sessionToken/:consultantId/:userId", generateCertificate);

// GET STUDENT DEGREE / DIPLOMA CERTIFICATE (ADMIN API)
router.get("/api/v1/getCertificate/:adminId/:sessionToken/:consultantId/:userId", getCertificate);

// GET All  CERTIFICATE (ADMIN API)
router.get("/api/v1/getAllCertificates/:adminId/:sessionToken", getAllCertificates);

// GET CERTIFICATE BY STUDENT (STUDENT API)
router.get("/api/v1/getCertificateByStudent", getCertificateByStudent);

module.exports = router;