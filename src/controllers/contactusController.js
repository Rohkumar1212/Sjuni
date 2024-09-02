const nodemailer = require("nodemailer");

// CONTACT US
// Configure Nodemailer with your email provider's SMTP settings
// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "rohitkumar.cs999@gmail.com",
    pass: "nxhb jiea izhl jeql",
  },
});

const addContactUsDetails = async (req, res) => {
  try {
    let data = req.body;

    let { name, email, mobile, service, subject, text } = data;

    // setup e-mail data with unicode symbols
    let msg =
      "<h2 style='padding:0px; margin:0px'>Name: <strong style='color:blue;'>" +
      name +
      "</strong></h2> <p style='padding:0px; margin:0px; margin-top:10px;'>Email: " +
      email +
      "</p>  <p style='border:1px solid #d4fff8; max-width:800px; padding:10px'>Mobile: " +
      mobile +
      "</p>  <p style='border:1px solid #d4fff8; max-width:800px; padding:10px'>Service: " +
      service +
      "</p>  <p style='border:1px solid #d4fff8; max-width:800px; padding:10px'>" +
      text +
      " </p>";
    var mailOptions = {
      from: `${name} <${data.email}>`, // sender address
      to: 'rohitkumar.cs999@gmail.com', // list of receivers
      subject: data.subject, // Subject line
      mobile: data.mobile,
      service: data.service, // plaintext body
      html: msg,
    };

    // send mail with defined transport object
    smtpTransport.sendMail(mailOptions, function (error, response) {
      if (error) {
        return res
          .status(400)
          .send({
            status: false,
            message: "An error occurred while sending the email.",
          });
      } else {
        return res.status(201).send({
          status: true,
          message: "Email sent successfully!",
          data: response
        });
      }
    });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};


// VERIFY USER DETAILS
const verifyUserDetails = async (req, res) => {
    try {
      let data = req.body;
  
      let { name, email, mobile, service, subject, message, year, course, roll_number, verification_type } = data;
  
      // setup e-mail data with unicode symbols
      let msg =
        "<h2 style='padding:0px; margin:0px'>Name: <strong style='color:blue;'>" +
        name +
        "</strong></h2> <p style='padding:0px; margin:0px; margin-top:10px;'>Email: " +
        email +
        "</p>  <p style='border:1px solid #d4fff8; max-width:800px; padding:10px'>Mobile: " +
        mobile +
        "</p>  <p style='border:1px solid #d4fff8; max-width:800px; padding:10px'>Service: " +
        service +
        "</p>  <p style='border:1px solid #d4fff8; max-width:800px; padding:10px'>Text: " +
        message +
        " </p> <p style='border:1px solid #d4fff8; max-width:800px; padding:10px'>Year: " +
        year +
        " </p> <p style='border:1px solid #d4fff8; max-width:800px; padding:10px'>Course: " +
        course +
        " </p> <p style='border:1px solid #d4fff8; max-width:800px; padding:10px'>Roll Number: " +
        roll_number +
        " </p> <p style='border:1px solid #d4fff8; max-width:800px; padding:10px'>Verification Type: " +
        verification_type +
        "</p>";


      var mailOptions = {
        from: `${name} <${email}>`, // sender address
        to: 'rohitkumar.cs999@gmail.com', // list of receivers
        subject: subject, // Subject line
        mobile: mobile,
        service: service, // plaintext body
        html: msg,
      };
  
      // send mail with defined transport object
      smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
          return res
            .status(400)
            .send({
              status: false,
              message: "An error occurred while sending the email.",
            });
        } else {
          return res.status(201).send({
            status: true,
            message: "Email sent successfully!",
            data: response
          });
        }
      });
    } catch (error) {
      return res.status(500).send({ status: false, message: error.message });
    }
  };


module.exports = { addContactUsDetails, verifyUserDetails };
