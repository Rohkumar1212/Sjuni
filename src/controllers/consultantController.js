const adminModel = require("../models/adminModel");
const userModel = require("../models/userModel");
const QRModel = require("../models/QRModel");
const uuid = require("uuid");
const path = require("path");
const fs = require("fs");
const { getCurrentIPAddress } = require("../uitls/utils");
const { port } = require("../config/config");

// UPDATE CONSULTANT DATA
const updateConsultant = async (req, res) => {
  try {
    let { adminId, consultantId, adminSessionToken } = req.params;
    if (!adminId || !consultantId || !adminSessionToken) {
      return res
        .status(400)
        .send({ status: false, message: "All fields are required" });
    }

    let admin = await adminModel.findOne({
      adminId: adminId,
      sessionToken: adminSessionToken,
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
    });

    if (!admin) {
      return res
        .status(400)
        .send({ status: false, message: "Super admin not found" });
    }

    if (admin.adminId === adminId && admin.sessionToken === adminSessionToken) {
      let consultant = await adminModel.findOne({
        adminId: consultantId,
        role: "ADMIN",
        isSuperAdmin: false,
      });

      if (!consultant) {
        return res
          .status(400)
          .send({ status: false, message: "Consultant not found" });
      }

      let reqBody = req.body;
      if ("name" in reqBody) {
        consultant.name = reqBody.name;
      }

      if ("email" in reqBody) {
        consultant.email = reqBody.email;
      }

      if ("mobile" in reqBody) {
        consultant.mobile = reqBody.mobile;
      }

      if ("profilePic" in req.body || (req.files && req.files.profilePic)) {
        let profilePic = req.files.profilePic;

        if (!profilePic) {
          return res
            .status(400)
            .send({ status: false, message: "No profile picture uploaded" });
        }

        let currentIpAddress = getCurrentIPAddress();
        let profilePicPath = "/adminImages/";
        let profilePicUniqName =
          uuid.v4() + "." + profilePic.name.split(".").pop();
        let profilePicFullPath = `http://${currentIpAddress}:${port}${profilePicPath}`;

        let profilePicSavingPath = path.join(
          __dirname,
          "..",
          "adminImages",
          profilePicUniqName
        );

        let oldProfilePic = consultant.profilePic.picName;

        let oldPicPath = path.join(
          __dirname,
          "..",
          "adminImages",
          oldProfilePic
        );

        fs.unlinkSync(oldPicPath);

        profilePic.mv(profilePicSavingPath, (err) => {
          if (err) {
            throw err;
          }
        });

        let updatedPicObj = {
          picName: profilePicUniqName,
          picPath: profilePicFullPath,
        };

        consultant.profilePic = updatedPicObj;
      }

      await consultant.save();

      return res.status(200).send({
        status: true,
        message: "Consultant data updated",
        data: consultant,
      });
    } else {
      return res
        .status(400)
        .send({ status: false, message: "Session Expired" });
    }
  } catch (error) {
    return res.status(400).send({ status: false, message: error.message });
  }
};

// DELETE CONSULTANT DATA
const deleteConsultant = async (req, res) => {
  try {
    let { adminId, consultantId, adminSessionToken } = req.params;
    if (!adminId || !consultantId || !adminSessionToken) {
      return res
        .status(400)
        .send({ status: false, message: "All fields are required" });
    }

    let admin = await adminModel.findOne({
      adminId: adminId,
      sessionToken: adminSessionToken,
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
    });

    if (!admin) {
      return res
        .status(400)
        .send({ status: false, message: "Super admin not found" });
    }

    if (admin.adminId === adminId && admin.sessionToken === adminSessionToken) {
      let consultant = await adminModel.findOne({
        adminId: consultantId,
        role: "ADMIN",
        isSuperAdmin: false,
      });

      if (!consultant) {
        return res
          .status(400)
          .send({ status: false, message: "Consultant not found" });
      }

      let consultantProfileImgName = consultant.profilePic.picName;

      let imgPath = path.join(
        __dirname,
        "..",
        "adminImages",
        consultantProfileImgName
      );

      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }

      let deletedConsultant = await adminModel.deleteOne({
        adminId: consultantId,
      });

      if (!deletedConsultant) {
        return res
          .status(400)
          .send({ status: false, message: "Unable to delete consultant" });
      }

      return res.status(200).send({
        status: true,
        message: "Consultant deleted successfully",
      });
    } else {
      return res
        .status(400)
        .send({ status: false, message: "Session Expired" });
    }
  } catch (error) {
    return res.status(400).send({ status: false, message: error.message });
  }
};

