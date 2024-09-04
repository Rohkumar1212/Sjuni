const os = require("os");

// GET CURRENT IP ADDRESS
let getCurrentIPAddress = () => {
    let networkInterfaces = os.networkInterfaces();
    let ipAddress = Object.values(networkInterfaces)
        .flat()
        .filter((iface) => iface.family === "IPv4" && !iface.internal)
        .map((iface) => iface.address)[0];
    return ipAddress;
};

// Generate Random AlphaNumeric ID of given length
function generateRandomAlphaNumericID(length) {
    let id = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        id += characters[randomIndex];
    }
    return id;
};

module.exports = {
    getCurrentIPAddress,
    generateRandomAlphaNumericID,
};
