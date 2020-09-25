const path = require("path");

module.exports = {
    mode: "development",
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        port: 8080,
        compress: true,
        hot: true,
        https: true
    },
    devtool: "inline-source-map"
};