// UPLOAD PAYMENT QR CODE OF A PERTICULAR STUDENT
const uploadQRCode = async (req, res) => {
  try {
    let { consultantId, sessionToken, userId } = req.params;

    if (!consultantId || !sessionToken || !userId) {
      return res
        .status(400)
        .send({ status: false, message: "All fields are required" });
    }

    let consultant = await adminModel.findOne({
      adminId: consultantId,
      sessionToken: sessionToken,
      role: "ADMIN",
      isSuperAdmin: false,
    });

    if (!consultant) {
      return res
        .status(400)
        .send({ status: false, message: "Consultant not found" });
    }

    if (
      consultant.adminId === consultantId &&
      consultant.sessionToken === sessionToken
    ) {
      let student = await userModel.findOne({ userId });

      if (!student) {
        return res
          .status(404)
          .send({ status: false, message: "Student not found" });
      }

      if (student.consultantId === consultantId) {
        let isPaymentAlreadyDone = await QRModel.findOne({
          userId,
          consultantId,
        });

        if (
          isPaymentAlreadyDone &&
          isPaymentAlreadyDone.paid_amount === isPaymentAlreadyDone.course_fee
        ) {
          return res.status(200).send({
            status: true,
            message: "Student has already paid the full course fee",
          });
        }

        let { course_fee, paid_amount } = req.body;

        if (!paid_amount || !course_fee) {
          return res
            .status(400)
            .send({ status: false, message: "All fields are required" });
        }

        if (course_fee !== paid_amount) {
          return res.status(400).send({
            status: false,
            message: `Paid amount:${paid_amount} should be equal to course fee: ${course_fee}`,
          });
        }

        let { QRCode } = req.files;

        if (!QRCode) {
          return res
            .status(400)
            .send({ status: false, message: "No QR Code uploaded" });
        }

        let currentIpAddress = getCurrentIPAddress();
        let QRImgRelativePath = "/QRImages/";
        let QRUniqName = uuid.v4() + "." + QRCode.name.split(".").pop();
        let QRFullPath = `http://${currentIpAddress}:${port}${QRImgRelativePath}`;
        let QRSavingPath = path.join(
          __dirname,
          "..",
          "QRImages",
          QRUniqName
        );

        QRCode.mv(QRSavingPath, (err) => {
          if (err) {
            throw err;
          }
        });

        let QRObj = {
          QRName: QRUniqName,
          QRPath: QRFullPath,
        };

        let QRModelObj = {
          consultantId,
          sessionToken,
          userId,
          course_fee,
          course: student.course_name,
          paid_amount,
          QRCode: QRObj,
          uploadedAt: new Date().toLocaleString(),
        };

        let newQRCode = await QRModel.create(QRModelObj);

        return res.status(201).send({
          status: true,
          message: "QR Code uploaded successfully",
          data: newQRCode,
        });
      } else {
        return res
          .status(400)
          .send({ status: false, message: "Session Expired" });
      }
    } else {
      return res
        .status(400)
        .send({ status: false, message: "Session Expired" });
    }
  } catch (error) {
    return res.status(400).send({ status: false, message: error.message });
  }
};

// UPLOAD MULTIPLE PAYMENT'S QR CODE
const uploadMultipleQRCodes = async (req, res) => {
  console.log("hh")
  try {
    let { consultantId, sessionToken, userId } = req.params;

    if (!consultantId || !sessionToken || !userId) {
      return res
        .status(400)
        .send({ status: false, message: "All fields are required" });
    }

    let consultant = await adminModel.findOne({
      adminId: consultantId,
      sessionToken,
      role: "ADMIN",
      isSuperAdmin: false,
    });

    if (!consultant) {
      return res
        .status(404)
        .send({ status: false, message: "Consultant not found" });
    }

    if (
      consultant.adminId === consultantId &&
      consultant.sessionToken === sessionToken
    ) {
      let student = await userModel.findOne({ userId });

      if (!student) {
        return res
          .status(404)
          .send({ status: false, message: "Student Not Found" });
      }

      if (student.consultantId !== consultantId) {
        return res.status(400).send({
          status: false,
          message: `This consultant Id: ${consultantId} is different from student consultant Id: ${student.consultantId}`,
        });
      }

      let isPaymentAlreadyDone = await QRModel.findOne({
        userId,
        consultantId,
      });

      if (
        isPaymentAlreadyDone &&
        isPaymentAlreadyDone.paid_amount === isPaymentAlreadyDone.course_fee
      ) {
        return res.status(200).send({
          status: true,
          message: `${student.name} has already paid the full course fee for the course ${student.course_name}`,
        });
      }

      let { course_fee, paid_amount, course } = req.body;

      if (!course_fee || !paid_amount) {
        return res.status(400).send({
          status: false,
          message: "Course fee and paid amount are required",
        });
      }

      if (paid_amount !== course_fee) {
        return res.status(400).send({
          status: false,
          message: `Paid amount ${paid_amount} is not equal to the course fee ${course_fee}`,
        });
      }

      let QRCodes = Array.isArray(req.files.QRCodes)
        ? req.files.QRCodes
        : [req.files.QRCodes];

      if (QRCodes.length === 0) {
        return res.status(400).send({
          status: false,
          message: "No QR Code uploaded",
        });
      }

      let QRCodeArr = [];

      let currentIpAddress = getCurrentIPAddress();
      let QRCodeRelativePath = "/QRImages/";

      for (let QRCode of QRCodes) {
        let uniqQRCodeName = uuid.v4() + "." + QRCode.name.split(".").pop();
        let QRCodeFullPath = `http://${currentIpAddress}:${port}${QRCodeRelativePath}`;
        let QRCodeSavingPath = path.join(
          __dirname,
          "..",
          "QRImages",
          uniqQRCodeName
        );

        QRCode.mv(QRCodeSavingPath, (err) => {
          if (err) {
            throw err;
          }
        });

        let QRObj = {
          QRName: uniqQRCodeName,
          QRPath: QRCodeFullPath,
        };

        QRCodeArr.push(QRObj);
      }

      let QRModelObj = {
        consultantId,
        sessionToken,
        userId,
        course,
        course_fee,
        paid_amount,
        QRCodes: QRCodeArr,
        uploadedAt: new Date().toLocaleString(),
      };

      let newQRCode = await QRModel.create(QRModelObj);

      return res.status(200).send({
        status: true,
        message: "Payment QR Code uploaded",
        data: newQRCode,
      });
    } else {
      return res
        .status(400)
        .send({ status: false, message: "Session Expired" });
    }
  } catch (error) {
    return res.status(400).send({ status: false, message: error.message });
  }
};

module.exports = {
  updateConsultant,
  deleteConsultant,
  uploadQRCode,
  uploadMultipleQRCodes,
};
