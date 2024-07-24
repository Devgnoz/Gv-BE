const mongoose = require("mongoose");


const fileLogSchema = new mongoose.Schema({
    fileName: { type: String },
    fileType: { type: String },
    dateTime: { type: String },
    status: { type: String },
});


const fileLog = mongoose.model('fileLog', fileLogSchema);

module.exports = fileLog;
