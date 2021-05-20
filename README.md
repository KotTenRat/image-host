Actually, i did not realized that dapper-gh deleted the project.
This is one of newer forks.
# IT'S NOT MADE BY ME BUT https://github.com/dapper-gh/

Dapper Image Host
Dapper Image Host is an open-source image host featuring encryption, embedding (on Discord and other social media), Cloudflare integration, and Discord OAuth2 integration.

There is no longer a live version running :(

Feel free to fork this, host your own version, or do whatever you want - this is open source, after all.

### Self-Hosting
Simply cloning this repository will not create a completely ready-to-use self-hosted instance. You must follow these steps:
- Copy `config.example.js` to `config.js`, then fill it in however you want. The comments in the file have useful information.
- Do the same with `config.example.js` in `web-src/src/config`.
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
- Go to the `web-src` directory, run `npm i` to install the dependencies, and then run `npm run build` to build the website. You should see a new directory, `web`, appear in the project root.
  - If you want to modify the website, then you can run `npm run dev` within `web-src` to start up a development server, then, once you're ready, run `npm run build` to rebuild the website.
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
