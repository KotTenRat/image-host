module.exports = {
    oauth: { // replace this value with false if you don't want to integrate OAuth into your instance
        botToken: "[REDACTED]",
        clientSecret: "[REDACTED]",
        clientID: "123",
        callback: "https://your-main.domain/login/return",
        guildID: "234",
        roleID: "345"
    },
    cloudflare: { // replace this value with false if you don't want to integrate Cloudflare subdomains into your instance
        ip: "1.1.1.1", // replace this with your server/hosting provider's IP
        email: "example@gmail.com",
        key: "0123456789abcdef",
        ratelimit: 1000 * 60 * 60 // set to 0 for no ratelimit
    },
    uploading: {
        sizeLimit: 25 * 1024 * 1024, // put at Infinity for no limit
        keyLengthLimit: 1024, // same Infinity trick as above
        uploadRatelimit: 2500 // 0 for no ratelimit
    },
    http: {
        protocol: "spdy", // can be one of "http" or "spdy" (will fallback to less advanced protocol if needed)
        https: { // replace with false to disable https
            key: "cert/key.pem",
            cert: "cert/fullchain.pem",
            port: 443
        },
        port: 80
    },
    name: "Dapper Image Host"
};