const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const certificateSchema = new mongoose.Schema({
    userId: {
        type: String,
    },

    consultantId: {
        type: String,
    }, 

    passing_year: {
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

    division: {
        type: String,
    },

    course_name: {
        type: String,
    },

    borad_of_eduction: {
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