const path = require("path");
const fs = require("fs");
const {minify: minifyJS} = require("terser");
const CleanCSS = require("clean-css");
const {minify: minifyHTML} = require("html-minifier");
const rimraf = require("rimraf");

const clean = new CleanCSS();

async function forFiles(files, paths) {
    for (const file of files) {
        const resolved = path.resolve(...paths, file);
        const distResolved = path.resolve("web", ...paths.slice(1), file);
        const stat = fs.statSync(resolved);
        if (stat.isDirectory()) {
            fs.mkdirSync(distResolved);
            console.log(`-- ENTERING DIRECTORY ${resolved} --`);
            await forFiles(fs.readdirSync(resolved), [...paths, file]);
            console.log(`-- LEAVING DIRECTORY ${resolved} --`);
        }
        else {
            const ext = path.extname(file);
            if (ext === ".js") {
                fs.writeFileSync(distResolved, (await minifyJS(fs.readFileSync(resolved).toString())).code);
                console.log(`Minified ${resolved}`);
            } else if (ext === ".css") {
                fs.writeFileSync(distResolved, clean.minify(fs.readFileSync(resolved).toString()).styles);
                console.log(`Minified ${resolved}`);
            } else if (ext === ".html") {
                fs.writeFileSync(distResolved, minifyHTML(fs.readFileSync(resolved).toString(), {
                    collapseWhitespace: true,
                    quoteCharacter: "\"",
                    removeComments: true,
                    sortClassName: true,
                    sortAttributes: true,
                    removeAttributeQuotes: true
                }));
                console.log(`Minified ${resolved}`);
            } else if ([".ico"].includes(ext)) {
                fs.copyFileSync(resolved, distResolved);
                console.log(`Copied ${resolved}`);
            }
        }
    }
}

rimraf("web", () => {
    fs.mkdirSync("web");
    forFiles(fs.readdirSync("web-src"), ["web-src"]);
});