const express = require('express')

const router = new express.Router()

const userController = require('../controller/userController')
const channelController = require('../controller/channelController')
const musicController = require('../controller/musicController')
const licensorController = require('../controller/licenserController')
const musicInvoiceController =require('../controller/musicInvoiceController')
const channelInvoiceController = require('../controller/channelInvoiceController')
const SettingsController = require('../controller/settingController')
const PaymentController = require('../controller/paymentController')
const dashboardController = require('../controller/dashboardController')
const reportController = require('../controller/reportController')
const middleware = require('../controller/middleware'); 
const emailController = require('../controller/emailController'); 




//Register
// router.post('/register',userController.register)



//login

router.post('/login-test',userController.loginTest)

router.post('/verify-otp',userController.verifyOtp)




// channel routes
router.post('/add-channel',middleware.verifyToken,channelController.addChannel)

router.post('/assign-channel',middleware.verifyToken,channelController.assignChannel)

router.get('/get-linked-channel',middleware.verifyToken,channelController.getLinkedChannels)

router.get('/get-unlinked-channel',middleware.verifyToken,channelController.getUnlinkedChannels)

router.get('/get-channel',middleware.verifyToken,channelController.getChannels)

router.get('/view-channel/:id',middleware.verifyToken,channelController.getOneChannel)

router.delete('/remove-channel/:id',middleware.verifyToken,channelController.removeChannel)

router.put('/update-channel/:id',middleware.verifyToken,channelController.updateChannel)



// channel invoicesunder channel
router.get('/get-channel-invoice-for-channel',middleware.verifyToken,channelController.getInvoiceForChannel)





// licensor routes
router.post('/add-licensor',middleware.verifyToken,licensorController.addLicensor)

router.get('/get-licensor',middleware.verifyToken,licensorController.getLicensor)

router.get('/view-licensor/:id',middleware.verifyToken,licensorController.getOneLicensor)

router.delete('/remove-licensor/:id',middleware.verifyToken,licensorController.removelicensor)

router.put('/update-licensor/:id',middleware.verifyToken,licensorController.updateLicensor)







// Music Route

router.get('/get-rawmusic',middleware.verifyToken,musicController.getRawMusic)

router.get('/view-rawmusic/:id',middleware.verifyToken,musicController.getOneRawMusic)

router.get('/get-linked-music',middleware.verifyToken,musicController.getLinkedMusics)

router.post('/add-music',middleware.verifyToken,musicController.addMusic) 

router.delete('/remove-music/:id',middleware.verifyToken,musicController.delmusic)

router.put('/update-music/:id',middleware.verifyToken,musicController.updateMusic)

router.get('/view-music/:id',middleware.verifyToken,musicController.getOneMusic)

router.post('/assign-music',middleware.verifyToken,musicController.assignMusic)




// Channel Route

// router.get('/get-rawchannel',channelController.getRawChannel)

router.get('/view-rawchannel/:id',middleware.verifyToken,channelController.getOneRawChannel)





// Music Invoice Route
router.post("/generate-music-Invoice",middleware.verifyToken, musicInvoiceController.generateMusicInvoice);

router.get("/get-music-Invoice",middleware.verifyToken, musicInvoiceController.getMusicInvoice);

router.get("/view-music-Invoice/:id",middleware.verifyToken, musicInvoiceController.viewMusicInvoice);




// channel invoice
router.post("/generate-channel-Invoice",middleware.verifyToken, channelInvoiceController.generateChannelInvoice);

router.get("/get-channel-Invoice",middleware.verifyToken, channelInvoiceController.getChannelInvoice);

router.get("/view-channel-Invoice/:id",middleware.verifyToken, channelInvoiceController.viewChannelInvoice);





//TAX
router.get('/view-tax',middleware.verifyToken,SettingsController.viewTax)

router.get('/view-last-three-tax',middleware.verifyToken,SettingsController.getThreeMonthTax)

router.get('/view-all-tax',middleware.verifyToken,SettingsController.getAllTax)

router.get('/view-all-currency',middleware.verifyToken,SettingsController.getAllCurrency)

router.post('/add-tax',middleware.verifyToken,SettingsController.addTax)

router.put('/update-tax/:id',middleware.verifyToken,SettingsController.updateTax)

router.delete('/del-tax/:id',middleware.verifyToken,SettingsController.delTax)





//Currency
router.get('/view-currency',middleware.verifyToken,SettingsController.viewCurrency)

router.post('/add-currency',middleware.verifyToken,SettingsController.addCurrency)

router.get('/view-last-three-currency',middleware.verifyToken,SettingsController.getThreeMonthCurrency)

router.get('/view-last-three-data',middleware.verifyToken,SettingsController.getThreeMonthsData)

//router.delete('/del-currency/:id',SettingsController.delCurrency)

//router.put('/update-currency/:id',SettingsController.updateCurrency)

router.put('/change-invoice-status/:id',middleware.verifyToken,PaymentController.changeInvoiceStatus)

// router.put('/music-invoice-status/:id',middleware.verifyToken,PaymentController.MusicInvoiceStatus)





//DASHBOARD

router.get('/view-count',middleware.verifyToken,dashboardController.getCount)

router.get('/view-stat',middleware.verifyToken,dashboardController.getStat)

router.get('/view-channel-stat',middleware.verifyToken,dashboardController.getSortedChannelsByRevenue)

router.get('/view-music-stat',middleware.verifyToken,dashboardController.getSortedMusicsByRevenue)

router.get('/get-dashboard',middleware.verifyToken,dashboardController.getDashboard)

router.get('/get-one-dashboard/:currentDate',middleware.verifyToken,dashboardController.getOneMonthDashboard)





// payment
router.get('/get-payment',middleware.verifyToken,PaymentController.getPayments)

router.get('/view-payment/:id',middleware.verifyToken,PaymentController.viewPayment)

router.get('/get-currency',middleware.verifyToken,SettingsController.getCurrency)

router.get('/get-tax',middleware.verifyToken,SettingsController.getTax)






// invoice mailing
router.post('/mail-invoice',middleware.verifyToken,emailController.processInvoicesAndSendEmails)

router.post('/download-invoice',middleware.verifyToken,emailController.downloadInvoicePDF)


//File Log 
router.get('/file-log',middleware.verifyToken,dashboardController.getLastFileLogs)


module.exports = router