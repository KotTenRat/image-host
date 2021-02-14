# Dapper Image Host
Dapper Image Host is an open-source image host featuring encryption, embedding (on Discord and other social media), and Discord OAuth2 integration.

There is no longer a live version running :(

Feel free to fork this, host your own version, or do whatever you want - this is open source, after all.

### Self-Hosting
Simply cloning this repository will not create a completely ready-to-use self-hosting instance. You must follow these steps:
- Copy `config.example.js` to `config.js`, then fill it in however you want.
- Do the same with `config.js` in `web-src/src/config/config.js`.
- Create a `keys.txt` file and fill it in with keys delimited by newlines in this format:
  ```
  <key> [# <optional comment>]
  ```
  These keys will provide access to the API.
  - Here's an example:
    ```shell
    YaLipMIj2nzYFnNrufVwTc4HTwC7Uqgc # my best friend
    dHvTr2Bkcn47RuJ7Ryf277yImq6RGPkh # me
    CzPdbFz618xBXArzitdYK89tMgtP1xSj
    kwsgQ274P6STT1hy1lCm7dXAF9v9TsO2 # that random guy I met
    ```
- Go to the `web-src` directory, run `npm i` to install the dependencies, and then run `npm run build` to build the website. You should see a new directory, `web`, appear.
  - If you want to modify the website, then you can run `npm run dev` to start up a development server, then, once you're ready, run `npm run build`.
- Run `npm run build-web` to minify the web files. This should create a `web` directory. Alternatively, if you prefer not minifying your files (why?), just copy the `web-src` directory to `web`.
  - Running `build-web` may come up with some missing-dependency-related errors. To fix them, `cd` to `scripts/build-web`, then `npm i`.
- Create an `images` folder in the root of the project.
- Create a `domains.txt` file and fill it with newline-delimited domains for your image host.
  - Here's an example:
    ```text
    example.com
    image.host
    ```  
- If ever any "module not found" (or something along those lines) errors occur, double-check that you've `npm i`ed your dependencies!

### Contributing
I'm open to PRs and issues. I don't work on this project that much, but I will try to appropriately review and accept changes.

### License
For license information, see [LICENSE.md](LICENSE.md).
