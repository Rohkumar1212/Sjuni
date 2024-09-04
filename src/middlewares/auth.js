const { isValidObjectId } = require('mongoose');
const { tokenSecretKey } = require('../config/config');
const adminModel = require('../models/adminModel');
const jwt = require('jsonwebtoken');


// AUTHENTICATION
const Authentication = async (req, res, next) => {
    try {
        let tokenWithBearer = req.headers["authorization"];

        if (!tokenWithBearer) {
            return res.status(400).send({
                status: false,
                message: "Token is required"
            });
        };

        let tokenArray = tokenWithBearer.split(" ");
        let token = tokenArray[1];

        if (!token) {
            return res.status(400).send({
                status: false,
                message: "Invalid token"
            });
        };

        let decodedToken;

        jwt.verify(token, tokenSecretKey, (err, decode) => {
            if (err) {
                throw err;
            };

            decodedToken = decode;
            let loginUserId = decodedToken.adminId;
            req["adminId"] = loginUserId;
            next();
        })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};


// AUTHORIZATION
const Authorization = async (req, res, next) => {
    try {
        let tokenId = req.adminId;
        let { adminId } = req.params;

        if (!isValidObjectId(adminId)) {
            return res.status(400).send({ status: false, message: "Invalid userId"})
        };

        let admin = await adminModel.findById(adminId);

        if (!admin){
            return res.status(404).send({ status: false, message: "Admin not found"})
        };

        let AdminId = admin._id;

        if ( tokenId.toString() !== AdminId.toString() ) {
            return res.status(403).send({
                status: false,
                message: "NOT AUTHORIZED!!!"
            })
        };

        next();
    } catch (error) {   
        return res.status(500).send({ status: false, message: error.message });
    }
};


module.exports = { Authentication, Authorization }