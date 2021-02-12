module.exports = {
    oauth: { // replace oauth with false if you don't want to integrate OAuth into your instance
        botToken: "[REDACTED]",
        clientSecret: "[REDACTED]",
        clientID: "741104945905926226",
        callback: "https://iplogger.click/login/return",
        guildID: "755484087514300486",
        roleID: "755484169064284334"
    },
    uploading: {
        sizeLimit: 25 * 1024 * 1024, // put at Infinity for no limit
        keyLengthLimit: 1024, // same Infinity trick as above
        uploadRatelimit: 2500 // 0 for no ratelimit
    },
    name: "Dapper Image Host",
    port: 12055
};