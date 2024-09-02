const winston = require('winston');
const { logDbUrl } = require('./config');
require('winston-mongodb');

const allowedTransports = [];

// Below transport config enables logging on the console
allowedTransports.push(new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.combine({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf((log) => `${log.timestamp} [${log.level}]: [${log.message}]`)
    )
}));

// Below transport config enables logging in database
allowedTransports.push(new winston.transports.MongoDB({
    level: 'error',
    db: logDbUrl,
    collection: 'logs'
}));


allowedTransports.push(new winston.transports.File({
    filename: `app.log`
}));


const logger = winston.createLogger({
    format: winston.format.combine(
        // winston.format.colorize(),
        // First argument to the combine method is defining how we want the timestamp to come up
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        // Second argument to the combine method which defines what is exactly going to printed in log
        winston.format.printf((log) => `${log.timestamp} [${log.level.toUpperCase()}]: [${log.message}]`)
    ),
    transports: allowedTransports   
});

module.exports = { logger }
