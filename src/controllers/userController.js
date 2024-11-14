const userModel = require("../models/userModel");
const adminModel = require("../models/adminModel");
const uuid = require("uuid");
const path = require("path");
const fs = require("fs");
const {
  getCurrentIPAddress,
  generateRandomAlphaNumericID,
} = require("../uitls/utils");
const { port } = require("../config/config");
const { isValidObjectId } = require("mongoose");
const marksheetModel = require("../models/marksheetModel");
const { saveFile, deleteFile } = require("../uitls/fileSave");

// ADD STUDENT
const addStudent = async (req, res) => {
  try {
    let { consultantId, sessionToken } = req.params;

    if (!consultantId || !sessionToken) {
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
      let {
        name,
        roll_number,
        registration_number,
        father_name,
        mother_name,
        address,
        email,
        phone,
        date_of_birth,
        category,
        aadhar_number,
        pan_number,
        course_name,
      } = req.body;

      if (
        !name ||
        !roll_number ||
        !registration_number ||
        !father_name ||
        !mother_name ||
        !address ||
        !email ||
        !phone ||
        !date_of_birth ||
        !category ||
        !aadhar_number ||
        !pan_number ||
        !course_name
      ) {
        return res
          .status(400)
          .send({ status: false, message: "All fields are required" });
      }

      let { profilePic } = req.files;

      if (!profilePic) {
        return res
          .status(400)
          .send({ status: false, message: "Profile picture is not uploaded" });
      }

      const { fileName, location } = await saveFile(req, profilePic, "userImages");

      let profilePicObj = {
        picName: fileName,
        picPath: location,
      };

      let userObj = {
        userId: generateRandomAlphaNumericID(26),
        consultantId,
        name,
        roll_number,
        registration_number,
        father_name,
        mother_name,
        address,
        email,
        phone,
        profilePic: profilePicObj,
        date_of_birth,
        category,
        aadhar_number,
        pan_number,
        course_name,
      };

      let newUser = await userModel.create(userObj);

      return res.status(201).send({
        status: true,
        message: "Student Added Successfully",
        data: newUser,
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

// ADD STUDENT EDUCATION
const addEducation = async (req, res) => {
  try {
    let { userId, consultantId, sessionToken } = req.params;
    if (!userId || !consultantId || !sessionToken) {
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
      return res.status(400).send({
        status: false,
        message: "No consultant found with this consultant Id",
      });
    }

    if (sessionToken === consultant.sessionToken) {
      let user = await userModel.findOne({ userId });

      if (!user) {
        return res
          .status(400)
          .send({ status: false, message: "Student Not found" });
      }

      if (user.consultantId !== consultantId) {
        return res.status(400).send({
          status: false,
          message: `This consultantId: ${consultantId} is different from student consultantId: ${user.consultantId}`,
        });
      }

      let { student_class, roll_number, board_name, passing_year } = req.body;
      if (!student_class || !roll_number || !board_name || !passing_year) {
        return res
          .status(400)
          .send({ status: false, message: "All fields are required" });
      }

      let { marksheet } = req.files;
      if (!marksheet) {
        return res
          .status(400)
          .send({ status: false, message: "Marksheet is not uploaded" });
      }

      const { fileName, location } = saveFile(
        req,
        marksheet,
        "marksheetImages"
      );

      let marksheetObj = {
        fileName: fileName,
        filePath: location,
        marksheetName: marksheet.name,
      };

      let educationObj = {
        student_class,
        roll_number,
        board_name,
        passing_year,
        marksheet: marksheetObj,
      };

      let isPresent = user.education.some(
        (item) => item.student_class === educationObj.student_class
      );

      if (!isPresent) {
        user.education.push(educationObj);
      } else {
        return res.status(200).send({
          status: false,
          message: "This Education is already added",
        });
      }

      await user.save();

      return res.status(200).send({
        status: true,
        message: "Education added successfully",
        data: user,
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

// GET ALL STUDENTS OF A CONSULTANTS (CONSULTANT API)
const getAllStudents = async (req, res) => {
  try {
    let { consultantId, sessionToken } = req.params;
    if (!consultantId || !sessionToken) {
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
      return res.status(400).send({
        status: false,
        message: "No consultant found with this consultant Id",
      });
    }

    if (sessionToken === consultant.sessionToken) {
      let { pageNumber, pageSize } = req.query;
      if (!pageNumber || !pageSize) {
        return res.status(400).send({
          status: false,
          message: "Page number and page size are required",
        });
      }

      let allStudents = await userModel.find({ consultantId }).countDocuments();

      let totalPages = Math.ceil(allStudents / pageSize);

      if (pageNumber > totalPages) {
        return res
          .status(400)
          .send({ status: false, message: "Page Not Found" });
      }

      let students = await userModel.find({ consultantId });

      // .skip((pageNumber - 1) * pageSize)
      // .limit(pageSize);

      return res.status(200).send({
        status: true,
        message: "Success",
        data: students,
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

// UPDATE STUDENT DATA
const updateStudent = async (req, res) => {
  try {
    let { userId, consultantId, sessionToken } = req.params;
    if (!userId || !consultantId || !sessionToken) {
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
      let user = await userModel.findOne({ _id: userId });
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

      let reqBody = req.body;

      if ("name" in reqBody) {
        user.name = reqBody.name;
      }

      if ("father_name" in reqBody) {
        user.father_name = reqBody.father_name;
      }

      if ("mother_name" in reqBody) {
        user.mother_name = reqBody.mother_name;
      }

      if ("address" in reqBody) {
        user.address = reqBody.address;
      }

      if ("email" in reqBody) {
        user.email = reqBody.email;
      }

      if ("phone" in reqBody) {
        user.phone = reqBody.phone;
      }

      if ("date_of_birth" in reqBody) {
        user.date_of_birth = reqBody.date_of_birth;
      }

      if ("category" in reqBody) {
        user.category = reqBody.category;
      }

      if ("aadhar_number" in reqBody) {
        user.aadhar_number = reqBody.aadhar_number;
      }

      if ("pan_number" in reqBody) {
        user.pan_number = reqBody.pan_number;
      }

      if ("course_name" in reqBody) {
        user.course_name = reqBody.course_name;
      }

      if ("roll_number" in reqBody) {
        user.roll_number = reqBody.roll_number;
      }

      if ("registration_number" in reqBody) {
        user.registration_number = reqBody.registration_number;
      }

      await user.save();

      return res.status(200).send({
        status: true,
        message: "Student updated successfully",
        data: user,
      });
    } else {
      return res
        .status(403)
        .send({ status: false, message: "Session Expired" });
    }
  } catch (error) {
    return res.status(400).send({ status: false, message: error.message });
  }
};

// UPDATE STUDENT EDUCATION
const updateEducation = async (req, res) => {
  try {
    let { userId, consultantId, sessionToken, eduId } = req.params;
    if (!userId || !consultantId || !sessionToken || !eduId) {
      return res.status(400).send({
        status: false,
        message: "All fields are required",
      });
    }

    let consultant = await adminModel.findOne({
      adminId: consultantId,
      sessionToken: sessionToken,
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

      if (!isValidObjectId(eduId)) {
        return res
          .status(400)
          .send({ status: false, message: "Invalid eduId" });
      }

      let reqBody = req.body;

      for (let edu of user.education) {
        if (edu._id.toString() === eduId) {
          if ("student_class" in reqBody) {
            edu.student_class = reqBody.student_class;
          }

          if ("roll_number" in reqBody) {
            edu.roll_number = reqBody.roll_number;
          }

          if ("board_name" in reqBody) {
            edu.board_name = reqBody.board_name;
          }

          if ("passing_year" in reqBody) {
            edu.passing_year = reqBody.passing_year;
          }

          if ("marksheet" in reqBody || (req.files && req.files.marksheet)) {
            let marksheet = req.files.marksheet;

            if (!marksheet) {
              return res
                .status(400)
                .send({ status: false, message: "No marksheet uploaded" });
            }

            deleteFile(edu.marksheet.fileName, "marksheetImages");
            const { fileName, location } = saveFile(
              req,
              marksheet,
              "marksheetImages"
            );

            let updatedMarksheetObj = {
              fileName: fileName,
              filePath: location,
              marksheetName: marksheet.name,
            };

            edu.marksheet = updatedMarksheetObj;
          }
        }
      }

      await user.save();

      return res.status(200).send({
        status: true,
        message: "Student data updated",
        data: user,
      });
    } else {
      return res
        .status(403)
        .send({ status: false, message: "Session Expired" });
    }
  } catch (error) {
    return res.status(400).send({ status: false, message: error.message });
  }
};

// DELETE STUDENT
const deleteStudent = async (req, res) => {
  try {
    let { userId, consultantId, sessionToken } = req.params;
    if (!userId || !consultantId || !sessionToken) {
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

      deleteFile(user.profilePic.picName, "userImages");

      if (user.education.length) {
        for (let edu of user.education) {
          let eduImgName = edu.marksheet.fileName;
          deleteFile(eduImgName, "marksheetImages");
        }
      }

      await userModel.deleteOne({ userId });

      return res.status(200).send({
        status: true,
        message: "Student deleted successfully",
      });
    } else {
      return res
        .status(403)
        .send({ status: false, message: "Session Expired" });
    }
  } catch (error) {
    return res.status(400).send({ status: false, message: error.message });
  }
};

// DELETE EDUCATION BY ID
const deleteEducation = async (req, res) => {
  try {
    let { userId, consultantId, sessionToken, eduId } = req.params;
    if (!userId || !consultantId || !sessionToken || !eduId) {
      return res.status(400).send({
        status: false,
        message: "All fields are required",
      });
    }

    let consultant = await adminModel.findOne({
      adminId: consultantId,
      sessionToken: sessionToken,
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
      let user = await userModel.findOne({ userId });

      if (!user) {
        return res
          .status(404)
          .send({ status: false, message: "Student Not Found" });
      }

      if (user.consultantId !== consultantId) {
        return res.status(400).send({
          status: false,
          message: `This consultantId: ${consultantId} is different from the student's consultantId: ${consultantId}`,
        });
      }

      if (!isValidObjectId(eduId)) {
        return res.status(400).send({
          status: false,
          message: "Invalid eduId",
        });
      }

      if (user.education.length) {
        for (let i = 0; i < user.education.length; i++) {
          if (eduId === user.education[i]._id.toString()) {
            let arr = user.education;
            arr.splice(i, 1);
            user.education = arr;

            await user.save();
          }
        }
      }

      return res.status(200).send({
        status: true,
        message: "Education deleted successfully",
        data: user,
      });
    } else {
      return res
        .status(403)
        .send({ status: false, message: "Session Expired" });
    }
  } catch (error) {
    return res.status(400).send({ status: false, message: error.message });
  }
};

// GET MARKSHEET BY STUDENT
const getMarksheetByStudent = async (req, res) => {
  try {
    let { rollNo, regNo } = req.params;

    let student = await userModel.findOne({
      roll_number: rollNo,
      registration_number: regNo,
    });

    if (!student) {
      return res
        .status(404)
        .send({ status: false, message: "Student Not Found" });
    }

    let studentMarksheet = await marksheetModel.findOne({
      roll_number: rollNo,
      registration_number: regNo,
    });

    if (!studentMarksheet) {
      return res
        .status(404)
        .send({ status: false, message: "No marksheet found" });
    }

    return res.status(200).send({
      status: true,
      message: "Success",
      data: studentMarksheet,
    });
  } catch (error) {
    return res.status(400).send({ status: false, message: error.message });
  }
};

module.exports = {
  addStudent,
  addEducation,
  getAllStudents,
  updateStudent,
  updateEducation,
  deleteEducation,
  getMarksheetByStudent,
  deleteStudent,
};
