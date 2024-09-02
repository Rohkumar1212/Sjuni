const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const marksheetSchema = new mongoose.Schema({

    userId: {
        type: String,
    },


    consultantId: {
        type: String,
    },

    universityName: {
        type: String,
        trim: true,
        required: true,
    },

    fathername: {
        type: String
    },
    
    mothername: {
        type: String
    },

    passing_year:{
        type: String
    },

    passing_semester:{
        type: String
    },

    category: {
        type: String,
    },
    
    marksheet_description: {
        type: String,
        trim: true,
        required: true,
    },

    student_name: {
        type: String,
        trim: true,
        required: true,
    },

    registration_number: {
        type: String,
        trim: true,
        required: true,
    },

    roll_number: {
        type: String,
        trim: true,
        required: true,
    },

    sr_number: {
        type: String,
        trim: true,
        required: true,
    },

    st_number: {
        type: String,
        trim: true,
        required: true,
    },

    qrCode_img: {
        qrName: {
            type: String,
        },
        qrPath: {
            type: String,
        }
    },

    student_pic: {
        picName: { type: String },
        picPath: { type: String },
    },

    programme: {
        type: String,
        trim: true,
        required: true,
    },

    subjects: [
        {
            code: {
                type: String,
            },

            subject_details: {
                type: String,
            },

            year: {
                type: String,
            },

            session: {
                type: String,
            },

            max_number: {
                type: Number
            },

            total_number: {
                type: Number
            }
        }
    ],

    grand_total: {
        type: String,
    },

    max_marks: {
        type: Number,
    },

    marks_obtained: {
        type: Number,
    },

    percentage: {
        type: Number
    },

    passing_description: {
        type: String,
    },

    passing_criteria: {
        type: String,
    },

    marksheet_code: {
        type: String,
    },

    date_of_issue: {
        type: String
    }
}, {timestamps: true});

module.exports = mongoose.model("Marksheet", marksheetSchema);