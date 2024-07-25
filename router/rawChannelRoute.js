// const express = require("express");
// const user = express();
// const multer = require('multer');
// const path = require('path');
// const bodyParser = require('body-parser');
// const fs = require('fs');
// const rawChannelController = require('../controller/rawChannelController');
// const fileLog = require("../database/model/fileLog");

// // Middleware setup
// user.use(bodyParser.urlencoded({ extended: true }));
// user.use(express.static(path.resolve(__dirname, 'public')));

// // Multer storage configuration
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, './public/upload');
//     },
//     filename: (req, file, cb) => {
//         cb(null, 'channel1.csv');
//     }
// });

// const fileFilter = (req, file, cb) => {
//     if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
//         cb(null, true);
//     } else {
//         cb(new Error('Only CSV files are allowed!'), false);
//         console.log("Uploaded Channel file format is not valid!");
//     }
// };

// const upload = multer({ 
//     storage: storage,
//     fileFilter: fileFilter 
// });

// // Function to delete existing file
// function deleteExistingFile(req, res, next) {
//     const filePath = path.resolve(__dirname, 'public', 'upload', 'channel1.csv');
//     fs.access(filePath, fs.constants.F_OK, (err) => {
//         if (!err) {
//             fs.unlink(filePath, (err) => {
//                 if (err) {
//                     console.error("Error deleting existing file:", err);
//                     return res.status(500).send("Error deleting existing file");
//                 }
//                 next();
//             });
//         } else {
//             next();
//         }
//     });
// }

// // Route to import channel
// user.post('/importChannel', deleteExistingFile, (req, res, next) => {
//     upload.single('file')(req, res, async (err) => {
//         if (err instanceof multer.MulterError) {
//             return res.status(500).json({ message: err.message });
//         } else if (err) {
//             return res.status(400).json({ message: err.message });
//         }

//         if (req.file) {
//             console.log('Uploaded file original name:', req.file.originalname); // Log the original filename

//             // Get current time in IST
//             const now = new Date();
//             const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
//             const istTimeString = istTime.toLocaleString('en-IN', { hour12: true });

            
//             try {

//             // Log file details
//             const logEntry = new fileLog({
//                 fileName: req.file.originalname,
//                 fileType: 'Channel',
//                 dateTime: istTimeString, // Local time in IST
//                 status: 'Uploaded successfully'
//             });

//                 await logEntry.save();
//             } catch (logError) {
//                 // Log file details
//             const logEntry = new fileLog({
//                 fileName: req.file.originalname,
//                 fileType: 'Channel',
//                 dateTime: istTimeString, // Local time in IST
//                 status: 'Uploaded Unsuccessfully'
//             });

//                 await logEntry.save();
//             }
//         } else {
//             console.log('No file uploaded');
//         }

//         next();
//     });
// }, rawChannelController.importChannel);

// module.exports = user;











const express = require("express");
const user = express();
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const rawChannelController = require('../controller/rawChannelController');
const fileLog = require("../database/model/fileLog");

// Middleware setup
user.use(bodyParser.urlencoded({ extended: true }));
user.use(express.static(path.resolve(__dirname, 'public')));

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/upload');
    },
    filename: (req, file, cb) => {
        cb(null, 'channel1.csv');
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
        cb(null, true);
    } else {
        cb(new Error('Only CSV files are allowed!'), false);
        console.log("Uploaded Channel file format is not valid!");

        // Get current time in IST
        const now = new Date();
        const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const istTimeString = istTime.toLocaleString('en-IN', { hour12: true });

        // Log file details as "Uploaded Unsuccessfully"
        const logEntry = new fileLog({
            fileName: file.originalname,
            fileType: 'Channel',
            dateTime: istTimeString, // Local time in IST
            status: 'Uploaded Unsuccessfully - Invalid file format'
        });

        logEntry.save().then(() => {
            console.log("Logged invalid file format");
        }).catch(logError => {
            console.error("Error saving invalid file format log:", logError);
        });
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter 
});

// Function to delete existing file
function deleteExistingFile(req, res, next) {
    const filePath = path.resolve(__dirname, 'public', 'upload', 'channel1.csv');
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (!err) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Error deleting existing file:", err);
                    return res.status(500).send("Error deleting existing file");
                }
                next();
            });
        } else {
            next();
        }
    });
}

// Route to import channel
user.post('/importChannel', deleteExistingFile, (req, res, next) => {
    upload.single('file')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ message: err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }

        if (req.file) {
            console.log('Uploaded file original name:', req.file.originalname); // Log the original filename

            // Get current time in IST
            const now = new Date();
            const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            const istTimeString = istTime.toLocaleString('en-IN', { hour12: true });

            try {
                // Log file details as "Uploaded successfully"
                const logEntry = new fileLog({
                    fileName: req.file.originalname,
                    fileType: 'Channel',
                    dateTime: istTimeString, // Local time in IST
                    status: 'Uploaded successfully'
                });

                await logEntry.save();

                // Proceed to the next middleware to import the channel
                next();
            } catch (logError) {
                console.error("Error saving upload log:", logError);

                // Log file details as "Uploaded Unsuccessfully"
                const logEntry = new fileLog({
                    fileName: req.file.originalname,
                    fileType: 'Channel',
                    dateTime: istTimeString, // Local time in IST
                    status: 'Uploaded Unsuccessfully'
                });

                await logEntry.save();

                return res.status(500).json({ message: "Error logging the upload status" });
            }
        } else {
            console.log('No file uploaded');
            return res.status(400).json({ message: "No file uploaded" });
        }
    });
}, rawChannelController.importChannel);

module.exports = user;
