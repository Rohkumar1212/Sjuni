const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const QRSchema = new mongoose.Schema(
  {
    consultantId: {
      type: String,
    },

    sessionToken: {
      type: String,
    },

    userId: {
      type: String,
    },

    course: {
      type: String,
      trim: true,
    },

    course_fee: {
      type: Number,
      required: true,
    },

    paid_amount: {
      type: Number,
      required: true,
    },

    QRCodes: [
      {
        QRName: {
          type: String,
        },

        QRPath: {
          type: String,
        },
      },
    ],

    uploadedAt: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QRCode", QRSchema);
