const rawchannels = require('../database/model/rawchannel');
const channels = require("../database/model/channel");
const csv = require('csvtojson');
const fs = require('fs');

const importChannel = async (req, res) => {
    try {
        await clearRawChannels();
        console.log("Existing records deleted.");

        const formattedDate = getCurrentFormattedDate();
        console.log("Starting CSV parsing...");

        const aggregatedData = await parseCSV(req.file.path, formattedDate);

        console.log("CSV processing completed");
        await rawchannels.insertMany(aggregatedData);
        console.log("Data inserted into the database.");

        await autoUpdateChannels();
        res.status(200).send({ success: true, msg: 'Channel CSV Extracted Successfully' });
    } catch (error) {
        console.error("Error during import process:", error);
        res.status(400).send({ success: false, msg: error.message });
    }
};

const clearRawChannels = async () => {
    await rawchannels.deleteMany({});
};

const getCurrentFormattedDate = () => {
    const currentDate = new Date();
    const month = currentDate.toLocaleString('en-US', { month: 'long' });
    const year = currentDate.getFullYear();
    return `${month} ${year}`;
};

const parseCSV = (filePath, formattedDate) => {
    return new Promise((resolve, reject) => {
        const aggregatedData = {};
        const fileStream = fs.createReadStream(filePath);

        csv({
            delimiter: ',',
            noheader: false,
            headers: [
                'Adjustment Type',
                'Day',
                'Country',
                'Asset ID',
                'Asset Title',
                'Asset Labels',
                'Asset Channel ID',
                'Asset Type',
                'Custom ID',
                'ISRC',
                'UPC',
                'GRid',
                'Artist',
                'Album',
                'Label',
                'Administer Publish Rights',
                'Owned Views',
                'YouTube Revenue Split : Auction',
                'YouTube Revenue Split : Reserved',
                'YouTube Revenue Split : Partner Sold YouTube Served',
                'YouTube Revenue Split : Partner Sold Partner Served',
                'YouTube Revenue Split',
                'Partner Revenue : Auction',
                'Partner Revenue : Reserved',
                'Partner Revenue : Partner Sold YouTube Served',
                'Partner Revenue : Partner Sold Partner Served',
                'Partner Revenue'
            ]
        })
            .fromStream(fileStream)
            .subscribe(
                (row) => {
                    if (row['Asset Channel ID']) {
                        const channelId = row['Asset Channel ID'];
                        const partnerRevenue = parseFloat(row['Partner Revenue'] || 0);
                        const country = row['Country'];

                        if (!aggregatedData[channelId]) {
                            aggregatedData[channelId] = {
                                channelId,
                                date: formattedDate,
                                partnerRevenue,
                                usRevenue: country === 'US' ? partnerRevenue : 0
                            };
                        } else {
                            aggregatedData[channelId].partnerRevenue += partnerRevenue;
                            if (country === 'US') {
                                aggregatedData[channelId].usRevenue += partnerRevenue;
                            }
                        }
                    }
                },
                (error) => {
                    console.error("Error during CSV processing:", error);
                    reject(error);
                },
                () => {
                    resolve(Object.values(aggregatedData));
                }
            );
    });
};

const autoUpdateChannels = async () => {
    try {
        const rawChannels = await rawchannels.find();
        console.log("Channel Auto Updating ....");

        const updatePromises = rawChannels.map(async (rawChannel) => {
            const existingChannel = await channels.findOne({ channelId: rawChannel.channelId });

            if (existingChannel) {
                const dateExists = existingChannel.assets.some(asset => asset.date === rawChannel.date);

                if (!dateExists) {
                    existingChannel.assets.push({
                        date: rawChannel.date,
                        partnerRevenue: rawChannel.partnerRevenue,
                        usRevenue: rawChannel.usRevenue || 0,
                    });
                    await existingChannel.save();
                    console.log(`Channel with ID ${rawChannel.channelId} updated successfully`);
                } else {
                    // console.log(`Date ${rawChannel.date} already exists for channel ID ${rawChannel.channelId}, skipping update`);
                }

                await rawchannels.deleteOne({ channelId: rawChannel.channelId });
                console.log(`Raw channel with ID ${rawChannel.channelId} deleted successfully`);
            } else {
                // console.log(`Channel with ID ${rawChannel.channelId} not found in existing channels`);
            }
        });

        await Promise.all(updatePromises);
        console.log("Channels auto updated successfully");
    } catch (error) {
        console.error("Error updating channels:", error);
    }
};

module.exports = {
    importChannel
};
