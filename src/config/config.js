const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    mongoDbUrl: process.env.MONGO_DB_URL,
    logDbUrl: process.env.LOG_DB_URL,
    tokenSecretKey: process.env.JWT_SECRET,
    port: process.env.PORT,
}