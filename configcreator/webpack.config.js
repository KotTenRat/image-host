const path = require("path");
const {VueLoaderPlugin} = require("vue-loader");
const merge = require("webpack-merge").default;

module.exports = (env, argv) => {
    let thing = merge({
        entry: "./src/main.js",
        output: {
            filename: "main.js",
            path: path.resolve(__dirname, "dist")
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: "babel-loader"
                },
                {
                    test: /\.vue$/,
                    loader: "vue-loader",
                },
                {
                    test: /\.css$/,
                    use: [
                        "vue-style-loader",
                        "css-loader"
                    ]
                }
            ]
        },
        plugins: [
            new VueLoaderPlugin()
        ]
    }, require(argv.mode === "development" ? "./webpack.config.dev.js" : "./webpack.config.prod.js"));
    return thing;
}