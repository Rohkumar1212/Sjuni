const BaseError = require('../errors/base.error');
const { StatusCodes } = require('http-status-codes');

function errorHandler(err, req, res, next) {
    if (err instanceof BaseError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            err: err.details,
            data: {}
        });
    };

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Something went wrong",
        err: err,
        data: {}
    });
};

module.exports = { errorHandler };