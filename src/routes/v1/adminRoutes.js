const express = require("express");
const router = express.Router();
const {
  createAdmin,
  adminLogin,
  getAllConsultants,
  getPaymentQRCode,
  getAllStudents,
  getOneDayRequests,
  getOneMonthRequests,
  getOneYearRequests,
  getStudentById,
  getSuperAdmin,
} = require("../../controllers/adminController");

const { Authentication, Authorization } = require("../../middlewares/auth");
const {
  updateConsultant,
  deleteConsultant,
  uploadQRCode,
  uploadMultipleQRCodes,
} = require("../../controllers/consultantController");

// SIGNUP ADMIN/CONSULTANT
router.post("/api/v1/createSuperAdmin", createAdmin);

// LOGIN ADMIN/CONSULTANT
router.post("/api/v1/loginSuperAdmin", adminLogin);

router.get("/api/v1/getAdmin/:adminId/:sessionToken", getSuperAdmin);

// GET ALL CONSULTANTS (ADMIN API)
router.get(
  "/api/v1/getAllConsultants/:adminId/:sessionToken",
  getAllConsultants
);

// UPDATE CONSULTANT'S DETAILS (ADMIN API)
router.put(
  "/api/v1/updateConsultant/:adminId/:adminSessionToken/:consultantId",
  updateConsultant
);

// UPLOAD PAYMENT QR CODE OF A STUDENT (CONSULTANT API)
// router.post("/api/v1/uploadQRCode/:consultantId/:sessionToken/:userId", uploadQRCode);

// UPLOAD multiple PAYMENT QR CODE OF A STUDENT (CONSULTANT API)
router.post(
  "/api/v1/uploadQRCode/:consultantId/:sessionToken/:userId",
  uploadMultipleQRCodes
);

// GET PAYMENT QR CODE OF A STUDENT (ADMIN API)
router.get(
  "/api/v1/getQRCode/:adminId/:sessionToken/:consultantId/:userId",
  getPaymentQRCode
);

// GET ALL STUDENTS (ADMIN API)
router.get(
  "/api/v1/getAllStudentsbySuperAdmin/:adminId/:sessionToken",
  getAllStudents
);
// UPDATE CONSULTANT
router.put(
  "/api/v1/updateConsutant/:adminId/:adminSessionToken/:consultantId",
  updateConsultant
);

// DELETE CONSULTANT
router.delete(
  "/api/v1/deleteConsultant/:adminId/:adminSessionToken/:consultantId",
  deleteConsultant
);

// GET STUDENT BY ID (ADMIN API)
router.get(
  "/api/v1/getStudentById/:adminId/:sessionToken/:userId",
  getStudentById
);

// GET ONE DAY REQUESTS (ADMIN API) // date format: 2024-05-02
router.get(
  "/api/v1/getOneDayRequests/:adminId/:sessionToken/:date?",
  getOneDayRequests
);
// GET ONE MONTH REQUESTS (ADMIN API)
router.get(
  "/api/v1/getOneMonthRequests/:adminId/:sessionToken/:month/:year",
  getOneMonthRequests
);

// GET ONE YEAR REQUESTS (ADMIN API)
router.get(
  "/api/v1/getOneYearRequests/:adminId/:sessionToken/:year",
  getOneYearRequests
);

module.exports = router;
