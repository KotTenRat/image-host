# Dapper Image Host
Dapper Image Host is an open-source image host featuring encryption, embedding (on Discord and other social media), and Discord OAuth2 integration.

There is no longer a live version running :(

Feel free to fork this, host your own version, or whatever you want - this is open source, after all.

### Self-Hosting
Simply cloning this repository will not create a completely ready-to-use self-hosting instance. You must follow these steps:
- Copy `config.example.js` to `config.js`, then fill it in however you want.
- Create a `keys.txt` file and fill it in with keys delimited by newlines in this format:
  ```
  <key> [# <optional comment>]
  ```
  These keys will provide access to the API.
- Go to the `configcreator` directory, run `npm run build` to build the Vue files, then copy the resulting `dist` files (along with the included HTML and CSS) files into a new directory, `web-src/config`.
- Run `npm run build-web` to minify the web files. This should create a `web` directory. Alternatively, if you prefer not minifying your files (why?), just copy the `web-src` directory to `web`.
- Create an `images` folder in the root of the project.
- Create a `domains.txt` file and fill it with newline-delimited domains for your image host.
- Don't forget that this whole time, you should `npm i` the dependencies.

### Contributing
I'm open to PRs and issues. I don't work on this project that much, but I will try to appropriately review and accept changes.

### License
For license information, see [LICENSE.md](LICENSE.md).
