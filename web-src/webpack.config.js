const {VueLoaderPlugin} = require("vue-loader");
const HtmlPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const PreloadPlugin = require("@vue/preload-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const path = require("path");
const purgecss = require("@fullhuman/postcss-purgecss");
const glob = require("glob");

const favicon = glob.sync("src/favicon.*").sort((a, b) => (a < b) - (a > b))[0] || null;
// The above is a convenient way to prioritize images by web-ready-ness. WEBP > PNG > JPG > ICO

module.exports = (env, argv) => ({
    entry: "./src/main.js",

    output: {
        path: path.resolve(__dirname, "../web"),
        filename: "main.js"
    },

    module: {
        rules: [
            {
                test: /\.vue$/i,
                loader: "vue-loader"
            },
            {
                test: /\.css$/i,
                use: [
                    "vue-style-loader",
                    argv.mode === "production" ? MiniCssExtractPlugin.loader : "style-loader",
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                plugins: [
                                    "tailwindcss",
                                    "autoprefixer"
                                ].concat(argv.mode === "production" ? [
                                    purgecss({
                                        content: [
                                            "./src/**/*.html",
                                            "./src/**/*.vue"
                                        ]
                                    }),
                                    "cssnano"
                                ] : [])
                            }
                        }
                    }
                ]
            },
            {
                test: /\.(?:png|gif|ico|jpe?g|webp|avif|svg)$/i,
                use: {
                    loader: "url-loader",
                    options: {
                        limit: 4096
                    }
                }
            },
            {
                test: /\.txt$/i,
                use: "file-loader"
            }
        ].concat(argv.mode === "production" ? [
                {
                    test: /\.[mc]?js$/i,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                "@babel/preset-env"
                            ],
                            plugins: [
                                "@babel/plugin-syntax-dynamic-import"
                            ]
                        }
                    }
                }
            ] : [])
    },
    plugins: glob.sync("src/**/index.html").map(f =>
        new HtmlPlugin(Object.assign({
            template: f,
            filename: f.split("/").slice(1).join("/"),
            meta: {
                referer: "no-referrer",
                keywords: "sharex, image host, dapper, uploader, files, sxcu, pomf",
                author: require("./package.json").author
            },
            hash: argv.mode === "production"
        }, favicon === null ? {} : {favicon}))
    ).concat([
        new VueLoaderPlugin()
    ]).concat(argv.mode === "production" ? [
        new PreloadPlugin(),
        new MiniCssExtractPlugin()
    ] : []),

    optimization: {
        minimize: argv.mode === "production",
        minimizer: [
            new TerserPlugin()
        ],
        splitChunks: {
            chunks: argv.mode === "production" ? "all" : "async"
        }
    }
});