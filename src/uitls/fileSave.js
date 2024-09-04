const path = require("path");
const fs = require("fs");

const saveFile = async (req, file, location) => {
  let fileName = new Date().getTime() + "." + file.name.split(".").pop();

  let filePath = path.join(process.cwd(), "public", location, fileName);
  let accessURL = `${req.protocol}://${req.get(
    "host"
  )}/${location}/${fileName}`;

  await file.mv(filePath, (err) => {
    if (err) {
      throw err;
    }
  });
  return { fileName, location };
};

const deleteFile = (fileName, location) => {
  let filePath = path.join(process.cwd(), "public", location, fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  saveFile,
  deleteFile,
};
