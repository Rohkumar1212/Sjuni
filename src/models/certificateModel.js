const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const certificateSchema = new mongoose.Schema({
    userId: {
        type: String,
    },

    consultantId: {
        type: String,
    },

    university_name: {
        type: String,
        required: true,
        trim: true,
    },

    description: {
        type: String,
    },

    st_number: {
        type: String,
    },

    sr_number: {
        type: String,
    },

    QR_Code: {
        qrName: {
            type: String,
        },
        qrPath: {
            type: String,
        }
    },

    diploma_certificate_heading: {
        type: String,
    },

    this_is_to_certify: {
        type: String,
    },

    student_name: {
        type: String,
        trim: true,
        required: true,
    },  

    roll_number: {
        type: String,
        trim: true,
        required: true,
    },

    student_pic: {
        picName: { type: String },
        picPath: { type: String },
    },

    regregistration_number: {
        type: String,
        trim: true,
        required: true,
    },

    date_of_birth: {
        type: String,
    },

    obtained_the_degree_of: {
        type: String,
    },

    course_name: {
        type: String,
    },

    deploma_description: {
        type: String,
    },

    marksheet_code: {
        type: String,
    },

    date_of_issue: {
        type: String
    }
},{ timestamps: true });


module.exports = mongoose.model("Certificate", certificateSchema);