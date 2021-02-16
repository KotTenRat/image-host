const http = function() {
    const http = require("http");
    const https = require("https");
    return {
        createHTTP: http.createServer,
        createHTTPS: https.createServer
    };
};

// TODO: use native require("http2") (blocked on https://github.com/expressjs/express/pull/3730)

const spdy = function() {
    const spdy = require("spdy");
    const http = require("http");

    return {
        createHTTP: http.createServer,
        createHTTPS: function(opts, handler) {
            if (arguments.length === 1) {
                handler = opts;
                opts = {};
            }
            return spdy.createServer(opts, handler);
        }
    };
};

module.exports = {
    http,
    spdy
};