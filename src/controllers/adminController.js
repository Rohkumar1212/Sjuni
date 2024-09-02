const adminModel = require("../models/adminModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const uuid = require("uuid");
const path = require("path");
const { getCurrentIPAddress, generateRandomAlphaNumericID } = require("../uitls/utils");
const { port, tokenSecretKey } = require("../config/config");
const userModel = require("../models/userModel");
const QRModel = require("../models/QRModel");

// ADD ADMIN
const createAdmin = async (req, res) => {
    try {
        let { name, email, password, mobile, role } = req.body;

        if (!name || !email || !password || !mobile || !role) {
            return res.status(400).send({ status: false, message: "All fields are required" });
        }

        let { profilePic } = req.files;

        if (!profilePic) {
            return res.status(400).send({ status: false, message: "No profile pic uploaded" });
        }
        let hashedPassward = await bcrypt.hash(password, 10);
        password = hashedPassward;
        let currentIpAddress = getCurrentIPAddress();
        let profilePicPath = "/adminImages/";
        let profilePicName = uuid.v4() + "." + profilePic.name.split(".").pop();
        let profilePicFullPath = `http://${currentIpAddress}:${port}${profilePicPath}`;

        let picSavingPath = path.join(__dirname, "..", "adminImages", profilePicName);

        profilePic.mv(picSavingPath, (err) => {
            if (err) {
                console.log(err);
            }
        });

        picObj = {
            picName: profilePicName,
            picPath: profilePicFullPath,
        };

        let adminObj = {
            adminId: generateRandomAlphaNumericID(26),
            sessionToken: generateRandomAlphaNumericID(51),
            name,
            email,
            password,
            mobile,
            role,
            profilePic: picObj,
        };

        let newAdmin = await adminModel.create(adminObj);

        if (role === "SUPER_ADMIN") {
            newAdmin.isSuperAdmin = true;
            await newAdmin.save();
        }

        return res.status(201).send({
            status: true,
            message: "Admin created",
            data: newAdmin,
        });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

/*
{
    "email": "superadmin12@gmail.com",
    "password": "Superadmin@123"
}
*/

// ADMIN LOGIN
const adminLogin = async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send({ status: false, message: "Email and password are required" });
        }

        let admin = await adminModel.findOne({ email });
        if (!admin) {
            return res.status(400).send({ status: false, message: "Admin not found" });
        }

        bcrypt.compare(password, admin.password, function (err, result) {
            if (err) {
                throw err;
            }
            hasAccess(result);
        });

        async function hasAccess(result) {
            if (result) {
                let data = {};
                let date = Date.now();
                let issueTime = Math.floor(date / 1000);
                let token = jwt.sign(
                    {
                        email: admin.email,
                        adminId: admin._id.toString(),
                        iat: issueTime,
                    },
                    tokenSecretKey,
                    { expiresIn: "24h" }
                );
                (data._id = admin._id.toString()), (data.email = email);
                data.name = admin.name;
                data.profilePic = admin.profilePic;
                data.token = token;

                res.setHeader("Authorization", "Bearer", token);

                // admin.sessionToken = generateRandomAlphaNumericID(51);

                await admin.save();

                return res.status(200).send({
                    status: true,
                    message: "Successfully login",
                    data: data,
                });
            } else {
                return res.status(401).send({ status: false, message: "Login denied" });
            }
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}; 

// GET SUPERADMIN
const getSuperAdmin = async (req, res) => {
    try {
        let { adminId, sessionToken } = req.params;

        if (!adminId || !sessionToken) {
            return res.status(400).send({ status: false, message: "All fields are required"});
        };

        let admin = await adminModel.findOne({
            adminId,
            sessionToken,
            role: "SUPER_ADMIN",
            isSuperAdmin: true,
        });

        let obj = {
            name: admin.name,
            email: admin.email,
            mobile: admin.mobile,
            profilePic: admin.profilePic
        };

        return res.status(200).send({
            status: true,
            message: "Success",
            data: obj
        });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    };
};

// GET ALL CONSULTANTS
const getAllConsultants = async (req, res) => {
    try {
        let { adminId, sessionToken } = req.params;
        if (!adminId || !sessionToken) {
            return res.status(400).send({ status: false, message: "All fields are required" });
        }

        let superAdmin = await adminModel.findOne({
            adminId,
            sessionToken,
            role: "SUPER_ADMIN",
            isSuperAdmin: true,
        });

        if (!superAdmin) {
            return res.status(404).send({ status: false, message: "Super Admin not found" });
        }

        if (superAdmin.adminId === adminId && superAdmin.sessionToken === sessionToken) {
            // let { pageNumber, pageSize } = req.query;

            // if (!pageNumber || !pageSize) {
            //     return res.status(400).send({
            //         status: false,
            //         message: "Page number and page size is required",
            //     });
            // }

            // pageNumber = parseInt(pageNumber);
            // pageSize = parseInt(pageSize);

            let allConsultants = await adminModel.find({ role: "ADMIN", isSuperAdmin: false }) //.countDocuments();

            // let totalPages = Math.ceil(allConsultants / pageSize);

            // if (pageNumber > totalPages) {
            //     return res.status(400).send({ status: false, message: "Page Not Found" });
            // }

            // let consultants = await adminModel
            //     .find({ role: "ADMIN", isSuperAdmin: false })
            //     .skip((pageNumber - 1) * pageSize)
            //     .limit(pageSize);

            return res.status(200).send({
                status: true,
                message: "Success",
                data: allConsultants,
            });
        } else {
            return res.status(400).send({ status: false, message: "Session Expired" });
        };
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    };
};

// GET PAYMENT QR CODE OF A STUDENT
const getPaymentQRCode = async (req, res) => {
    try {
        let { adminId, sessionToken, consultantId, userId } = req.params;
        if (!adminId || !sessionToken || !consultantId || !userId) {
            return res.status(400).send({ status: false, message: "All fields are required" });
        };

        let admin = await adminModel.findOne({
            adminId,
            sessionToken,
            role: "SUPER_ADMIN",
            isSuperAdmin: true,
        });

        if (!admin) {
            return res.status(404).send({ status: false, message: "Admin not found" });
        }

        if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
            let consultant = await adminModel.findOne({
                adminId: consultantId,
                role: "ADMIN",
                isSuperAdmin: false,
            });

            if (!consultant) {
                return res.status(404).send({ status: false, message: "Consultant not found" });
            }

            let user = await userModel.findOne({ userId });
            if (!user) {
                return res.status(404).send({ status: false, message: "Student not found" });
            }

            if (user.consultantId !== consultantId) {
                return res.status(400).send({
                    status: false,
                    message: `This consultantId: ${consultantId} is different from student consultantId: ${student.consultantId}`,
                });
            }

            let paymentQRCode = await QRModel.findOne({ userId, consultantId });

            if (!paymentQRCode) {
                return res.status(404).send({ status: false, message: "Payment QR Code not found" });
            }

            return res.status(200).send({
                status: true,
                message: "Success",
                data: paymentQRCode,
            });
        } else {
            return res.status(400).send({ status: false, message: "Session Expired" });
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

// GET ALL STUDENTS (ADMIN API)
const getAllStudents = async (req, res) => {
  
    try {
        let { adminId, sessionToken } = req.params;
        if (!adminId || !sessionToken) {
            return res.status(400).send({ status: false, message: "All fields are required" });
        }

        let superAdmin = await adminModel.findOne({
            adminId,
            sessionToken,
            role: "SUPER_ADMIN",
            isSuperAdmin: true,
        });

        if (!superAdmin) {
            return res.status(404).send({ status: false, message: "Super Admin not found" });
        }

        if (superAdmin.adminId === adminId && superAdmin.sessionToken === sessionToken) {
            // let { pageNumber, pageSize } = req.query;
            // if (!pageNumber || !pageSize) {
            //     return res.status(400).send({ status: false, message: "Bad Request!!!" });
            // }

            // pageNumber = parseInt(pageNumber);
            // pageSize = parseInt(pageSize);

            let allStudents = await userModel.find();

            // let totalPages = Math.ceil(allStudents / pageSize);

            // if (pageNumber > totalPages) {
            //     return res.status(404).send({ status: false, message: "Page Not Found" });
            // }

            // let students = await userModel
            //     .find()
            //     .skip((pageNumber - 1) * pageSize)
            //     .limit(pageSize);

            return res.status(200).send({
                status: true,
                message: "Success",
                data: allStudents,
            });
        } else {
            return res.status(400).send({ status: false, message: "Session Expired" });
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

// GET A STUDENT BY ID
const getStudentById = async (req, res) => {
    try {
        const { adminId, sessionToken, userId } = req.params;

        if (!adminId || !sessionToken || !userId) {
            return res.status(400).send({ status: false, message: "All fields are required" });
        };

        let admin = await adminModel.findOne({
            adminId,
            sessionToken,
            role: "SUPER_ADMIN",
            isSuperAdmin: true,
        });

        if (!admin) {
            return res.status(404).send({ status: false, message: "Admin not found" });
        };

        if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
            let user = await userModel.findOne({ userId }).populate([{ path: "marksheet" }, { path: "certificate" }]);

            if (!user) {
                return res.status(404).send({ status: false, message: "Student Not Found" });
            };

            return res.status(200).send({
                status: true,
                message: "Success",
                data: user,
            });
        } else {
            return res.status(400).send({ status: false, message: "Session Expired" });
        };
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    };
};

// GET ONE DAY REQUESTS
const getOneDayRequests = async (req, res) => {
    try {
        const { adminId, sessionToken } = req.params;

        if (!adminId || !sessionToken) {
            return res.status(400).send({ status: false, message: "All fields are required" });
        };

        let admin = await adminModel.findOne({
            adminId,
            sessionToken,
            role: "SUPER_ADMIN",
            isSuperAdmin: true,
        });

        if (!admin) {
            return res.status(404).send({ status: false, message: "Admin not found" });
        };

        if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
            let date;
            if (req.params.date) {
                date = new Date(req.params.date);
            } else {
                date = new Date(); // Use today's date if no date is provided
            };

            const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

            const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

            let requestsOfTheDay = await QRModel.find({
                createdAt: { $gte: startDate, $lt: endDate },
            });

            let grandTotalOfTheDay = 0;
            for (let request of requestsOfTheDay) {
                grandTotalOfTheDay += request.paid_amount;
            }

            let data = {
                totalRequestsOfTheDay: requestsOfTheDay,
                oneDayRevenue: grandTotalOfTheDay,
            };

            return res.status(200).send({
                status: true,
                message: "Success",
                data: data,
            });
        } else {
            return res.status(400).send({ status: false, message: "Session Expired" });
        };
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    };
};


// GET ONE WEEK REQUESTS (ADMIN API)
const getOneWeekRequests = async (req, res) => {
    try {
        const { adminId, sessionToken } = req.params;

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
            return res.status(404).send({ status: false, message: "Admin not found" });
        }

        if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
            let startDate;
            let endDate;

            if (req.params.startDate && req.params.endDate) {
                startDate = new Date(req.params.startDate);
                endDate = new Date(req.params.endDate);
            } else {
                const today = new Date();
                startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7); // Start date is one week ago
                endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1); // End date is today
            }

            let requestsOfTheWeek = await QRModel.find({
                createdAt: { $gte: startDate, $lt: endDate },
            });

            let totalRequestsOfTheWeek = requestsOfTheWeek.length;

            let totalRevenueOfTheWeek = 0;
            for (let request of requestsOfTheWeek) {
                totalRevenueOfTheWeek += request.paid_amount;
            }

            let data = {
                totalRequestsOfTheWeek: totalRequestsOfTheWeek,
                oneWeekRevenue: totalRevenueOfTheWeek,
            };

            return res.status(200).send({
                status: true,
                message: "Success",
                data: data,
            });
        } else {
            return res.status(400).send({ status: false, message: "Session Expired" });
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};


// GET ONE MONTH REVENUE AND REQUESTS (ADMIN API)
const getOneMonthRequests = async (req, res) => {
    try {
        const { adminId, sessionToken, month, year } = req.params;

        if (!adminId || !sessionToken || !month || !year) {
            return res.status(400).send({ status: false, message: "All fields are required" });
        };

        let admin = await adminModel.findOne({ adminId, sessionToken });

        if (!admin) {
            return res.status(404).send({ status: false, message: "Admin not found" });
        };

        if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
            const startDate = new Date(year, month - 1, 1); // Month is zero-based index
            const endDate = new Date(year, month, 0);

            const oneMonthRequests = await QRModel.find({
                createdAt: { $gte: startDate, $lt: endDate },
            });

            let grandTotalOfTheMonth = 0;

            for (let request of oneMonthRequests) {
                grandTotalOfTheMonth += request.paid_amount;
            };

            let data = {
                oneMonthRequests: oneMonthRequests,
                oneMonthRevenue: grandTotalOfTheMonth,
            };

            return res.status(200).send({
                status: true,
                message: "Success",
                data: data,
            });
        } else {
            return res.status(400).send({ status: false, message: "Session Expired" });
        };
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    };
};

// GET ONE YEAR REQUESTS AND REVENUE (ADMIN API);
const getOneYearRequests = async (req, res) => {
    try {
        const { adminId, sessionToken, year } = req.params;
        if (!adminId || !sessionToken || !year) {
            return res.status(400).send({ status: false, message: "All fields are required" });
        };

        let admin = await adminModel.findOne({
            adminId,
            sessionToken,
            role: "SUPER_ADMIN",
            isSuperAdmin: true,
        });

        if (!admin) {
            return res.status(404).send({ status: false, message: "Admin not found" });
        };

        if (admin.adminId === adminId && admin.sessionToken === sessionToken) {
            const startDate = new Date(year, 0, 1); // January 1st of the provided year
            const endDate = new Date(year, 11, 31); // December 31st of the provided year

            let totalRequestsOfTheYear = await QRModel.find({
                createdAt: { $gte: startDate, $lt: endDate },
            });

            let grandTotal = 0;
            for (let request of totalRequestsOfTheYear) {
                grandTotal += request.paid_amount;
            };

            let data = {
                oneYearRequests: totalRequestsOfTheYear,
                oneYearRevenue: grandTotal,
            };

            return res.status(200).send({
                status: true,
                message: "Success",
                data: data,
            });
        } else {
            return res.status(400).send({ status: false, message: "Session Expired" });
        };
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    };
};

module.exports = {
    createAdmin,
    adminLogin,
    getSuperAdmin,
    getAllConsultants,
    getPaymentQRCode,
    getAllStudents,
    getOneDayRequests,
    getOneWeekRequests,
    getOneMonthRequests,
    getOneYearRequests,
    getStudentById,
};
