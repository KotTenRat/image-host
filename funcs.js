const fs = require("fs");
const {deletionHashes, encryptionHashes, embedData, expiryData} = require("./databases");

const deleteFile = module.exports.deleteFile = name => {
    deletionHashes.delete(name);
    encryptionHashes.delete(name);
    embedData.delete(name);
    expiryData.delete(name);
    return new Promise((resolve, reject) => {
        fs.unlink(`images/${name}`, err => {
            if (err) {
                reject(err);
            } else resolve();
        });
    });
};