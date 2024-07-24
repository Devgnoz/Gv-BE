const musics = require('../database/model/musics');
const channels = require("../database/model/channel");
const licensors = require('../database/model/licensor');
const dashboard = require('../database/model/dashboard'); 
const fileLog = require('../database/model/fileLog'); 
const channelInvoice = require('../database/model/channelInvoice');
const musicInvoice = require("../database/model/musicInvoice");


// Get total count
exports.getCount = async (req, res) => {
    try {
        const channelCount = await channels.countDocuments();
        const musicCount = await musics.countDocuments();
        const licensorCount = await licensors.countDocuments();
        const toatlAsset = channelCount + musicCount

        // Sum totalCommission from the dashboard collection
        const totalCommissionResult = await dashboard.aggregate([
            {
                $group: {
                    _id: null,
                    totalCommission: { $sum: { $toDouble: "$totalCommission" } }
                }
            }
        ]);

        // Extract the totalCommission value
        const totalCommission = totalCommissionResult.length > 0 ? totalCommissionResult[0].totalCommission : 0;

        const totalchannelCommissionResult = await dashboard.aggregate([
            {
                $group: {
                    _id: null,
                    channelCommission: { $sum: { $toDouble: "$channelCommission" } }
                }
            }
        ]);

        // Extract the totalChannelCommission value
        const totalchannelCommission = totalchannelCommissionResult.length > 0 ? totalchannelCommissionResult[0].channelCommission : 0;

        const totalMusicCommissionResult = await dashboard.aggregate([
            {
                $group: {
                    _id: null,
                    musicCommission: { $sum: { $toDouble: "$musicCommission" } }
                }
            }
        ]);

        // Extract the totalMusicCommission value
        const totalMusicCommission = totalMusicCommissionResult.length > 0 ? totalMusicCommissionResult[0].musicCommission : 0;

        // Get channelCommissionArray and musicCommissionArray
        const channelCommissionArrayResult = await dashboard.aggregate([
            {
                $project: {
                    channelCommission: { $toDouble: "$channelCommission" }
                }
            }
        ]);

        const musicCommissionArrayResult = await dashboard.aggregate([
            {
                $project: {
                    musicCommission: { $toDouble: "$musicCommission" }
                }
            }
        ]);

        const totalCommissionArrayResult = await dashboard.aggregate([
            {
                $project: {
                    totalCommission: { $toDouble: "$totalCommission" }
                }
            }
        ]);

        const dateArrayResult = await dashboard.aggregate([
            {
                $project: {
                    date: 1 // Use 1 to include the date field as it is without conversion
                }
            }
        ]);

        const channelCommissionArray = channelCommissionArrayResult.map(doc => doc.channelCommission);
        const musicCommissionArray = musicCommissionArrayResult.map(doc => doc.musicCommission);
        const totalCommissionArray = totalCommissionArrayResult.map(doc => doc.totalCommission);
        const dateArray = dateArrayResult.map(doc => doc.date);

        res.status(200).json({ 
            channelCount: channelCount,
            musicCount: musicCount,
            licensorCount: licensorCount,
            totalCommission: totalCommission,
            totalchannelCommission: totalchannelCommission,
            totalMusicCommission: totalMusicCommission,
            channelCommissionArray: channelCommissionArray,
            musicCommissionArray: musicCommissionArray,
            totalCommissionArray: totalCommissionArray,
            toatlAsset:toatlAsset,
            dateArray: dateArray
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// Get Dashboard data
exports.getDashboard = async (req, res) => {
    try {
        const dashboardData = await dashboard.find(); // Renamed variable to avoid conflict
  
        if (dashboardData.length > 0) {
            res.status(200).json(dashboardData);
        } else {
            res.status(404).json({ message: "No dashboard details found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get Dashboard data
exports.getOneDashboard = async (req, res) => {
    try {
        const { currentDate } = req.params;
        console.log("Dashboard data in ",currentDate);
        const channelCount = await channels.countDocuments();
        const musicCount = await musics.countDocuments();
        const totalAsset = channelCount + musicCount
        const dashboardData = await dashboard.findOne({
            date:date
        });    
  
        if (dashboardData) {
            res.status(200).json({dashboardData,totalAsset});
        } else {
            res.status(404).json({ message: "No dashboard details found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// Stat
exports.getStat = async (req, res) => {
    try {
        console.log("Stat");
        const dashboardData = await dashboard.find().sort({ date: -1 }).limit(2);

        if (dashboardData.length < 2) {
            res.status(404).json({ message: "Not enough dashboard data found to calculate percentage changes" });
            return;
        }

        const lastData = dashboardData[1];
        const secondLastData = dashboardData[0];        

        const calculatePercentageChange = (current, previous) => {
            if (previous === 0) {
                return current === 0 ? 0 : 100; // Handle division by zero
            }
            return ((current - previous) / previous) * 100;
        };

        const result = {
            percentageChanges: {
                lastDate:lastData.date,
                secondLastDate:secondLastData.date,
                totalLicensor: calculatePercentageChange(lastData.totalLicensor, secondLastData.totalLicensor).toFixed(2),
                totalChannel: calculatePercentageChange(lastData.totalChannel, secondLastData.totalChannel).toFixed(2),
                totalMusic: calculatePercentageChange(lastData.totalMusic, secondLastData.totalMusic).toFixed(2),
                channelCommission: calculatePercentageChange(lastData.channelCommission, secondLastData.channelCommission).toFixed(2),
                channelTaxDeducted: calculatePercentageChange(lastData.channelTaxDeducted, secondLastData.channelTaxDeducted).toFixed(2),
                totalCommission: calculatePercentageChange(lastData.totalCommission, secondLastData.totalCommission).toFixed(2),
                totalTaxDeducted: calculatePercentageChange(lastData.totalTaxDeducted, secondLastData.totalTaxDeducted).toFixed(2),
                musicCommission: calculatePercentageChange(lastData.musicCommission, secondLastData.musicCommission).toFixed(2),
            }
        };

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// Channel highest revenue 
exports.getSortedChannelsByRevenue = async (req, res) => {
    try {
        // Fetch all channels
        const channel = await channels.find();

        // Calculate cumulative revenue for each channel
        channel.forEach(channel => {
            const totalRevenue = channel.assets.reduce((acc, asset) => {
                return acc + parseFloat(asset.partnerRevenue);
            }, 0);
            channel.totalRevenue = totalRevenue;
        });

        // Sort channels by total revenue in descending order
        channel.sort((a, b) => b.totalRevenue - a.totalRevenue);

        // Format the response
        const sortedChannels = channel.map(channel => ({
            channelId: channel.channelId,
            channelName: channel.channelName,
            totalRevenue: channel.totalRevenue.toFixed(2) 
        }));

        res.status(200).json(sortedChannels);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// Music highest revenue 
exports.getSortedMusicsByRevenue = async (req, res) => {
    try {
        // Fetch all channels
        const music = await musics.find();

        // Calculate cumulative revenue for each music
        music.forEach(music => {
            const totalRevenue = music.assets.reduce((acc, asset) => {
                return acc + parseFloat(asset.partnerRevenue);
            }, 0);
            music.totalRevenue = totalRevenue;
        });

        // Sort channels by total revenue in descending order
        music.sort((a, b) => b.totalRevenue - a.totalRevenue);

        // Format the response
        const sortedMusics = music.map(music => ({
            musiclId: music.musicId,
            musicName: music.musicName,
            totalRevenue: music.totalRevenue.toFixed(2) 
        }));

        res.status(200).json(sortedMusics);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};




//Dashboard card 1
exports.getOneMonthDashboard = async (req, res) => {
    try {
        const { currentDate } = req.params;
        console.log("Dashboard data for ", currentDate);

        // Parse the current date
        const [currentMonth, currentYear] = currentDate.split(' ');
        const monthNames = ["January", "February", "March", "April", "May", "June", 
                            "July", "August", "September", "October", "November", "December"];
        
        const currentMonthIndex = monthNames.indexOf(currentMonth);
        const currentYearInt = parseInt(currentYear);

        // Calculate the previous month and year
        let prevMonthIndex = currentMonthIndex - 1;
        let prevYearInt = currentYearInt;
        if (prevMonthIndex < 0) {
            prevMonthIndex = 11; // December
            prevYearInt = currentYearInt - 1;
        }
        const prevMonth = monthNames[prevMonthIndex];
        const prevDate = `${prevMonth} ${prevYearInt}`;

        
        // Fetch the dashboard data
        const dashboards = await dashboard.find({}).sort({ date: 1 }).exec();
        if (!dashboards.length) {
            return res.status(404).json({ message: "No dashboard details found" });
        }

        

        // Find the current dashboard data index
        const currentDashboardIndex = dashboards.findIndex(d => d.date === currentDate);
        if (currentDashboardIndex === -1) {
            return res.status(200).json({
                currentDashboardData: {
                    totalLicensor: 0,
                    totalChannel: 0,
                    totalMusic: 0,
                    channelCommission: 0,
                    musicCommission: 0,
                    totalCommission: 0
                    // Add other fields as needed
                },
                currentAsset: 0,
                prevDashboardData: null,
                percentageChanges: {
                    channelCommission: 0,
                    musicCommission: 0,
                    totalAsset: 0,
                    totalCommission: 0,
                    // Add other fields as needed
                }
            });
        }

        const currentDashboardData = dashboards[currentDashboardIndex];
        const prevDashboardData = dashboards.find(d => d.date === prevDate);

        // Calculate total assets
        const currentAsset = currentDashboardData ? 
            (parseInt(currentDashboardData.totalChannel || 0) + parseInt(currentDashboardData.totalMusic || 0)) : 0;

        // Prepare response object
        const responseObject = {
            currentDashboardData: currentDashboardData || {
                totalChannel: 0,
                totalMusic: 0,
                channelCommission: 0,
                musicCommission: 0,
                totalCommission: 0
                // Add other fields as needed
            },
            currentAsset,
        };

        // Initialize variables to zero if previous data doesn't exist
        if (!prevDashboardData) {
            responseObject.prevDashboardData = null;
            responseObject.percentageChanges = {
                channelCommission: 0,
                musicCommission: 0,
                totalAsset: 0,
                totalCommission: 0,
                // Add other fields as needed
            };
        } else {
            const prevAsset = parseInt(prevDashboardData.totalChannel || 0) + parseInt(prevDashboardData.totalMusic || 0);

            // Calculate percentage changes function
            const calculatePercentageChange = (current, previous) => {
                if (previous === 0) {
                    return current === 0 ? 0 : 100; // Handle division by zero
                }
                return ((current - previous) / Math.abs(previous)) * 100;
            };

            // Calculate percentage changes for relevant fields
            responseObject.percentageChanges = {
                channelCommission: calculatePercentageChange(currentDashboardData.channelCommission, prevDashboardData.channelCommission).toFixed(1),
                musicCommission: calculatePercentageChange(currentDashboardData.musicCommission, prevDashboardData.musicCommission).toFixed(1),
                totalAsset: calculatePercentageChange(currentAsset, prevAsset).toFixed(1),
                totalCommission: calculatePercentageChange(currentDashboardData.totalCommission, prevDashboardData.totalCommission).toFixed(1),
                // Add other fields as needed
            };

            responseObject.prevDashboardData = prevDashboardData;
        }

        res.status(200).json(responseObject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};



// Get the last 6 entries from the fileLog collection
exports.getLastFileLogs = async (req, res) => {
    try {
        const logs = await fileLog.find().sort({ _id: -1 }).limit(6);
        res.status(200).json(logs);
    } catch (error) {
        console.error("Error fetching file logs:", error);
        res.status(500).json({ message: "Error fetching file logs" });
    }
};




