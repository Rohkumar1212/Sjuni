const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const userSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
        },

        consultantId: {
            type: String,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        roll_number: {
            type: String,
            trim: true,
            required: true,
        },

        registration_number: {
            type: String,
            trim: true,
            required: true,
        },

        father_name: {
            type: String,
            required: true,
            trim: true,
        },

        mother_name: {
            type: String,
            required: true,
            trim: true,
        },

        address: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
        },

        phone: {
            type: String,
        },

        date_of_birth: {
            type: String,
        },

        profilePic: {
            picName: {
                type: String,
            },
            picPath: {
                type: String,
            }
        },

        category: {
            type: String,
            enum: ["GENERAL", "OBC", "EBC", "SC", "ST"],
        },

        marksheet: {
            type: ObjectId,
            ref: "Marksheet",
        },

        certificate: {
            type: ObjectId,
            ref: "Certificate"
        },

        education: [
            {
                student_class: {
                    type: String,
                },

                roll_number: {
                    type: String,
                },

                board_name: {
                    type: String,
                    required: true,
                    trim: true,
                },

                passing_year: {
                    type: String,
                    required: true,
                    trim: true,
                },
                marksheet: {
                    fileName: {
                        type: String,
                    },
                    filePath: {
                        type: String,
                    },
                    marksheetName: {
                        type: String,
                    },
                },
            },
        ],

        aadhar_number: {
            type: String,
            required: true,
            trim: true,
        },

        pan_number: {
            type: String,
            required: true,
            trim: true,
        },

        course_name: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
