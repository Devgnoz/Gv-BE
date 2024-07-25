const MusicInvoice = require("../database/model/musicInvoice");
const Music = require('../database/model/musics');
const Licensor = require("../database/model/licensor");
const Currency = require("../database/model/currency");
const { ObjectId } = require("mongodb");
const Dashboard = require("../database/model/dashboard")
const Channel = require("../database/model/channel");
const Tax = require("../database/model/tax")



// Generate Invoice
exports.generateMusicInvoice = async (req, res) => {
  try {
    const { date } = req.body;
    console.log("Music Invoice Date", date);

    // Parse the date from the request body (assuming the format is "Month Year")
    const [month, year] = date.split(" ");
    const targetDate = new Date(year, ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(month), 1);

    const musics = await Music.find({
      "assets.date": date
    });
    const channel = await Channel.find({
      "assets.date": date
    });

    if (!musics || musics.length === 0) {
      return res.status(404).json({ error: "No music data found for the provided date" });
    }

    // Fetch all licensor details
    const licensors = await Licensor.find();
    if (!licensors || licensors.length === 0) {
      return res.status(404).json({ error: "No licensor data found" });
    }

    // Fetch currency conversion rates for the given date
    const currencyRate = await Currency.findOne({ date });
    if (!currencyRate) {
      return res.status(404).json({ error: "No currency data found for the provided date" });
    }

    // Fetch US tax % for the given date
    const usTaxRate = await Tax.findOne({ date });
    if (!usTaxRate) {
      return res.status(404).json({ error: "No US Tax % found for the provided date" });
    }

    // Fetch the last generated invoice number
    let lastInvoiceNumber = await MusicInvoice.findOne().sort({ _id: -1 }).limit(1);
    let invoiceCounter = lastInvoiceNumber ? parseInt(lastInvoiceNumber.invoiceNumber.slice(-4)) + 1 : 1;

    // Create an array to store generated invoices
    const invoices = [];

    const generateInvoiceNumber = (num) => {
      const prefix = 'INVMU';
      const paddedNum = String(num).padStart(6, '0'); // Pad the number with leading zeros to ensure it is 4 digits long
      return `${prefix}${paddedNum}`;
    };

    let totalCommissionMusic = 0;
    // let musicTaxDeducted = 0;

    for (const music of musics) {
      // Check if an invoice already exists for this musicId and date
      const existingInvoice = await MusicInvoice.findOne({ musicId: music.musicId, date });
      if (existingInvoice) {
        console.warn(`Invoice already exists for musicId: ${music.musicId}, date: ${date}`);
        continue; // Skip this music entry if the invoice already exists
      }

      // Find the corresponding licensor for this music entry
      const licensor = licensors.find(l => l._id.toString() === music.licensorId.toString());
      if (!licensor) {
        console.warn(`Licensor not found for musicId: ${music._id}, licensorId: ${music.licensorId}`);
        continue; // Skip this music entry if the licensor is not found
      }

      // Extract required fields from licensor
      const partnerName = licensor.companyName;
      const licensorId = licensor._id;
      const licensorName = licensor.licensorName;
      const companyName = licensor.companyName;
      const licensorEmail = licensor.licensorEmail;
      const accNum = licensor.bankAccNum;
      const tds = licensor.tds || 0;
      const currency = licensor.currency;
      const licensorAddress = licensor.licensorAddress
      const status = "Unpaid";
      const emailStatus = "Not Sent";
      const musicId = music.musicId;
      const musicName = music.musicName;
      const invoiceNumber = generateInvoiceNumber(invoiceCounter++);
      const type = "Music";

      let inrPayout =0;
      let tdsTax =0;
      let payout =0; 

      // Set IFSC or IBAN based on the currency
      let ifsc = "";
      let iban = "";
      if (currency === "INR") {
        ifsc = licensor.ifsc_iban;
      } else if (currency === "USD") {
        iban = licensor.ifsc_iban;
      }

      // Find the asset with the target date
      const asset = music.assets.find(a => {
        const assetDate = new Date(a.date);
        return assetDate.getMonth() === targetDate.getMonth() && assetDate.getFullYear() === targetDate.getFullYear();
      });

      // Calculate financial fields
      const ptRevenue = parseFloat(asset.partnerRevenue).toFixed(2);

      // const tax = (parseFloat(ptRevenue) * 0.16).toFixed(2); // assuming 16% tax
      // const ptAfterTax = (parseFloat(ptRevenue) - parseFloat(tax)).toFixed(2);

      const commissionRate = parseFloat(music.commission) / 100;
      const commissionAmount = (ptRevenue * commissionRate).toFixed(2);
      const totalPayout = (ptRevenue - parseFloat(commissionAmount)).toFixed(2);

      totalCommissionMusic += parseFloat(commissionAmount);
      // musicTaxDeducted += parseFloat(tax);

      

      // Get the conversion rate based on the currency
      let conversionRate = 1.0; // default value if no conversion is needed
      if (currency === "INR") {
        conversionRate = parseFloat(currencyRate.INR);
        inrPayout = (parseFloat(totalPayout) * conversionRate).toFixed(2);
        tdsTax = (parseFloat(inrPayout) * (parseFloat(licensor.tds) / 100)).toFixed(2);
        payout = (parseFloat(inrPayout) - parseFloat(tdsTax)).toFixed(2);

      }  else if (currency === "USD") {
        conversionRate = parseFloat(currencyRate.USD);
        payout = (parseFloat(totalPayout)).toFixed(2);
      }

      // const payout = (parseFloat(totalPayout) * conversionRate).toFixed(2);

      // const inrPayout = (parseFloat(totalPayout) * conversionRate).toFixed(2);      
      // const tdsTax = (parseFloat(inrPayout) * (parseFloat(licensor.tds) / 100)).toFixed(2);
      // const payout = (parseFloat(inrPayout) - parseFloat(tdsTax)).toFixed(2);

      // Create invoice
      const invoice = new MusicInvoice({
        partnerName,
        licensorId,
        licensorName,
        companyName,
        licensorEmail,
        licensorAddress,
        accNum,
        ifsc,
        iban,
        currency,
        musicId,
        musicName,
        invoiceNumber,
        date,
        ptRevenue,
        tdsTax,
        inrPayout,
        tds,
        commission: music.commission,
        commissionAmount,
        totalPayout,
        conversionRate: conversionRate.toFixed(2),
        payout,
        status,
        type,
        emailStatus
      });

      await invoice.save();
      invoices.push(invoice);
    }

    if (invoices.length === 0) {
      return res.status(404).json({ error: `Invoices already generated for date: ${date}` });
    }


    let existingDashboard = await Dashboard.findOne({ date: date });

    if (existingDashboard) {
      // Update existing dashboard data
      existingDashboard.totalLicensor = licensors.length;
      existingDashboard.totalChannel = channel.length; 
      existingDashboard.totalMusic = musics.length;

      // Handle empty or undefined musicCommission and musicTaxDeducted
      const existingMusicCommission = parseFloat(existingDashboard.musicCommission) || 0;
      // const existingMusicTaxDeducted = parseFloat(existingDashboard.musicTaxDeducted) || 0;

      const existingTotalCommission = parseFloat(existingDashboard.totalCommission) || 0;
      const existingTotalTaxDeducted = parseFloat(existingDashboard.totalTaxDeducted) || 0;


      
      // Parse and add new values
      const commissionToAdd = parseFloat(totalCommissionMusic);
      // const taxToAdd = parseFloat(musicTaxDeducted);

      existingDashboard.musicCommission = commissionToAdd + existingMusicCommission;
      // existingDashboard.musicTaxDeducted = taxToAdd + existingMusicTaxDeducted;

      existingDashboard.totalCommission = existingTotalCommission + commissionToAdd;
      // existingDashboard.totalTaxDeducted = existingTotalTaxDeducted + taxToAdd;

      // Format the results to ensure they are consistent
      existingDashboard.musicCommission = parseFloat(existingDashboard.musicCommission);
      // existingDashboard.musicTaxDeducted = parseFloat(existingDashboard.musicTaxDeducted);


    } else {
      // Create new dashboard data
      existingDashboard = new Dashboard({
        date,
        totalNumberOfLicensor: licensors.length,
        totalNumberOfChannel: channel.length,
        totalNumberOfMusic: musics.length,
        musicCommission: totalCommissionMusic,
        // musicTaxDeducted: musicTaxDeducted,
        totalCommission:totalCommissionMusic,
        totalTaxDeducted: totalTaxDeducted,

      });
    }

    // Save the updated or new dashboard data
    await existingDashboard.save();

    // Return all generated invoices
    res.status(200).json({ message: `Music invoices generated for ${date}`, invoices });
    console.log(`Music invoices generated for ${date}`);

  } catch (error) {
    console.error("Error generating invoices:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



  // get licensors
  exports.getMusicInvoice = async (req, res) => {
    try {
      const invoices = await MusicInvoice.find();
  
      if (invoices.length > 0) {
        res.status(200).json(invoices);
      } else {
        res.status(404).json("No invoices found");
      }
    } catch (error) {
      console.error(error);
      res.status(500).json("Internal server error");
    }
  };

// get particular licensor
exports.viewMusicInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const objectId = new ObjectId(id);
    const invoiceDetails = await MusicInvoice.findOne({ _id: objectId });

    if (!invoiceDetails) {
      return res.status(404).json({ error: 'invoice not found' });
    }

    return res.status(200).json(invoiceDetails);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid licensor ID' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};




