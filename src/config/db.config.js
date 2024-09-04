const mongoose = require('mongoose');
const { mongoDbUrl } = require('./config');

function connectToDB () {
    try {
        mongoose.connect(mongoDbUrl);
    } catch (error) {
        console.log("Unable to connect to database");
        return error;
    }
};

module.exports = { connectToDB };
