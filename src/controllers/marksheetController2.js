const adminModel = require("../models/adminModel");
const userModel = require("../models/userModel");
const marksheetModel = require("../models/marksheetModel");
const QRModel = require("../models/QRModel");

const uuid = require("uuid");

const path = require("path");

const { getCurrentIPAddress } = require("../uitls/utils");
const { port } = require("../config/config");
const { isValidObjectId } = require("mongoose");
const fs = require("fs");
const { saveFile, deleteFile } = require("../uitls/fileSave");

// ADD MARKSHEET DATA OF A STUDENT
const generateMarksheet = async (req, res) => {
  try {
    let { adminId, consultantId, userId, sessionToken } = req.params;
    if (!adminId || !consultantId || !userId || !sessionToken) {
      return res
        .status(400)
        .send({ status: false, message: "All fields are required" });
    }

    let admin = await adminModel.findOne({
      adminId,
      sessionToken,
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
    });
    // console.log("admin:", admin);

    if (!admin) {
      return res
        .status(400)
        .send({ status: false, message: "Admin not found" });
    }

    if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
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

      let user = await userModel.findOne({ userId });

      if (!user) {
        return res
          .status(400)
          .send({ status: false, message: "Student not found" });
      }

      if (user.consultantId !== consultantId) {
        return res.status(400).send({
          status: false,
          message: `This consultantId: ${consultantId} is different from student consultantId: ${student.consultantId}`,
        });
      }

      // const fiveDaysAgo = new Date();
      // fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      // if (user.createdAt > fiveDaysAgo) {
      //     return res.status(400).send({
      //         status: false,
      //         message: "Marksheet can only be generated after 5 days of student registeration",
      //     });
      // }

      let paymentQRCode = await QRModel.findOne({ userId, consultantId });

      if (!paymentQRCode) {
        return res.status(400).send({
          status: false,
          message:
            "Student has not paid the course fee, first pay the fee and upload the payment screenshots",
        });
      }

      let marksheet = await marksheetModel.findOne({ userId, consultantId });

      if (marksheet) {
        return res.status(200).send({
          status: false,
          message:
            "Marksheet of this student is already generated and saved in database",
        });
      }


      let {
        universityName,
        marksheet_description,
        sr_number,
        st_number,
        subjects,
        passing_description,
        passing_criteria,
        marksheet_code,
        date_of_issue,
      } = req.body;

      if (
        !universityName ||
        !marksheet_description ||
        !sr_number ||
        !st_number ||
        !passing_description ||
        !passing_criteria ||
        !marksheet_code ||
        !date_of_issue
      ) {
        return res
          .status(400)
          .send({ status: false, message: "All fields are required" });
      }

      let QRObj = null;
      if ("QRCode" in req.body || (req.files && req.files.QRCode)) {
        let { QRCode } = req.files;
        if (!QRCode) {
          return res.status(400).send({
            status: false,
            message: "Please upload all required files",
          });
        }

        let { fileName, location } = await saveFile(req, QRCode, "QRImages");

        QRObj = {
          qrName: fileName,
          qrPath: location,
        };
      }

      let subjectArr = [];

      for (let subject of subjects) {
        let { code, subject_details, year, session, max_number, total_number } =
          subject;

        subjectArr.push({
          code,
          subject_details,
          year,
          session,
          max_number,
          total_number,
        });
      }

      let marksheetObj = {
        userId,
        consultantId,
        universityName,
        marksheet_description,
        student_name: user.name,
        registration_number: user.registration_number,
        roll_number: user.roll_number,
        sr_number,
        st_number,
        subjects,
        programme: user.course_name,
        passing_description,
        passing_criteria,
        marksheet_code,
        date_of_issue,
        qrCode_img: QRObj,
        student_pic: user.profilePic,
      };

      let newMarksheet = await marksheetModel.create(marksheetObj);

      user.marksheet = newMarksheet._id.toString();

      await user.save();

      return res.status(201).send({
        status: true,
        message: "Success",
        data: newMarksheet,
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

// ADD SUBJECTS
const addSubjects = async (req, res) => {
  try {
    const { adminId, sessionToken, consultantId, userId } = req.params;
    if (!adminId || !sessionToken || !consultantId || !userId) {
      return res
        .status(400)
        .send({ status: false, message: "All fields are required" });
    }

    let admin = await adminModel.findOne({
      adminId,
      sessionToken,
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
    });

    if (!admin) {
      return res
        .status(400)
        .send({ status: false, message: "Admin not found" });
    }

    if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
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

      let user = await userModel.findOne({ userId });

      if (!user) {
        return res
          .status(400)
          .send({ status: false, message: "Student not found" });
      }

      if (user.consultantId !== consultantId) {
        return res.status(400).send({
          status: false,
          message: `This consultantId: ${consultantId} is different from student consultantId: ${student.consultantId}`,
        });
      }

      let marksheet = await marksheetModel.findOne({ userId, consultantId });

      if (!marksheet) {
        return res
          .status(400)
          .send({ status: false, message: "Marksheet not found" });
      }

      let { code, subject_details, year, session, max_number, total_number } =
        req.body;

      if (
        !code ||
        !subject_details ||
        !year ||
        !session ||
        !max_number ||
        !total_number
      ) {
        return res
          .status(400)
          .send({ status: false, message: "All fields are required" });
      }

      let subjectObj = {
        code,
        subject_details,
        year,
        session,
        max_number,
        total_number,
      };

      marksheet.subjects.push(subjectObj);

      let max_marks = 0;
      let marks_obtained = 0;

      for (let subject of marksheet.subjects) {
        max_marks += subject.max_number;
        marks_obtained += subject.total_number;
      }

      let percentage = (marks_obtained / max_marks) * 100;

      marksheet.max_marks = max_marks;
      marksheet.marks_obtained = marks_obtained;
      marksheet.percentage = percentage.toFixed(2);

      await marksheet.save();

      return res.status(200).send({
        status: true,
        message: "Subject added successfully",
        data: marksheet,
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

// ADD SUBJECTS
const addSubjects1 = async (req, res) => {
  try {
    const { adminId, sessionToken, consultantId, userId } = req.params;
    if (!adminId || !sessionToken || !consultantId || !userId) {
      return res
        .status(400)
        .send({ status: false, message: "All fields are required" });
    }

    let admin = await adminModel.findOne({
      adminId,
      sessionToken,
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
    });

    if (!admin) {
      return res
        .status(400)
        .send({ status: false, message: "Admin not found" });
    }

    if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
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

      let user = await userModel.findOne({ userId });

      if (!user) {
        return res
          .status(400)
          .send({ status: false, message: "Student not found" });
      }

      if (user.consultantId !== consultantId) {
        return res.status(400).send({
          status: false,
          message: `This consultantId: ${consultantId} is different from student consultantId: ${user.consultantId}`,
        });
      }

      let marksheet = await marksheetModel.findOne({ userId, consultantId });

      if (!marksheet) {
        return res
          .status(400)
          .send({ status: false, message: "Marksheet not found" });
      }

      const { subjects } = req.body;

      if (!Array.isArray(subjects) || subjects.length === 0) {
        return res
          .status(400)
          .send({ status: false, message: "Subjects array is required" });
      }

      for (let subject of subjects) {
        const {
          code,
          subject_details,
          year,
          session,
          max_number,
          total_number,
        } = subject;

        if (
          !code ||
          !subject_details ||
          !year ||
          !session ||
          !max_number ||
          !total_number
        ) {
          return res.status(400).send({
            status: false,
            message: "All fields are required for each subject",
          });
        }

        let subjectObj = {
          code,
          subject_details,
          year,
          session,
          max_number,
          total_number,
        };
        marksheet.subjects.push(subjectObj);
      }

      let max_marks = 0;
      let marks_obtained = 0;

      for (let subject of marksheet.subjects) {
        max_marks += subject.max_number;
        marks_obtained += subject.total_number;
      }

      let percentage = (marks_obtained / max_marks) * 100;

      marksheet.max_marks = max_marks;
      marksheet.marks_obtained = marks_obtained;
      marksheet.percentage = percentage.toFixed(2);

      await marksheet.save();

      return res.status(200).send({
        status: true,
        message: "Subjects added successfully",
        data: marksheet,
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

// UPDATE SUBJECTS (CONSULTANT API)
const updateSubjects = async (req, res) => {
  try {
    const { adminId, sessionToken, consultantId, userId, subjectId } =
      req.params;

    if (!adminId || !sessionToken || !consultantId || !userId || !subjectId) {
      return res
        .status(400)
        .send({ status: false, message: "All fields are required" });
    }

    if (!isValidObjectId(subjectId)) {
      return res
        .status(400)
        .send({ status: false, message: "Invalid Subject Id" });
    }

    let admin = await adminModel.findOne({
      adminId,
      sessionToken,
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
    });

    if (!admin) {
      return res
        .status(404)
        .send({ status: false, message: "Admin Not Found" });
    }

    if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
      let consultant = await adminModel.findOne({
        adminId: consultantId,
        role: "ADMIN",
        isSuperAdmin: false,
      });

      if (!consultant) {
        return res
          .status(404)
          .send({ status: false, message: "Consultant not found" });
      }

      let user = await userModel.findOne({ userId });

      if (!user) {
        return res
          .status(404)
          .send({ status: false, message: "User Not Found" });
      }

      if (user.consultantId !== consultantId) {
        return res.status(400).send({
          status: false,
          message: `This consultantId: ${consultantId} is different from student consultantId: ${student.consultantId}`,
        });
      }

      let marksheet = await marksheetModel.findOne({ userId, consultantId });

      if (!marksheet) {
        return res
          .status(404)
          .send({ status: false, message: "Marksheet not found" });
      }

      let reqBody = req.body;
      if (marksheet.subjects.length) {
        for (let subject of marksheet.subjects) {
          if (subjectId === subject._id.toString()) {
            if ("code" in reqBody) {
              subject.code = reqBody.code;
            }

            if ("subject_details" in reqBody) {
              subject.subject_details = reqBody.subject_details;
            }

            if ("year" in reqBody) {
              subject.year = reqBody.year;
            }

            if ("session" in reqBody) {
              subject.session = reqBody.session;
            }

            if ("max_number" in reqBody) {
              subject.max_number = reqBody.max_number;
            }

            if ("total_number" in reqBody) {
              subject.total_number = reqBody.total_number;
            }
          }
        }
      }

      await marksheet.save();

      return res.status(200).send({
        status: true,
        message: "Subject updated successfully",
        data: marksheet,
      });
    } else {
      return res
        .status(400)
        .send({ status: false, message: "Session Expired" });
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

// GET MARKSHEET OF A STUDENT
const getMarksheet = async (req, res) => {
  try {
    const { adminId, sessionToken, consultantId, userId } = req.params;
    if (!adminId || !sessionToken || !consultantId || !userId) {
      return res
        .status(400)
        .send({ status: false, message: "All fields are required" });
    }

    let admin = await adminModel.findOne({
      adminId,
      sessionToken,
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
    });

    if (!admin) {
      return res
        .status(404)
        .send({ status: false, message: "Admin not found" });
    }

    if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
      let consultant = await adminModel.findOne({
        adminId: consultantId,
        role: "ADMIN",
        isSuperAdmin: false,
      });

      if (!consultant) {
        return res
          .status(404)
          .send({ status: false, message: "Consultant not found" });
      }

      let user = await userModel.findOne({ userId });

      if (!user) {
        return res
          .status(404)
          .send({ status: false, message: "Student not found" });
      }

      if (user.consultantId !== consultantId) {
        return res.status(400).send({
          status: false,
          message: `This consultantId: ${consultantId} is different from student consultantId: ${student.consultantId}`,
        });
      }

      let marksheet = await marksheetModel.findOne({
        userId,
        consultantId,
      });

      if (!marksheet) {
        return res
          .status(400)
          .send({ status: false, message: "Marksheet not found" });
      }

      return res.status(200).send({
        status: true,
        message: "Success",
        data: marksheet,
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

// GET ALL MARKSHEETS
const getAllMarksheets = async (req, res) => {
  try {
    let { adminId, sessionToken } = req.params;

    if (!adminId || !sessionToken) {
      return res
        .status(400)
        .send({ status: false, message: "All fields are required" });
    }

    let admin = await adminModel.findOne({
      adminId,
      sessionToken,
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
    });

    if (!admin) {
      return res
        .status(400)
        .send({ status: false, message: "Admin not found" });
    }

    if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
      let allMarksheets = await marksheetModel.find({});

      return res.status(200).send({
        status: true,
        message: "Success",
        data: allMarksheets,
      });
    } else {
      return res
        .status(403)
        .send({ status: false, message: "Session Expired!!!" });
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

// GET ALL MARKSHEETS OF A CONSULTANT'S STUDENTS
const getAllMarksheetsOfConsultant = async (req, res) => {
  try {
    let { adminId, sessionToken, consultantId } = req.params;

    if (!adminId || !sessionToken) {
      return res
        .status(400)
        .send({ status: false, message: "All fields are required" });
    }

    let admin = await adminModel.findOne({
      adminId,
      sessionToken,
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
    });

    if (!admin) {
      return res
        .status(400)
        .send({ status: false, message: "Admin Not Found" });
    }

    if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
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

      let allMarksheets = await marksheetModel.find({ consultantId });

      return res.status(200).send({
        status: true,
        message: "Success",
        data: allMarksheets,
      });
    } else {
      return res
        .status(403)
        .send({ status: false, message: "Session Expired!!!" });
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

// GET ALL STUDENTS OF A CONSULTANT
const getAllStudentsOfAConsultant = async (req, res) => {
  try {
    let { adminId, sessionToken, consultantId } = req.params;

    if (!adminId || !sessionToken || !consultantId) {
      return res
        .status(400)
        .send({ status: false, message: "All fields are required" });
    }

    let admin = await adminModel.findOne({
      adminId,
      sessionToken,
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
    });

    if (!admin) {
      return res
        .status(400)
        .send({ status: false, message: "Admin not found" });
    }

    if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
      let consultant = await adminModel.findOne({
        adminId: consultantId,
        role: "ADMIN",
        isSuperAdmin: false,
      });

      if (!consultant) {
        return res
          .status(404)
          .send({ status: false, message: "Consultant not found" });
      }

      let allStudents = await userModel.find({ consultantId });

      return res.status(200).send({
        status: true,
        message: "Success",
        data: allStudents,
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

// DELETE SUBJECT
const deleteSubject = async (req, res) => {
  try {
    let { adminId, sessionToken, consultantId, userId, subjectId } = req.params;

    if (!adminId || !sessionToken || !consultantId || !userId || !subjectId) {
      return res
        .status(400)
        .send({ status: false, message: "All fields are required" });
    }

    if (!isValidObjectId(subjectId)) {
      return res
        .status(400)
        .send({ status: false, message: "Invalid Subject Id" });
    }

    let admin = await adminModel.findOne({
      adminId,
      sessionToken,
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
    });

    if (!admin) {
      return res
        .status(404)
        .send({ status: false, message: "Admin not found" });
    }

    if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
      let consultant = await adminModel.findOne({
        adminId: consultantId,
        role: "ADMIN",
        isSuperAdmin: false,
      });

      if (!consultant) {
        return res
          .status(404)
          .send({ status: false, message: "Consultant Not Found" });
      }

      let user = await userModel.findOne({ userId });

      if (!user) {
        return res
          .status(404)
          .send({ status: false, message: "Student Not Found" });
      }

      if (user.consultantId !== consultantId) {
        return res.status(400).send({
          status: false,
          message: `This consultantId: ${consultantId} is different from student consultantId: ${user.consultantId}`,
        });
      }

      let marksheet = await marksheetModel.findOne({ userId, consultantId });

      if (!marksheet) {
        return res
          .status(404)
          .send({ status: false, message: "Student Marksheet Not Found" });
      }

      if (marksheet.subjects.length) {
        for (let i = 0; i < marksheet.subjects.length; i++) {
          if (subjectId === marksheet.subjects[i]._id.toString()) {
            let arr = marksheet.subjects;
            arr.splice(i, 1);
            marksheet.subjects = arr;

            await marksheet.save();
          }
        }
      }

      return res.status(200).send({
        status: true,
        message: "Subject deleted successfully",
        data: marksheet,
      });
    } else {
      return res
        .status(400)
        .send({ status: false, message: "Session Expired" });
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

// DELETE MARKSHEET
const deleteMarksheet = async (req, res) => {
  try {
    let { adminId, sessionToken, consultantId, userId } = req.params;
    if (!adminId || !sessionToken || !consultantId || !userId) {
      return res
        .status(400)
        .send({ status: false, message: "All fields are required" });
    }

    let admin = await adminModel.findOne({
      adminId,
      sessionToken,
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
    });

    if (!admin) {
      return res
        .status(400)
        .send({ status: false, message: "Admin not found" });
    }

    if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
      let consultant = await adminModel.findOne({
        adminId: consultantId,
        role: "ADMIN",
        isSuperAdmin: false,
      });

      if (!consultant) {
        return res
          .status(400)
          .send({ status: false, message: "Consultant Not Found" });
      }

      let user = await userModel.findOne({ userId });

      if (!user) {
        return res
          .status(400)
          .send({ status: false, message: "User Not Found" });
      }

      if (user.consultantId !== consultantId) {
        return res.status(400).send({
          status: false,
          message: `This consultantId: ${consultantId} is different from student consultantId: ${user.consultantId}`,
        });
      }

      let marksheet = await marksheetModel.findOne({ userId, consultantId });

      if (!marksheet) {
        return res
          .status(400)
          .send({ status: false, message: "Marksheet not found" });
      }

      deleteFile(marksheet.qrCode_img.qrName, "QRImages");

      await marksheetModel.deleteOne({ userId, consultantId });

      return res.status(200).send({
        status: true,
        message: "Marksheet deleted successfully",
      });
    } else {
      return res
        .status(403)
        .send({ status: false, message: "Not Authorized!!!" });
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

// UPDATE MARKSHEET
const updateMarksheet = async (req, res) => {
  try {
    let { adminId, sessionToken, consultantId, userId } = req.params;

    if (!adminId || !sessionToken || !consultantId || !userId) {
      return res
        .status(400)
        .send({ status: false, message: "All fields are required" });
    }

    let admin = await adminModel.findOne({
      adminId,
      sessionToken,
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
    });

    if (!admin) {
      return res
        .status(400)
        .send({ status: false, message: "Admin not found" });
    }

    if (admin.adminId !== adminId && admin.sessionToken !== sessionToken) {
      return res.status(403).send({ status: false, message: "Not Authorized" });
    }

    let m = await marksheetModel.findOne({ userId, consultantId });

    if (!m) {
      return res
        .status(400)
        .send({ status: false, message: "Marksheet not found" });
    }

    let e = req.body;

    if ("universityName" in e) {
      m.universityName = e.universityName;
    }

    if ("marksheet_description" in e) {
      m.marksheet_description = e.marksheet_description;
    }

    if ("student_name" in e) {
      m.student_name = e.student_name;
    }

    if ("registration_number" in e) {
      m.registration_number = e.registration_number;
    }

    if ("roll_number" in e) {
      m.roll_number = e.roll_number;
    }

    if ("sr_number" in e) {
      m.sr_number = e.sr_number;
    }

    if ("st_number" in e) {
      m.st_number = e.st_number;
    }

    if ("programme" in e) {
      m.programme = e.programme;
    }

    if ("passing_description" in e) {
      m.passing_description = e.passing_description;
    }

    if ("passing_criteria" in e) {
      m.passing_criteria = e.passing_criteria;
    }

    if ("marksheet_code" in e) {
      m.marksheet_code = e.marksheet_code;
    }

    if ("date_of_issue" in e) {
      m.date_of_issue = e.date_of_issue;
    }

    if ("qrCode_img" in e || (req.files && req.files.qrCode_img)) {
      let { QRCode } = req.files;

      if (!QRCode) {
        return res
          .status(400)
          .send({ status: false, message: "No QR Code uploaded" });
      }

      deleteFile(m.qrCode_img.qrName, "QRImages");
      const { fileName, location } = await saveFile(req, QRCode, "QRImages");

      let QRCodeObj = {
        qrName: fileName,
        qrPath: location,
      };

      m.qrCode_img = QRCodeObj;
    }

    await m.save();

    return res.status(200).send({
      status: true,
      message: "Marksheet updated successfully",
    });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = {
  generateMarksheet,
  addSubjects,
  getMarksheet,
  getAllStudentsOfAConsultant,
  updateSubjects,
  deleteSubject,
  updateMarksheet,
  deleteMarksheet,
};
