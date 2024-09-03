const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const cors = require("cors");
const { port } = require('./config/config');
const { connectToDB } = require('./config/db.config');
const { errorHandler } = require('./uitls/errorHandler');

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));

app.use(fileUpload());
app.use(cors());


const adminRoutes = require('./routes/v1/adminRoutes');
const userRoutes = require('./routes/v1/userRoutes');
const marksheetRoutes = require('./routes/v1/marksheetRoutes');
const certificateRoutes = require('./routes/v1/certificateRoutes');

app.use("/adminImages", express.static(__dirname + "/adminImages"));
app.use("/userImages", express.static(__dirname + "/userImages"));
app.use("/marksheetImages", express.static(__dirname + "/marksheetImages"));
app.use("/QRImages", express.static(__dirname + "/QRImages/"));

app.use("/", adminRoutes);
app.use("/", userRoutes);
app.use("/", marksheetRoutes);
app.use("/", certificateRoutes);

app.get("/", (req, res) => {
    res.send("<h1>University App is Up and Running</h1>");
});

// Last middleware if any error comes
app.use(errorHandler);

app.listen(port, async() => {
    console.log("Server is running at port", port);

    await connectToDB();
    console.log("Database connected");
});

